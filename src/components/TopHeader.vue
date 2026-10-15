<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePonds } from '../composables/usePonds'
import { 
  Search, 
  Layers, 
  FlaskConical, 
  Activity, 
  SlidersHorizontal,
  Clock
} from 'lucide-vue-next'

const emit = defineEmits(['toggle-simulator'])
const { globalFarmMetrics } = usePonds()

defineProps({
  simulatorOpen: {
    type: Boolean,
    default: false
  }
})

const currentTime = ref('')

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
}

let timer = null
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <header class="top-header-fixed">
    <!-- Left: Search Box -->
    <div class="search-wrapper">
      <Search :size="16" class="search-icon" />
      <input 
        id="input-global-search"
        type="text" 
        placeholder="Search ponds, water metrics, or commands..." 
      />
    </div>

    <!-- Center: Farm Key Performance Indicators (English) -->
    <div class="kpi-pills-row">
      <div class="kpi-pill" title="Total Estimated Biomass Across All Ponds">
        <Layers :size="15" class="text-sky" />
        <div class="kpi-text">
          <span class="kpi-val font-mono">{{ globalFarmMetrics.totalBiomassKg.toLocaleString() }} kg</span>
          <span class="kpi-lbl">Total Biomass</span>
        </div>
      </div>

      <div class="kpi-pill" title="Average Feed Conversion Ratio across ponds">
        <FlaskConical :size="15" class="text-emerald" />
        <div class="kpi-text">
          <span class="kpi-val font-mono">{{ globalFarmMetrics.fcr }}</span>
          <span class="kpi-lbl">Avg. FCR</span>
        </div>
      </div>

      <div class="kpi-pill" title="Overall Biofloc Water Health Index">
        <Activity :size="15" class="text-emerald" />
        <div class="kpi-text">
          <span class="kpi-val font-mono">{{ globalFarmMetrics.avgHealth }}% Optimal</span>
          <span class="kpi-lbl">Pond Condition</span>
        </div>
      </div>
    </div>

    <!-- Right: Real-time Indicators & Actions -->
    <div class="header-actions-group">
      <!-- Hardware Sensor Status -->
      <div class="edge-status-pill font-mono" title="IoT sensors are streaming real-time sampling packets">
        <span class="pulse-dot online"></span>
        <span>Sensors: Active & Stable</span>
      </div>

      <!-- Field Digital Clock -->
      <div class="clock-pill font-mono">
        <Clock :size="14" class="text-muted" />
        <span>{{ currentTime }}</span>
      </div>

      <!-- Demo Simulator Button -->
      <button 
        id="btn-toggle-simulator"
        class="btn-simulator"
        :class="{ active: simulatorOpen }"
        @click="emit('toggle-simulator')"
        title="Inject test scenarios for jury demonstrations"
      >
        <SlidersHorizontal :size="15" />
        <span>Demo Scenarios</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.top-header-fixed {
  position: fixed;
  top: 0;
  right: 0;
  left: 270px;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  z-index: 90;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.search-wrapper {
  position: relative;
  width: 320px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-subtle);
}

.search-wrapper input {
  width: 100%;
  padding: 8px 14px 8px 36px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.search-wrapper input:focus {
  border-color: var(--sky-500);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
}

.kpi-pills-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.kpi-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 8px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
}

.text-sky { color: var(--sky-600); }
.text-emerald { color: var(--emerald-600); }
.text-muted { color: var(--text-muted); }

.kpi-text {
  display: flex;
  flex-direction: column;
}

.kpi-val {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.kpi-lbl {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edge-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--emerald-50);
  border: 1px solid var(--emerald-100);
  color: var(--emerald-700);
  font-size: 0.72rem;
  font-weight: 600;
}

.clock-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--bg-surface-subtle);
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.btn-simulator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  color: var(--sky-700);
  font-size: 0.78rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.btn-simulator:hover,
.btn-simulator.active {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
}

@media (max-width: 1280px) {
  .top-header-fixed {
    left: 240px;
  }
  .kpi-pills-row {
    display: none;
  }
}
@media (max-width: 768px) {
  .top-header-fixed {
    left: 0;
  }
  .search-wrapper {
    display: none;
  }
}
</style>
