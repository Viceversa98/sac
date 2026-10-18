import { ref } from 'vue'
import { apiUrl } from '../api'
import { useToast } from './useToast'
import { usePonds } from './usePonds'

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

const readableReply = (text, card) => {
  const raw = String(text || '').trim()
  const looksLikeJson = /^[`{[]/.test(raw) || /"refuse"/.test(raw)
  if (card && (looksLikeJson || !raw)) return card.summary
  if (raw && !/^[a-z]+(?:_[a-z]+)+$/.test(raw)) return raw
  return card?.summary || raw
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
  if (!sharedCopilot) sharedCopilot = createCopilot()
  return sharedCopilot
}

let sharedCopilot

function createCopilot() {
  const { showToast } = useToast()
  const { applyApprovedAction, refreshFromApi } = usePonds()

  const isThinking = ref(false)
  const autoPilotMode = ref(false)

  const openingMessages = () => [
    {
      id: 'm1',
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: '08:00 WIB',
      isBriefing: true,
      text: 'Morning briefing, Pond A. Dissolved oxygen 3.1 mg/L, Low. The low in this file is 2.4 mg/L at 04:00. This data is simulated.',
      englishCaption: 'Morning briefing, Pond A. Dissolved oxygen 3.1 mg/L, Low. The low in this file is 2.4 mg/L at 04:00. This data is simulated.'
    },
    {
      id: 'm2',
      role: 'user',
      senderName: 'Supervisor (Ilfa)',
      timestamp: '08:02 WIB',
      text: 'Confirm the morning feed for Pond A.'
    },
    {
      id: 'm3',
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: '08:02 WIB',
      text: 'Supervisor instruction received. Dissolved oxygen and temperature in the briefing support a feed proposal. Approving writes an audit row only.',
    }
  ]

  const messages = ref(openingMessages())

  const pondLabel = (id) => `Pond ${id || 'unknown'}`

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

  const cardStatus = (call) => {
    if (call.status === 'proposed') return 'pending'
    if (call.status === 'blocked') return 'blocked'
    if (call.status === 'executed_simulated' || call.status === 'approved') return 'approved'
    return 'cancelled'
  }

  const cardFromCall = (call) => {
    const words = describeCall(call)
    const status = cardStatus(call)
    const title = status === 'pending' ? 'Needs your decision' : (status === 'blocked' ? 'REFUSED' : (status === 'approved' ? 'Recorded' : 'Cancelled'))
    return {
      id: String(call.id),
      toolCallId: String(call.id),
      title,
      pondId: call.pond_id,
      type: call.tool_name,
      targetDevice: words.label,
      summary: words.summary,
      description: words.detail,
      status
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
        await refreshFromApi()
        const result = applyApprovedAction(actionCard.type, actionCard.pondId)
        window.dispatchEvent(new Event('sampay-audit-changed'))
        const reading = result
          ? ` Simulated pond quality for ${result.name}: oxygen ${Number(result.do).toFixed(2)} mg/L, ammonia (TAN) ${Number(result.ammonia).toFixed(3)} mg/L.`
          : ''
        actionCard.resultNote = reading.trim()
        showToast(`Approved.${reading} No equipment was switched on.`, 'success')
        pushAssistant(
          messages,
          `Approved. The decision was recorded.${reading} No hardware command was sent.`
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

  const showDecision = async (draft, data, already = '') => {
    const listed = Array.isArray(data.proposals) && data.proposals.length ? data.proposals : [data.tool_call]
    const proposals = listed.filter((call) => call && (call.status === 'proposed' || call.status === 'blocked'))
    const card = proposals[0] ? cardFromCall(proposals[0]) : null
    const reply = readableReply(already || data.reply, card) || 'The API returned an empty reply.'
    if (already) draft.text = reply
    else await typeInto(draft, reply)
    draft.actionCard = card
    draft.streaming = false
    for (const extra of proposals.slice(1)) {
      const extraCard = cardFromCall(extra)
      pushAssistant(messages, extraCard.summary, { actionCard: extraCard })
    }
  }

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
      const body = wantsBriefing ? { lang: 'en' } : { message: userText, lang: 'en' }
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
            const duplicate = messages.value.some((message) => message.actionCard?.status === 'pending' && message.actionCard?.pondId === proposal.pond_id && message.actionCard?.type === proposal.tool_name)
            if (duplicate) continue
            const card = cardFromCall(proposal)
            pushAssistant(messages, card.summary, { actionCard: card })
          }
          return
        }
        await showDecision(draft, data)
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
          const duplicate = messages.value.some((message) => message.actionCard?.status === 'pending' && message.actionCard?.pondId === proposal.pond_id && message.actionCard?.type === proposal.tool_name)
          if (duplicate) continue
          const card = cardFromCall(proposal)
          pushAssistant(messages, card.summary, { actionCard: card })
        }
        return
      }

      await showDecision(draft, data, draft.text || data.reply)
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

  const loadQueue = async () => {
    for (const status of ['proposed', 'blocked', 'executed_simulated', 'rejected']) {
      try {
        const response = await fetch(apiUrl(`/api/tool-calls?status=${status}`), { headers: { Accept: 'application/json' } })
        if (!response.ok) continue
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
  }

  const reloadQueue = async (options = {}) => {
    messages.value = options.restoreOpening
      ? openingMessages()
      : messages.value.filter((message) => !message.actionCard?.toolCallId)
    await loadQueue()
  }

  if (typeof window !== 'undefined') {
    loadQueue()
  }

  return {
    messages,
    isThinking,
    autoPilotMode,
    sendMessage,
    authorizeAction,
    cancelAction,
    reloadQueue
  }
}
