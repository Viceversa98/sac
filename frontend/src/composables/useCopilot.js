import { ref } from 'vue'
import { usePonds } from './usePonds'
import { useToast } from './useToast'

export function useCopilot() {
  const { activePond, triggerFeeder, setAeratorBoost, triggerMolassesDosing } = usePonds()
  const { showToast } = useToast()

  const isThinking = ref(false)
  const autoPilotMode = ref(false) // Co-Pilot (HITL) vs Auto-Pilot

  // Initial messages in English with feature name Co-Pilot
  const messages = ref([
    {
      id: 'm1',
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: '08:00 WIB',
      isBriefing: true,
      text: `☀ **DAILY MORNING BRIEFING (POND #4)**\n\nGood morning Supervisor! Here is the 24-hour water quality synthesis:\n• **Dissolved Oxygen**: 6.2 mg/L *(Optimal & Healthy)*\n• **Water pH**: 7.5 | **Temperature**: 28.5°C\n• **Ammonia Level**: 0.02 ppm *(Safe & Clean)*\n• **Biofloc Density**: 12 mL/L *(Healthy Microbial Floc)*\n\n**Feeding Recommendation:**\nWater conditions are optimal. Dispense **5.2 kg of BioGrow-7 pellets** at the scheduled 14:00 WIB feeding window.`
    },
    {
      id: 'm2',
      role: 'user',
      senderName: 'Supervisor (Ilfa)',
      timestamp: '08:02 WIB',
      text: 'Confirm 5.2 kg feed execution for Pond #4 now.'
    },
    {
      id: 'm3',
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: '08:02 WIB',
      text: 'Supervisor instruction received. Based on biofloc SOP evaluation, dissolved oxygen and temperature safely support immediate feeding.',
      actionCard: {
        id: 'act-101',
        title: 'Supervisor Authorization Required',
        pondId: 'K04',
        type: 'FEEDER_DISPENSE',
        amountKg: 5.2,
        targetDevice: 'Auto-Feeder Edge (ESP32-K04)',
        description: 'Auto-Feeder (ESP32-K04) is ready to dispense 5.2 kg feed to Pond #4.',
        status: 'pending' // 'pending' | 'approved' | 'cancelled'
      }
    }
  ])

  // Handle HITL action card response
  const authorizeAction = (actionCard) => {
    if (actionCard.status !== 'pending') return

    actionCard.status = 'approved'
    showToast(`✓ Action Authorized: Command dispatched to ${actionCard.targetDevice}`, 'success')

    // Execute corresponding IoT action
    if (actionCard.type === 'FEEDER_DISPENSE') {
      triggerFeeder(actionCard.pondId || 'K04', actionCard.amountKg || 5.2)
    } else if (actionCard.type === 'AERATOR_BOOST') {
      setAeratorBoost(actionCard.pondId || 'K04', 100)
    } else if (actionCard.type === 'MOLASSES_DOSE') {
      triggerMolassesDosing(actionCard.pondId || 'K04', actionCard.amountGrams || 350)
    }

    // Add confirmation Co-Pilot message
    messages.value.push({
      id: 'm-' + Date.now(),
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      text: `✅ **Action Executed Successfully:** Dispatch signal confirmed by **${actionCard.targetDevice}**. Actuator is currently active and pond sensors are being monitored for post-feeding biological response.`
    })
  }

  const cancelAction = (actionCard) => {
    if (actionCard.status !== 'pending') return
    actionCard.status = 'cancelled'
    showToast(`✕ Action cancelled by supervisor`, 'info')

    messages.value.push({
      id: 'm-' + Date.now(),
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      text: `❌ Command execution for **${actionCard.targetDevice}** was cancelled by the supervisor. System remains in standby mode.`
    })
  }

  // Send message and trigger agentic response
  const sendMessage = async (rawInput) => {
    if (!rawInput.trim() || isThinking.value) return

    const userText = rawInput.trim()
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB'

    // Push User message
    messages.value.push({
      id: 'u-' + Date.now(),
      role: 'user',
      senderName: 'Supervisor (Ilfa)',
      timestamp: nowTime,
      text: userText
    })

    isThinking.value = true

    // Simulate Agentic AI reasoning loop
    setTimeout(() => {
      isThinking.value = false
      const lower = userText.toLowerCase()
      const pond = activePond.value

      let replyText = ''
      let newActionCard = null

      if (lower.includes('briefing') || lower.includes('morning') || lower.includes('summary')) {
        replyText = `☀ **DAILY BRIEFING (${pond.name.toUpperCase()})**\n\nSensor synthesis from the last 24 hours:\n• **Dissolved Oxygen**: ${pond.telemetry.do} mg/L (${pond.telemetry.do >= 5 ? 'Optimal' : 'Caution Required'})\n• **pH Level**: ${pond.telemetry.ph} | **Temperature**: ${pond.telemetry.temp}°C\n• **Ammonia (TAN)**: ${pond.telemetry.ammonia} ppm (${pond.telemetry.ammonia < 0.05 ? 'Clean & Safe' : 'Elevated'})\n• **Biofloc Density**: ${pond.telemetry.flocDensity} mL/L\n\n**Operational Recommendation:**\nMicrobial flocs are active and healthy. Maintain continuous aeration at ${pond.actuators.aerator.powerPercent}% and adhere to standard feeding curve.`
      } else if (lower.includes('molasses') || lower.includes('c/n') || lower.includes('carbon') || lower.includes('ammonia') || lower.includes('sugar')) {
        const requiredMolassesGrams = Math.round((pond.telemetry.ammonia * 1000 * 50 * 0.5) + 320)
        replyText = `🧪 **BIOFLOC BIOCHEMICAL ANALYSIS (AVNIMELECH 2025):**\n\n• **Measured Ammonia**: ${pond.telemetry.ammonia} ppm\n• **Target C:N Ratio**: 15:1\n• **Carbon Deficit**: Organic carbon supplementation is recommended to stimulate heterotrophic bacteria to convert toxic ammonia into edible microbial protein.\n\n**Scientific Calculation:** Recommended molasses dosage is **${requiredMolassesGrams} grams** dissolved with aeration.`

        newActionCard = {
          id: 'act-' + Date.now(),
          title: 'Authorize Molasses Dosing',
          pondId: pond.id,
          type: 'MOLASSES_DOSE',
          amountGrams: requiredMolassesGrams,
          targetDevice: 'Carbon Solenoid Valve (ESP32-K04-DS)',
          description: `Open solenoid valve to inject ${requiredMolassesGrams}g of dissolved molasses solution into ${pond.name}.`,
          status: 'pending'
        }
      } else if (lower.includes('feed') || lower.includes('pakan') || lower.includes('dispense')) {
        replyText = `🐟 **FEEDING & FCR ANALYSIS:**\n\nCurrent estimated biomass is **${Math.round(pond.fishCount * pond.avgWeightGrams / 1000)} kg**. Based on metabolic curves at ${pond.telemetry.temp}°C and DO of ${pond.telemetry.do} mg/L, optimum daily ration is 3.0% of body weight split across 4 feeding windows.\n\nThis window requires **5.2 kg** of 32% protein BioGrow-7 pellets.`

        newActionCard = {
          id: 'act-' + Date.now(),
          title: 'Authorize Feed Dispensing',
          pondId: pond.id,
          type: 'FEEDER_DISPENSE',
          amountKg: 5.2,
          targetDevice: `Auto-Feeder Edge (${pond.actuators.feeder.id})`,
          description: `Auto-Feeder (${pond.actuators.feeder.id}) is ready to dispense 5.2 kg feed to ${pond.name}.`,
          status: 'pending'
        }
      } else if (lower.includes('emergency') || lower.includes('oxygen') || lower.includes('hypoxia') || lower.includes('aerat')) {
        replyText = `🚨 **BIOFLOC EMERGENCY PROTOCOL (LOW DO):**\n\nCurrent DO is detected at **${pond.telemetry.do} mg/L**. Safe operating threshold for biofloc is >= 5.0 mg/L.\n\n**Immediate Recommendation:**\nBoost aeration blower/paddlewheel VFD to 100% immediately and pause feeding temporarily to reduce Biological Oxygen Demand (BOD).`

        newActionCard = {
          id: 'act-' + Date.now(),
          title: 'Authorize 100% Aeration Boost',
          pondId: pond.id,
          type: 'AERATOR_BOOST',
          targetDevice: `Dual VFD Aerator 1HP (${pond.actuators.aerator.id})`,
          description: `Increase aerator frequency to 100% RPM to rapidly restore dissolved oxygen levels.`,
          status: 'pending'
        }
      } else {
        replyText = `🤖 **Sampay Co-Pilot:**\n\nInstruction "${userText}" received. Current telemetry for ${pond.name}: DO ${pond.telemetry.do} mg/L, pH ${pond.telemetry.ph}, Temp ${pond.telemetry.temp}°C, TAN ${pond.telemetry.ammonia} ppm. All readings within monitored ranges. Would you like to schedule feeding or test actuators?`
      }

      messages.value.push({
        id: 'm-' + Date.now(),
        role: 'assistant',
        senderName: 'Co-Pilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        text: replyText,
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
