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

  const cardFromCall = (call) => {
    const args = call.args && typeof call.args === 'object' ? call.args : {}
    const pending = call.status === 'proposed'
    return {
      id: String(call.id),
      toolCallId: String(call.id),
      title: pending ? 'Supervisor Authorization Required' : 'Blocked proposal',
      pondId: call.pond_id,
      type: call.tool_name,
      targetDevice: call.tool_name,
      description: call.rationale || args.reason || 'Proposal from the API. Approve records executed_simulated. No hardware command is sent.',
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

    try {
      const response = await fetch(apiUrl(wantsBriefing ? '/api/briefings' : '/api/chat'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(wantsBriefing ? { lang: 'id' } : { message: userText, lang: 'id' })
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data) {
        const message = data?.message || `The API returned ${response.status}.`
        showToast(message, 'error')
        pushAssistant(messages, `${message} Nothing was recorded. No hardware command was sent.`)
        return
      }

      if (wantsBriefing) {
        pushAssistant(messages, data.briefing || 'The API returned an empty briefing.', {
          isBriefing: true,
          englishCaption: data.english_caption || '',
          facts: Array.isArray(data.facts) ? data.facts : []
        })
        for (const proposal of data.proposals || []) {
          if (proposal.status !== 'proposed' && proposal.status !== 'blocked') continue
          pushAssistant(messages, proposal.rationale || proposal.tool_name, {
            actionCard: cardFromCall(proposal)
          })
        }
        return
      }

      const call = data.tool_call
      pushAssistant(messages, data.reply || 'The API returned an empty reply.', {
        actionCard: call ? cardFromCall(call) : null
      })
    } catch {
      showToast('API is unreachable.', 'error')
      pushAssistant(messages, 'The API is unreachable. Nothing was recorded. No hardware command was sent.')
    } finally {
      isThinking.value = false
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
        pushAssistant(messages, call.rationale || call.tool_name, { actionCard: cardFromCall(call) })
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
