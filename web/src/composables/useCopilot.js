import { ref } from 'vue'
import { usePonds } from './usePonds'
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
  const { activePond } = usePonds()
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
      text: `☀ **BRIEFING PAGI (KOLAM #4)**\n\nRingkasan 24 jam:\n• **Oksigen terlarut (DO)**: 6.2 mg/L\n• **pH**: 7.5 | **Suhu**: 28.5°C\n• **TAN**: 0.02 mg/L\n• **Kepadatan bioflok**: 12 mL/L\n\nJendela pakan yang dijadwalkan: **5.2 kg** pada 14:00 WIB. Data ini SIMULASI.`,
      englishCaption: 'Morning briefing, Pond #4. Dissolved oxygen 6.2 mg/L, pH 7.5, temperature 28.5°C, TAN 0.02 mg/L, biofloc 12 mL/L. Scheduled feed window: 5.2 kg at 14:00 WIB. This data is simulated.'
    },
    {
      id: 'm2',
      role: 'user',
      senderName: 'Supervisor (Ilfa)',
      timestamp: '08:02 WIB',
      text: 'Confirm 5.2 kg feed for Pond #4.'
    },
    {
      id: 'm3',
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: '08:02 WIB',
      text: 'Supervisor instruction received. Dissolved oxygen and temperature in the briefing support a feed proposal. Approving writes an audit row only.',
      actionCard: {
        id: 'act-101',
        title: 'Supervisor Authorization Required',
        pondId: 'K04',
        type: 'FEEDER_DISPENSE',
        amountKg: 5.2,
        targetDevice: 'Proposed feed (simulated)',
        description: 'Propose 5.2 kg feed for Pond #4. Approve records executed_simulated. No hardware command is sent.',
        status: 'pending'
      }
    }
  ])

  const postToolDecision = async (actionCard, decision) => {
    if (!actionCard || actionCard.status !== 'pending' || actionCard.isSubmitting) return

    const toolCallId = actionCard.toolCallId || actionCard.id
    if (!toolCallId) {
      showToast('No tool-call id. Nothing was recorded.', 'error')
      pushAssistant(messages, 'No tool-call id was present. Nothing was recorded. No hardware command was sent.')
      return
    }

    actionCard.isSubmitting = true
    const path = decision === 'approve' ? 'approve' : 'reject'

    try {
      const response = await fetch(`/api/tool-calls/${encodeURIComponent(toolCallId)}/${path}`, {
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

    setTimeout(() => {
      isThinking.value = false
      const lower = userText.toLowerCase()
      const pond = activePond.value

      let replyText = ''
      let englishCaption = ''
      let isBriefing = false
      let newActionCard = null

      if (lower.includes('briefing') || lower.includes('morning') || lower.includes('summary')) {
        isBriefing = true
        const tan = pond.telemetry.ammonia
        replyText = `☀ **BRIEFING (${pond.name.toUpperCase()})**\n\nRingkasan 24 jam:\n• **Oksigen terlarut (DO)**: ${pond.telemetry.do} mg/L\n• **pH**: ${pond.telemetry.ph} | **Suhu**: ${pond.telemetry.temp}°C\n• **TAN**: ${tan} mg/L\n• **Kepadatan bioflok**: ${pond.telemetry.flocDensity} mL/L\n\nData ini SIMULASI.`
        englishCaption = `Briefing for ${pond.name}. Dissolved oxygen ${pond.telemetry.do} mg/L, pH ${pond.telemetry.ph}, temperature ${pond.telemetry.temp}°C, TAN ${tan} mg/L, biofloc ${pond.telemetry.flocDensity} mL/L. This data is simulated.`
      } else if (lower.includes('molasses') || lower.includes('c/n') || lower.includes('carbon') || lower.includes('ammonia') || lower.includes('sugar')) {
        replyText = `🧪 **TAN ${pond.telemetry.ammonia} mg/L** on ${pond.name}. A molasses amount is not calculated in the browser. Ask the API for a cited dose. Approving a proposal records executed_simulated and does not send a hardware command.`
      } else if (lower.includes('feed') || lower.includes('pakan') || lower.includes('dispense')) {
        replyText = `🐟 **FEEDING & FCR ANALYSIS:**\n\nCurrent estimated biomass is **${Math.round(pond.fishCount * pond.avgWeightGrams / 1000)} kg**. Based on metabolic curves at ${pond.telemetry.temp}°C and DO of ${pond.telemetry.do} mg/L, optimum daily ration is 3.0% of body weight split across 4 feeding windows.\n\nThis window requires **5.2 kg** of 32% protein BioGrow-7 pellets.`

        newActionCard = {
          id: 'act-' + Date.now(),
          title: 'Authorize Feed Dispensing',
          pondId: pond.id,
          type: 'FEEDER_DISPENSE',
          amountKg: 5.2,
          targetDevice: 'Proposed feed (simulated)',
          description: `Propose 5.2 kg feed for ${pond.name}. Approve records executed_simulated. No hardware command is sent.`,
          status: 'pending'
        }
      } else if (lower.includes('emergency') || lower.includes('oxygen') || lower.includes('hypoxia') || lower.includes('aerat')) {
        replyText = `🚨 **BIOFLOC EMERGENCY PROTOCOL (LOW DO):**\n\nCurrent DO is detected at **${pond.telemetry.do} mg/L**. Safe operating threshold for biofloc is >= 5.0 mg/L.\n\n**Immediate Recommendation:**\nBoost aeration blower/paddlewheel VFD to 100% immediately and pause feeding temporarily to reduce Biological Oxygen Demand (BOD).`

        newActionCard = {
          id: 'act-' + Date.now(),
          title: 'Authorize 100% Aeration Boost',
          pondId: pond.id,
          type: 'AERATOR_BOOST',
          targetDevice: 'Proposed aeration (simulated)',
          description: 'Propose an aeration increase. Approve records executed_simulated. No hardware command is sent.',
          status: 'pending'
        }
      } else {
        replyText = `🤖 **Sampay Co-Pilot:**\n\nInstruction "${userText}" received. Current telemetry for ${pond.name}: DO ${pond.telemetry.do} mg/L, pH ${pond.telemetry.ph}, Temp ${pond.telemetry.temp}°C, TAN ${pond.telemetry.ammonia} mg/L. Would you like a morning briefing?`
      }

      pushAssistant(messages, replyText, {
        isBriefing,
        englishCaption,
        actionCard: newActionCard
      })
    }, 750)
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
