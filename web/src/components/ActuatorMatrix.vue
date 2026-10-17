<script setup>
import { ref, computed, watch } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  RotateCw, 
  Wind, 
  Pipette, 
  Zap, 
  Play,
  Wrench,
  Sparkles,
  Utensils,
  Droplets,
  AlertTriangle,
  ShieldAlert,
  Gauge,
  Sliders,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-vue-next'

const { activePond, triggerFeeder, setAeratorBoost, triggerMolassesDosing, triggerWaterFlush } = usePonds()
const { showToast } = useToast()

// Customizable dosage and parameter state
const customFeedKg = ref(5.2)
const customDoseGrams = ref(350)
const customAeratorPower = ref(80)
const flushPercent = ref(15)
const isFlushArmed = ref(false)

// Keep custom aerator synced when active pond changes
watch(() => activePond.value?.actuators?.aerator?.powerPercent, (newPower) => {
  if (newPower) customAeratorPower.value = newPower
}, { immediate: true })

// Contextual intelligent action recommendation based on live active pond telemetry
const recommendedAction = computed(() => {
  const p = activePond.value
  if (!p) return { type: 'feed' }

  // Extreme emergency condition: High Ammonia or extreme Hypoxia crashes
  if (p.telemetry.ammonia > 0.07 || p.telemetry.do < 3.8) {
    return {
      type: 'flush',
      groupName: 'Emergency Water Exchange & Bottom Siphon',
      label: '🚨 CRITICAL OVERRIDE: EMERGENCY FLUSH RECOMMENDED',
      reason: `Water parameters indicate severe biological crash (TAN ${p.telemetry.ammonia} mg/L, DO ${p.telemetry.do} mg/L). Immediate bottom sludge siphoning and 15-20% exchange is vital to prevent fish mortality.`,
      btnText: '🚨 TRIGGER EMERGENCY SIPHON (CRITICAL)',
      btnClass: 'highlight-danger'
    }
  }

  if (p.telemetry.do < 4.8) {
    return {
      type: 'aerate',
      groupName: 'Life-Support & Aeration Emergency',
      label: '⚡ PRIORITY ACTION: BOOST OXYGEN AERATION',
      reason: `DO is critically low (${p.telemetry.do} mg/L). 100% aerator boost is urgently needed to avoid hypoxia stress.`,
      btnText: '⚡ BOOST AERATOR TO 100% (URGENT)',
      btnClass: 'highlight-danger'
    }
  }

  if (p.telemetry.ammonia > 0.038) {
    return {
      type: 'dose',
      groupName: 'Biological Biofloc C:N Treatment',
      label: '🧪 RECOMMENDED ACTION: INJECT CARBON DOSING',
      reason: `TAN is elevated (${p.telemetry.ammonia} mg/L). Organic carbon dosing is required to stimulate heterotrophic flocs.`,
      btnText: '🧪 INJECT 350g MOLASSES (RECOMMENDED)',
      btnClass: 'highlight-warning'
    }
  }

  return {
    type: 'feed',
    groupName: 'Routine Feeding & Nutrition',
    label: '⭐ SCHEDULED ACTION: DISPENSE PELLET RATION',
    reason: `Water parameters are optimal (DO ${p.telemetry.do} mg/L, Temp ${p.telemetry.temp}°C). ${p.name} is ready for feeding.`,
    btnText: `🐟 DISPENSE ${customFeedKg.value} kg FEED (SCHEDULED)`,
    btnClass: 'highlight-primary'
  }
})

// Action handlers with customized dosages
const handleManualFeed = () => {
  triggerFeeder(activePond.value.id, customFeedKg.value)
  showToast(`⚡ Feeder Executed: Dispensing ${customFeedKg.value} kg feed pellets to ${activePond.value.name}.`, 'success')
}

const handleAeratorSet = (targetPower) => {
  if (targetPower !== undefined) {
    customAeratorPower.value = targetPower
  }
  setAeratorBoost(activePond.value.id, customAeratorPower.value)
  showToast(`🌪️ Aeration Adjusted: Blower power set to ${customAeratorPower.value}% RPM for ${activePond.value.name}.`, 'warning')
}

const handleMolassesPulse = () => {
  triggerMolassesDosing(activePond.value.id, customDoseGrams.value)
  showToast(`🧪 Molasses Valve Triggered: Dispensing ${customDoseGrams.value}g carbon solution into ${activePond.value.name}.`, 'info')
}

const handleEmergencyFlush = () => {
  if (!isFlushArmed.value) {
    showToast('⚠️ Safety Interlock Active: Please arm the Emergency Siphon switch before triggering.', 'warning')
    return
  }
  triggerWaterFlush(activePond.value.id, flushPercent.value)
  showToast(`🚨 Emergency Siphon Triggered: Draining bottom sludge & recharging ${flushPercent.value}% fresh water for ${activePond.value.name}!`, 'error')
  isFlushArmed.value = false // automatically re-arm to safe state
}
</script>

<template>
  <div class="actuator-section glass-panel">
    <!-- Header -->
    <div class="section-top">
      <div class="section-title-wrap">
        <Wrench class="title-icon text-sky" :size="20" />
        <div>
          <h3 class="panel-title">Equipment</h3>
          <span class="panel-sub">Feed, air, molasses, and drain for {{ activePond.name }}. These controls stay in the demo.</span>
        </div>
      </div>
      <div class="status-summary font-mono">
        <span class="pulse-dot online"></span>
        <span>4 Actuator Nodes Linked via MQTT</span>
      </div>
    </div>

    <!-- Smart Recommendation Banner -->
    <div class="recommendation-callout" :class="recommendedAction.btnClass">
      <div class="rec-icon-box">
        <Sparkles :size="16" />
      </div>
      <div class="rec-details">
        <div class="rec-header-row">
          <span class="rec-lead font-display">{{ recommendedAction.label }}</span>
          <span class="rec-group font-mono">{{ recommendedAction.groupName }}</span>
        </div>
        <p class="rec-desc">{{ recommendedAction.reason }}</p>
      </div>
    </div>

    <!-- 4 Functional Groups Grid -->
    <div class="actuator-workflow-grid">
      <!-- FUNCTION 1: ROUTINE FEEDING & CUSTOMIZABLE DOSAGE -->
      <div 
        class="workflow-card" 
        :class="{ 
          'is-highlighted': recommendedAction.type === 'feed',
          'is-active': activePond.actuators.feeder.status === 'DISPENSING' 
        }"
      >
        <div class="card-group-tag">
          <Utensils :size="13" class="text-sky" />
          <span>FUNCTION 1: ROUTINE FEEDING & NUTRITION</span>
        </div>

        <div class="actuator-header">
          <div class="device-icon feeder" :class="{ spinning: activePond.actuators.feeder.status === 'DISPENSING' }">
            <RotateCw :size="18" />
          </div>
          <div class="device-info">
            <span class="device-name">Smart Auto-Feeder</span>
            <span class="device-id font-mono">ID: {{ activePond.actuators.feeder.id }}</span>
          </div>
          <span 
            class="badge" 
            :class="activePond.actuators.feeder.status === 'DISPENSING' ? 'badge-amber' : 'badge-emerald'"
          >
            {{ activePond.actuators.feeder.status === 'DISPENSING' ? 'DISPENSING' : 'READY' }}
          </span>
        </div>

        <!-- Customizable Feed Portion Slider & Input -->
        <div class="dosage-control-box font-mono">
          <div class="dosage-top-row">
            <span class="dosage-lbl"><Sliders :size="12" /> Custom Feed Dosage:</span>
            <div class="dosage-input-wrap">
              <input 
                v-model.number="customFeedKg" 
                type="number" 
                step="0.1" 
                min="0.5" 
                max="20" 
                class="dosage-number-input"
              />
              <span class="dosage-unit">kg</span>
            </div>
          </div>
          <input 
            v-model.number="customFeedKg" 
            type="range" 
            min="1.0" 
            max="15.0" 
            step="0.1" 
            class="dosage-slider feed"
          />
          <div class="dosage-presets">
            <button 
              v-for="preset in [2.5, 3.5, 5.2, 7.5, 10.0]" 
              :key="preset"
              class="preset-chip"
              :class="{ active: customFeedKg === preset }"
              @click="customFeedKg = preset"
            >
              {{ preset }} kg
            </button>
          </div>
        </div>

        <div class="actuator-stats font-mono">
          <div class="stat-line">
            <span class="stat-lbl">Dispensed Today:</span>
            <span class="stat-val text-sky">{{ activePond.actuators.feeder.dispensedTodayKg }} / {{ activePond.actuators.feeder.targetDailyKg }} kg</span>
          </div>
          <div class="stat-line">
            <span class="stat-lbl">Scheduled Ration:</span>
            <span class="stat-val text-primary">{{ activePond.actuators.feeder.nextSchedule }}</span>
          </div>
        </div>

        <div class="actuator-action">
          <button 
            id="btn-manual-feed"
            class="btn-trigger feed"
            :class="{ 'btn-highlighted-action': recommendedAction.type === 'feed' }"
            :disabled="activePond.actuators.feeder.status === 'DISPENSING'"
            @click="handleManualFeed"
          >
            <Play :size="14" />
            <span>{{ activePond.actuators.feeder.status === 'DISPENSING' ? 'Dispensing Feed...' : `Dispense ${customFeedKg} kg Feed` }}</span>
          </button>
        </div>
      </div>

      <!-- FUNCTION 2: BIOFLOC C:N CARBON DOSING -->
      <div 
        class="workflow-card" 
        :class="{ 
          'is-highlighted': recommendedAction.type === 'dose',
          'is-active': activePond.actuators.dosing.status === 'DOSING' 
        }"
      >
        <div class="card-group-tag">
          <Pipette :size="13" class="text-amber" />
          <span>FUNCTION 2: BIOFLOC C:N WATER TREATMENT</span>
        </div>

        <div class="actuator-header">
          <div class="device-icon dosing">
            <Pipette :size="18" />
          </div>
          <div class="device-info">
            <span class="device-name">Molasses Solenoid Valve</span>
            <span class="device-id font-mono">ID: {{ activePond.actuators.dosing.id }}</span>
          </div>
          <span 
            class="badge" 
            :class="activePond.actuators.dosing.status === 'DOSING' ? 'badge-amber' : 'badge-cyan'"
          >
            {{ activePond.actuators.dosing.status === 'DOSING' ? 'DOSING' : 'STANDBY' }}
          </span>
        </div>

        <!-- Customizable Molasses Dosage Slider & Input -->
        <div class="dosage-control-box font-mono">
          <div class="dosage-top-row">
            <span class="dosage-lbl"><Sliders :size="12" /> Custom Carbon Dose:</span>
            <div class="dosage-input-wrap">
              <input 
                v-model.number="customDoseGrams" 
                type="number" 
                step="25" 
                min="50" 
                max="2000" 
                class="dosage-number-input"
              />
              <span class="dosage-unit">g</span>
            </div>
          </div>
          <input 
            v-model.number="customDoseGrams" 
            type="range" 
            min="100" 
            max="1200" 
            step="25" 
            class="dosage-slider dose"
          />
          <div class="dosage-presets">
            <button 
              v-for="preset in [200, 350, 500, 750, 1000]" 
              :key="preset"
              class="preset-chip"
              :class="{ active: customDoseGrams === preset }"
              @click="customDoseGrams = preset"
            >
              {{ preset }}g
            </button>
          </div>
        </div>

        <div class="actuator-stats font-mono">
          <div class="stat-line">
            <span class="stat-lbl">Injection Flow:</span>
            <span class="stat-val text-amber">{{ activePond.actuators.dosing.flowMlMin }} mL/min</span>
          </div>
          <div class="stat-line">
            <span class="stat-lbl">Carbon Source:</span>
            <span class="stat-val text-primary">Cane Molasses 40% C</span>
          </div>
        </div>

        <div class="actuator-action">
          <button 
            id="btn-pulse-molasses"
            class="btn-trigger dose"
            :class="{ 'btn-highlighted-action': recommendedAction.type === 'dose' }"
            :disabled="activePond.actuators.dosing.status === 'DOSING'"
            @click="handleMolassesPulse"
          >
            <Pipette :size="14" />
            <span>{{ activePond.actuators.dosing.status === 'DOSING' ? 'Injecting Solution...' : `Inject ${customDoseGrams}g Molasses` }}</span>
          </button>
        </div>
      </div>

      <!-- FUNCTION 3: LIFE-SUPPORT & AERATION TUNING -->
      <div 
        class="workflow-card" 
        :class="{ 
          'is-highlighted': recommendedAction.type === 'aerate',
          'is-danger-state': activePond.telemetry.do < 4.8 
        }"
      >
        <div class="card-group-tag">
          <Wind :size="13" class="text-emerald" />
          <span>FUNCTION 3: LIFE-SUPPORT & AERATION</span>
        </div>

        <div class="actuator-header">
          <div class="device-icon aerator spinning">
            <Wind :size="18" />
          </div>
          <div class="device-info">
            <span class="device-name">Dual VFD Oxygen Aerator</span>
            <span class="device-id font-mono">ID: {{ activePond.actuators.aerator.id }}</span>
          </div>
          <span 
            class="badge"
            :class="activePond.telemetry.do < 4.8 ? 'badge-rose' : 'badge-emerald'"
          >
            {{ activePond.telemetry.do < 4.8 ? 'LOW DO ALERT' : 'SIMULATED' }}
          </span>
        </div>

        <!-- Customizable Aerator Power Slider & Presets -->
        <div class="dosage-control-box font-mono">
          <div class="dosage-top-row">
            <span class="dosage-lbl"><Gauge :size="12" /> Aerator Power / RPM:</span>
            <div class="dosage-input-wrap">
              <span class="dosage-badge-val text-emerald">{{ customAeratorPower }}%</span>
            </div>
          </div>
          <input 
            v-model.number="customAeratorPower" 
            type="range" 
            min="40" 
            max="100" 
            step="5" 
            class="dosage-slider aerate"
          />
          <div class="dosage-presets">
            <button 
              class="preset-chip"
              :class="{ active: customAeratorPower === 60 }"
              @click="customAeratorPower = 60"
            >
              60% Eco
            </button>
            <button 
              class="preset-chip"
              :class="{ active: customAeratorPower === 80 }"
              @click="customAeratorPower = 80"
            >
              80% Cruise
            </button>
            <button 
              class="preset-chip"
              :class="{ active: customAeratorPower === 100 }"
              @click="customAeratorPower = 100"
            >
              100% Boost
            </button>
          </div>
        </div>

        <div class="actuator-stats font-mono">
          <div class="stat-line">
            <span class="stat-lbl">Active Blower Speed:</span>
            <span class="stat-val text-emerald">{{ activePond.actuators.aerator.powerPercent }}% RPM</span>
          </div>
          <div class="stat-line">
            <span class="stat-lbl">Loop Synchronization:</span>
            <span class="stat-val text-sky">ACTIVE (CLOSED-LOOP)</span>
          </div>
        </div>

        <div class="actuator-action">
          <button 
            id="btn-boost-aerator"
            class="btn-trigger aerate"
            :class="{ 'btn-highlighted-action danger': recommendedAction.type === 'aerate' }"
            @click="handleAeratorSet()"
          >
            <Zap :size="14" />
            <span>{{ recommendedAction.type === 'aerate' ? `⚡ Set Aerator to ${customAeratorPower}% (Urgent)` : `Set Aerator to ${customAeratorPower}% RPM` }}</span>
          </button>
        </div>
      </div>

      <!-- FUNCTION 4: EMERGENCY WATER EXCHANGE & SIPHON VALVE -->
      <div 
        class="workflow-card emergency-card" 
        :class="{ 
          'is-highlighted': recommendedAction.type === 'flush',
          'is-active': activePond.actuators.flush?.status === 'FLUSHING'
        }"
      >
        <div class="card-group-tag">
          <ShieldAlert :size="13" class="text-rose" />
          <span>FUNCTION 4: EMERGENCY WATER EXCHANGE & SIPHON</span>
        </div>

        <div class="actuator-header">
          <div class="device-icon flush" :class="{ spinning: activePond.actuators.flush?.status === 'FLUSHING' }">
            <RefreshCw :size="18" />
          </div>
          <div class="device-info">
            <span class="device-name">Emergency Siphon Valve</span>
            <span class="device-id font-mono">ID: {{ activePond.actuators.flush?.id || 'ESP32-K04-FLUSH' }}</span>
          </div>
          <span 
            class="badge" 
            :class="activePond.actuators.flush?.status === 'FLUSHING' ? 'badge-rose' : 'badge-neutral'"
          >
            {{ activePond.actuators.flush?.status === 'FLUSHING' ? 'DRAINING & RECHARGING' : 'STANDBY' }}
          </span>
        </div>

        <!-- Emergency Exchange Volume Selector & Safety Arm Interlock -->
        <div class="dosage-control-box font-mono emergency-box">
          <div class="dosage-top-row">
            <span class="dosage-lbl"><Droplets :size="12" /> Flush Volume:</span>
            <span class="dosage-badge-val text-rose">{{ flushPercent }}% ({{ Math.round(activePond.volumeM3 * flushPercent / 100) }} m³)</span>
          </div>
          
          <div class="dosage-presets">
            <button 
              v-for="p in [10, 15, 20, 30]" 
              :key="p"
              class="preset-chip flush-chip"
              :class="{ active: flushPercent === p }"
              @click="flushPercent = p"
            >
              {{ p }}% Exch
            </button>
          </div>

          <!-- Safety Arm Interlock Switch -->
          <div class="safety-toggle-row">
            <button 
              type="button"
              class="safety-arm-btn"
              :class="{ armed: isFlushArmed }"
              @click="isFlushArmed = !isFlushArmed"
            >
              <component :is="isFlushArmed ? Unlock : Lock" :size="13" />
              <span>{{ isFlushArmed ? 'ARMED (Siphon Valve Ready)' : 'LOCKED (Toggle to Arm)' }}</span>
            </button>
          </div>
        </div>

        <div class="actuator-stats font-mono">
          <div class="stat-line">
            <span class="stat-lbl">Bottom Siphon Rate:</span>
            <span class="stat-val text-rose">15 m³/hour</span>
          </div>
          <div class="stat-line">
            <span class="stat-lbl">Last Flush Event:</span>
            <span class="stat-val text-primary">{{ activePond.actuators.flush?.lastFlushed || 'None (Zero-Exchange)' }}</span>
          </div>
        </div>

        <div class="actuator-action">
          <button 
            id="btn-emergency-flush"
            class="btn-trigger flush"
            :class="{ 
              'btn-highlighted-action danger': recommendedAction.type === 'flush',
              'armed-state': isFlushArmed
            }"
            :disabled="!isFlushArmed || activePond.actuators.flush?.status === 'FLUSHING'"
            @click="handleEmergencyFlush"
          >
            <AlertTriangle :size="14" />
            <span>{{ activePond.actuators.flush?.status === 'FLUSHING' ? 'Flushing Bottom Sludge...' : (isFlushArmed ? `🚨 Execute ${flushPercent}% Emergency Flush` : 'Arm Valve to Execute Flush') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.actuator-section {
  padding: 14px 18px;
  margin-bottom: 16px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  color: var(--sky-600);
}

.panel-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--text-primary);
}

.panel-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.status-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: var(--emerald-700);
  background: var(--emerald-50);
  border: 1px solid var(--emerald-100);
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}

/* Recommendation Banner */
.recommendation-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.recommendation-callout.highlight-primary {
  background: var(--sky-50);
  border-color: var(--sky-200);
  border-left: 4px solid var(--sky-500);
}

.recommendation-callout.highlight-warning {
  background: var(--amber-50);
  border-color: var(--amber-200);
  border-left: 4px solid var(--amber-500);
}

.recommendation-callout.highlight-danger {
  background: var(--rose-50);
  border-color: var(--rose-200);
  border-left: 4px solid var(--rose-500);
}

.rec-icon-box {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.highlight-primary .rec-icon-box { background: var(--sky-100); color: var(--sky-700); }
.highlight-warning .rec-icon-box { background: var(--amber-100); color: var(--amber-700); }
.highlight-danger .rec-icon-box { background: var(--rose-100); color: var(--rose-700); }

.rec-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rec-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rec-lead {
  font-size: 0.78rem;
  font-weight: 800;
}
.highlight-primary .rec-lead { color: var(--sky-800); }
.highlight-warning .rec-lead { color: var(--amber-800); }
.highlight-danger .rec-lead { color: var(--rose-800); }

.rec-group {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.rec-desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.35;
}

/* Functional Workflow Cards Grid - 2x2 or 4-col layout */
.actuator-workflow-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.workflow-card {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.workflow-card:hover {
  background: #ffffff;
  border-color: var(--border-medium);
  box-shadow: var(--shadow-sm);
}

.workflow-card.is-highlighted {
  background: #ffffff;
  border-color: var(--sky-500);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.25), var(--shadow-sm);
}

.workflow-card.is-danger-state {
  border-color: var(--rose-500);
  box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.25);
}

.workflow-card.emergency-card {
  border-color: rgba(244, 63, 94, 0.3);
}

.card-group-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.66rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.actuator-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.device-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.device-icon.feeder { background: var(--sky-100); color: var(--sky-700); }
.device-icon.aerator { background: var(--emerald-100); color: var(--emerald-700); }
.device-icon.dosing { background: var(--amber-100); color: var(--amber-700); }
.device-icon.flush { background: var(--rose-100); color: var(--rose-700); }

.spinning {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.device-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.device-name {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-primary);
}

.device-id {
  font-size: 0.65rem;
  color: var(--text-muted);
}

/* Dosage & Custom Controls Box */
.dosage-control-box {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 7px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dosage-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
}

.dosage-lbl {
  color: var(--text-secondary);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dosage-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dosage-number-input {
  width: 58px;
  padding: 2px 6px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  border-radius: 4px;
  text-align: right;
  background: var(--bg-surface-subtle);
}

.dosage-unit {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
}

.dosage-badge-val {
  font-weight: 800;
  font-size: 0.8rem;
}

.dosage-slider {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: var(--bg-surface-subtle);
  accent-color: var(--sky-600);
  cursor: pointer;
}
.dosage-slider.feed { accent-color: var(--sky-600); }
.dosage-slider.dose { accent-color: var(--amber-600); }
.dosage-slider.aerate { accent-color: var(--emerald-600); }

.dosage-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-chip {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.preset-chip:hover {
  background: #ffffff;
  border-color: var(--border-medium);
  color: var(--text-primary);
}

.preset-chip.active {
  background: var(--sky-50);
  border-color: var(--sky-300);
  color: var(--sky-700);
}

.preset-chip.flush-chip.active {
  background: var(--rose-50);
  border-color: var(--rose-300);
  color: var(--rose-700);
}

/* Safety Interlock Arming Switch */
.safety-toggle-row {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed var(--border-subtle);
}

.safety-arm-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  border: 1px solid var(--border-medium);
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.safety-arm-btn.armed {
  background: var(--rose-50);
  border-color: var(--rose-300);
  color: var(--rose-700);
}

.actuator-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.72rem;
}

.stat-line {
  display: flex;
  justify-content: space-between;
}

.stat-lbl {
  color: var(--text-muted);
}

.stat-val.text-sky { color: var(--sky-600); font-weight: 700; }
.stat-val.text-emerald { color: var(--emerald-600); font-weight: 700; }
.stat-val.text-amber { color: var(--amber-600); font-weight: 700; }
.stat-val.text-rose { color: var(--rose-600); font-weight: 700; }
.stat-val.text-primary { font-weight: 600; }

.btn-trigger {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-trigger.feed {
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
}
.btn-trigger.feed:hover:not(:disabled) {
  background: var(--sky-600);
  color: #fff;
}

.btn-trigger.aerate {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}
.btn-trigger.aerate:hover {
  background: var(--emerald-600);
  color: #fff;
}

.btn-trigger.dose {
  background: var(--amber-50);
  color: var(--amber-700);
  border: 1px solid var(--amber-200);
}
.btn-trigger.dose:hover:not(:disabled) {
  background: var(--amber-600);
  color: #fff;
}

.btn-trigger.flush {
  background: var(--rose-50);
  color: var(--rose-700);
  border: 1px solid var(--rose-200);
}
.btn-trigger.flush:hover:not(:disabled) {
  background: var(--rose-600);
  color: #fff;
}
.btn-trigger.flush.armed-state {
  background: var(--rose-600);
  color: #fff;
  border-color: var(--rose-700);
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.3);
}

/* Pulsing highlight on recommended button */
.btn-highlighted-action {
  background: var(--sky-600) !important;
  color: #ffffff !important;
  border-color: var(--sky-600) !important;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.35), 0 4px 12px rgba(2, 132, 199, 0.3);
  animation: pulse-action 2s infinite ease-in-out;
}

.btn-highlighted-action.danger {
  background: var(--rose-600) !important;
  color: #ffffff !important;
  border-color: var(--rose-600) !important;
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.35), 0 4px 12px rgba(225, 29, 72, 0.3);
  animation: pulse-danger 1.5s infinite ease-in-out;
}

@keyframes pulse-action {
  0% { transform: scale(1); box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.2), 0 6px 16px rgba(2, 132, 199, 0.35); }
  100% { transform: scale(1); box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.4); }
}

@keyframes pulse-danger {
  0% { transform: scale(1); box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(244, 63, 94, 0.2), 0 6px 16px rgba(225, 29, 72, 0.4); }
  100% { transform: scale(1); box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.4); }
}

.btn-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .actuator-workflow-grid {
    grid-template-columns: 1fr;
  }
}
</style>
