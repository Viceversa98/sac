import { ref } from 'vue'
import { apiUrl } from '../api'
import { useToast } from './useToast'

const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB'

const pushAssistant = (messages, text, extra = {}) => {
  messages.value.push({
    id: 'm-' + Date.now(),
    role: 'assistant',
    senderName: 'Co-Pilot',
    timestamp: nowLabel(),
    text,
    ...extra
  })
}

const startDraft = (messages, extra = {}) => {
  const draft = {
    id: 'm-' + Date.now(),
    role: 'assistant',
    senderName: 'Co-Pilot',
    timestamp: nowLabel(),
    text: '',
    streaming: true,
    ...extra
  }
  messages.value.push(draft)
  return draft
}

const readEventStream = async (response, onToken) => {
  if (!response.body) throw new Error('The co-pilot returned an empty stream.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let donePayload = null

  const consume = (frame) => {
    if (!frame.trim()) return
    let event = 'message'
    const dataLines = []
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
    }
    if (!dataLines.length) return
    const data = JSON.parse(dataLines.join('\n'))
    if (event === 'token') onToken(typeof data.text === 'string' ? data.text : '')
    else if (event === 'done') donePayload = data
    else if (event === 'error') throw new Error(data.message || 'The co-pilot stream failed.')
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) consume(frame)
  }
  if (buffer.trim()) consume(buffer)
  return donePayload
}

const typeInto = async (draft, full) => {
  const text = full || ''
  draft.streaming = true
  const size = Math.max(1, Math.ceil(text.length / 48))
  for (let index = 0; index < text.length; index += size) {
    draft.text = text.slice(0, index + size)
    await new Promise((resolve) => setTimeout(resolve, 16))
  }
  draft.text = text
}

export function useCopilot() {
  const { showToast } = useToast()

  const isThinking = ref(false)
  const autoPilotMode = ref(false)

  const messages = ref([
    {
      id: 'm1',
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: '08:00 WIB',
      isBriefing: true,
      text: `Morning briefing, Kolam A. Dissolved oxygen 6.2 mg/L, pH 7.5, temperature 28.5°C, TAN 0.02 mg/L. This data is simulated.`,
      englishCaption: 'Morning briefing, Kolam A. Dissolved oxygen 6.2 mg/L, pH 7.5, temperature 28.5°C, TAN 0.02 mg/L. This data is simulated.'
    },
    {
      id: 'm2',
      role: 'user',
      senderName: 'Supervisor (Ilfa)',
      timestamp: '08:02 WIB',
      text: 'Confirm the morning feed for Kolam A.'
    },
    {
      id: 'm3',
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: '08:02 WIB',
      text: 'Supervisor instruction received. Dissolved oxygen and temperature in the briefing support a feed proposal. Approving writes an audit row only.',
    }
  ])

  const pondLabel = (id) => (id === 'A' || id === 'B' ? `Kolam ${id}` : `Pond ${id || 'unknown'}`)

  const describeCall = (call) => {
    const args = call.args && typeof call.args === 'object' ? call.args : {}
    const pond = pondLabel(call.pond_id || args.pond_id)
    const reason = typeof args.reason === 'string' ? args.reason : ''
    if (call.tool_name === 'start_aerator') {
      const minutes = args.duration_min
      return {
        summary: `${pond}: dissolved oxygen is low. Run the aerator${minutes ? ` for ${minutes} minutes` : ''}.`,
        detail: reason || 'Approving records the decision. The aerator stays off.',
        label: minutes ? `Aerator, ${minutes} min` : 'Run the aerator'
      }
    }
    if (call.tool_name === 'dose_molasses_gL') {
      const dose = args.g_per_L != null ? `${args.g_per_L} g/L` : 'the calculated dose'
      return {
        summary: `${pond}: add molasses at ${dose}.`,
        detail: reason || 'The dose was calculated in code. Approving records the decision only.',
        label: `Molasses ${dose}`
      }
    }
    if (call.tool_name === 'set_feeder_kg') {
      const kg = args.kg != null ? `${args.kg} kg` : 'the scheduled amount'
      return {
        summary: `${pond}: set the feeder to ${kg}.`,
        detail: reason || 'Approving records the decision. The feeder stays off.',
        label: `Feeder ${kg}`
      }
    }
    return {
      summary: `${pond}: a proposal is waiting for a decision.`,
      detail: reason || 'Approving records the decision. No hardware is switched on.',
      label: 'Proposal'
    }
  }

  const cardFromCall = (call) => {
    const words = describeCall(call)
    const pending = call.status === 'proposed'
    return {
      id: String(call.id),
      toolCallId: String(call.id),
      title: pending ? 'Needs your decision' : 'Blocked',
      pondId: call.pond_id,
      type: call.tool_name,
      targetDevice: words.label,
      summary: words.summary,
      description: words.detail,
      status: pending ? 'pending' : 'cancelled'
    }
  }

  const postToolDecision = async (actionCard, decision) => {
    if (!actionCard || actionCard.status !== 'pending' || actionCard.isSubmitting) return

    const toolCallId = actionCard.toolCallId || actionCard.id
    if (!/^\d+$/.test(String(toolCallId))) {
      showToast('This proposal has no API id. Nothing was recorded.', 'error')
      pushAssistant(messages, 'This proposal has no API id. Nothing was recorded. No hardware command was sent.')
      return
    }

    actionCard.isSubmitting = true
    const path = decision === 'approve' ? 'approve' : 'reject'

    try {
      const response = await fetch(apiUrl(`/api/tool-calls/${encodeURIComponent(toolCallId)}/${path}`), {
        method: 'POST',
        headers: { Accept: 'application/json' }
      })

      if (!response.ok) {
        showToast(`Could not ${decision} (${response.status}). Nothing was recorded.`, 'error')
        pushAssistant(
          messages,
          `The API returned ${response.status}. Nothing was recorded. No hardware command was sent.`
        )
        return
      }

      if (decision === 'approve') {
        actionCard.status = 'approved'
        showToast('Approved. Audit row recorded as executed_simulated.', 'success')
        pushAssistant(
          messages,
          'Approved. Status is executed_simulated. An audit row was recorded. No hardware command was sent.'
        )
        return
      }

      actionCard.status = 'cancelled'
      showToast('Rejected. The decision was recorded.', 'info')
      pushAssistant(messages, 'Rejected. The decision was recorded. No hardware command was sent.')
    } catch {
      showToast('API is unreachable. Nothing was recorded.', 'error')
      pushAssistant(messages, 'The API is unreachable. Nothing was recorded. No hardware command was sent.')
    } finally {
      actionCard.isSubmitting = false
    }
  }

  const authorizeAction = (actionCard) => postToolDecision(actionCard, 'approve')
  const cancelAction = (actionCard) => postToolDecision(actionCard, 'reject')

  const sendMessage = async (rawInput) => {
    if (!rawInput.trim() || isThinking.value) return

    const userText = rawInput.trim()

    messages.value.push({
      id: 'u-' + Date.now(),
      role: 'user',
      senderName: 'Supervisor (Ilfa)',
      timestamp: nowLabel(),
      text: userText
    })

    isThinking.value = true
    const lower = userText.toLowerCase()
    const wantsBriefing = lower.includes('briefing') || lower.includes('morning') || lower.includes('ringkasan')
    const draft = startDraft(messages)

    try {
      const body = wantsBriefing ? { lang: 'id' } : { message: userText, lang: 'id' }
      const streamPath = wantsBriefing ? '/api/briefings/stream' : '/api/chat/stream'
      const jsonPath = wantsBriefing ? '/api/briefings' : '/api/chat'
      let response = await fetch(apiUrl(streamPath), {
        method: 'POST',
        headers: { Accept: 'text/event-stream', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (response.status === 404) {
        response = await fetch(apiUrl(jsonPath), {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        const data = await response.json().catch(() => null)
        if (!response.ok || !data) {
          const message = data?.message || `The API returned ${response.status}.`
          showToast(message, 'error')
          draft.streaming = false
          draft.text = `${message} Nothing was recorded. No hardware command was sent.`
          return
        }
        if (wantsBriefing) {
          await typeInto(draft, data.briefing || 'The API returned an empty briefing.')
          draft.isBriefing = true
          draft.englishCaption = data.english_caption || ''
          draft.facts = Array.isArray(data.facts) ? data.facts : []
          draft.streaming = false
          for (const proposal of data.proposals || []) {
            if (proposal.status !== 'proposed' && proposal.status !== 'blocked') continue
            const card = cardFromCall(proposal)
            pushAssistant(messages, card.summary, { actionCard: card })
          }
          return
        }
        const call = data.tool_call
        const card = call ? cardFromCall(call) : null
        const reply = data.reply && !/^[a-z]+(?:_[a-z]+)+$/.test(String(data.reply).trim())
          ? data.reply
          : card?.summary
        await typeInto(draft, reply || 'The API returned an empty reply.')
        draft.actionCard = card
        draft.streaming = false
        return
      }

      const data = await readEventStream(response, (text) => {
        draft.text += text
      })
      if (!response.ok && !data) {
        const message = `The API returned ${response.status}.`
        showToast(message, 'error')
        draft.streaming = false
        draft.text = draft.text || `${message} Nothing was recorded. No hardware command was sent.`
        return
      }
      if (!data) {
        draft.streaming = false
        if (!draft.text) draft.text = 'The API returned an empty reply.'
        return
      }

      if (wantsBriefing) {
        if (!draft.text) draft.text = data.briefing || 'The API returned an empty briefing.'
        draft.isBriefing = true
        draft.englishCaption = data.english_caption || ''
        draft.facts = Array.isArray(data.facts) ? data.facts : []
        draft.streaming = false
        for (const proposal of data.proposals || []) {
          if (proposal.status !== 'proposed' && proposal.status !== 'blocked') continue
          const card = cardFromCall(proposal)
          pushAssistant(messages, card.summary, { actionCard: card })
        }
        return
      }

      const call = data.tool_call
      const card = call ? cardFromCall(call) : null
      if (!draft.text) {
        const reply = data.reply && !/^[a-z]+(?:_[a-z]+)+$/.test(String(data.reply).trim())
          ? data.reply
          : card?.summary
        draft.text = reply || 'The API returned an empty reply.'
      }
      draft.actionCard = card
      draft.streaming = false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'API is unreachable.'
      showToast(message, 'error')
      draft.streaming = false
      draft.text = draft.text || `${message} Nothing was recorded. No hardware command was sent.`
    } finally {
      isThinking.value = false
      draft.streaming = false
    }
  }

  const loadProposed = async () => {
    try {
      const response = await fetch(apiUrl('/api/tool-calls?status=proposed'), { headers: { Accept: 'application/json' } })
      if (!response.ok) return
      const data = await response.json()
      for (const call of data.tool_calls || []) {
        const already = messages.value.some((message) => message.actionCard?.toolCallId === String(call.id))
        if (already) continue
        const card = cardFromCall(call)
        pushAssistant(messages, card.summary, { actionCard: card })
      }
    } catch {
      // The canned briefing stays on screen when the API is down.
    }
  }

  if (typeof window !== 'undefined') {
    loadProposed()
  }

  return {
    messages,
    isThinking,
    autoPilotMode,
    sendMessage,
    authorizeAction,
    cancelAction
  }
}
