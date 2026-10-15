<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { pondState } from '../services/simulationEngine'
import { mqttService } from '../services/mqttService'

const selectedChartParam = ref('do')
const logs = ref([])
const activeFilter = ref('ALL') // 'ALL' | 'OUTGOING' | 'INCOMING' | 'EVENT'
const autoScroll = ref(true)
const terminalRef = ref(null)

const handleNewLog = () => {
  logs.value = [...mqttService.messageLog]
  if (autoScroll.value && terminalRef.value) {
    setTimeout(() => {
      terminalRef.value.scrollTop = 0
    }, 50)
  }
}

const handleClear = () => {
  logs.value = []
}

onMounted(() => {
  logs.value = [...mqttService.messageLog]
  mqttService.on('log', handleNewLog)
  mqttService.on('log_clear', handleClear)
})

onUnmounted(() => {
  mqttService.off('log', handleNewLog)
  mqttService.off('log_clear', handleClear)
})

const filteredLogs = computed(() => {
  if (activeFilter.value === 'ALL') return logs.value
  if (activeFilter.value === 'OUTGOING') {
    return logs.value.filter(l => l.type === 'OUTGOING')
  }
  if (activeFilter.value === 'INCOMING') {
    return logs.value.filter(l => l.type.includes('INCOMING'))
  }
  if (activeFilter.value === 'EVENT') {
    return logs.value.filter(l => l.source && l.source.includes('/events'))
  }
  return logs.value
})

const clearAllLogs = () => {
  mqttService.clearLogs()
}

const copyToClipboard = (data) => {
  const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
  navigator.clipboard.writeText(text)
}

// Chart computation
const chartConfig = computed(() => {
  const configs = {
    do: { label: 'Dissolved Oxygen (DO)', unit: 'mg/L', color: '#0284c7', min: 1, max: 9, key: 'do' },
    ammonia: { label: 'Total Ammonia Nitrogen (TAN)', unit: 'mg/L', color: '#e11d48', min: 0, max: 2, key: 'ammonia' },
    ph: { label: 'Water pH', unit: 'pH', color: '#059669', min: 6.0, max: 9.0, key: 'ph' },
    temp: { label: 'Temperature', unit: '°C', color: '#d97706', min: 22, max: 34, key: 'temp' }
  }
  return configs[selectedChartParam.value] || configs.do
})

const chartSvgPoints = computed(() => {
  const hist = pondState.telemetryHistory
  if (!hist || hist.length === 0) return ''
  const cfg = chartConfig.value
  const width = 600
  const height = 120
  const paddingY = 10

  const pts = hist.map((pt, idx) => {
    const x = (idx / Math.max(1, hist.length - 1)) * width
    const val = Number(pt[cfg.key]) || cfg.min
    const clamped = Math.max(cfg.min, Math.min(cfg.max, val))
    const ratio = (clamped - cfg.min) / (cfg.max - cfg.min)
    const y = height - paddingY - ratio * (height - 2 * paddingY)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return pts.join(' ')
})

const chartAreaPoints = computed(() => {
  const pts = chartSvgPoints.value
  if (!pts) return ''
  return `0,120 ${pts} 600,120`
})
</script>

<template>
  <div class="row g-3">
    <!-- Left Column: Live Trendline -->
    <div class="col-lg-5">
      <div class="card card-iot h-100">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-graph-up text-primary"></i>
            <span class="fw-bold small">{{ chartConfig.label }} Live Trend</span>
          </div>

          <!-- Parameter Toggle -->
          <div class="btn-group btn-group-sm">
            <button 
              @click="selectedChartParam = 'do'" 
              :class="['btn btn-sm py-0 px-2', selectedChartParam === 'do' ? 'btn-primary' : 'btn-outline-secondary']"
              style="font-size: 0.72rem;"
            >
              DO
            </button>
            <button 
              @click="selectedChartParam = 'ammonia'" 
              :class="['btn btn-sm py-0 px-2', selectedChartParam === 'ammonia' ? 'btn-danger' : 'btn-outline-secondary']"
              style="font-size: 0.72rem;"
            >
              Ammonia
            </button>
            <button 
              @click="selectedChartParam = 'ph'" 
              :class="['btn btn-sm py-0 px-2', selectedChartParam === 'ph' ? 'btn-success' : 'btn-outline-secondary']"
              style="font-size: 0.72rem;"
            >
              pH
            </button>
            <button 
              @click="selectedChartParam = 'temp'" 
              :class="['btn btn-sm py-0 px-2', selectedChartParam === 'temp' ? 'btn-warning text-dark' : 'btn-outline-secondary']"
              style="font-size: 0.72rem;"
            >
              Temp
            </button>
          </div>
        </div>

        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-baseline mb-2">
              <div class="fs-4 fw-bold font-monospace text-dark">
                {{ Number(pondState[chartConfig.key]).toFixed(chartConfig.key === 'ammonia' ? 3 : 2) }}
                <span class="fs-6 fw-normal text-muted">{{ chartConfig.unit }}</span>
              </div>
              <span class="badge bg-light text-secondary border small">
                Rolling 25 Telemetry Samples
              </span>
            </div>

            <!-- SVG Graph Container -->
            <div class="bg-light p-2 rounded border" style="height: 130px; width: 100%;">
              <svg viewBox="0 0 600 120" preserveAspectRatio="none" style="width: 100%; height: 100%;">
                <defs>
                  <linearGradient id="lightChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="chartConfig.color" stop-opacity="0.25"/>
                    <stop offset="100%" :stop-color="chartConfig.color" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>

                <!-- Grid lines -->
                <line x1="0" y1="20" x2="600" y2="20" stroke="#cbd5e1" stroke-width="0.75" stroke-dasharray="3,3"/>
                <line x1="0" y1="60" x2="600" y2="60" stroke="#cbd5e1" stroke-width="0.75" stroke-dasharray="3,3"/>
                <line x1="0" y1="100" x2="600" y2="100" stroke="#cbd5e1" stroke-width="0.75" stroke-dasharray="3,3"/>

                <!-- Area fill -->
                <polygon :points="chartAreaPoints" fill="url(#lightChartGrad)"/>

                <!-- Polyline -->
                <polyline 
                  :points="chartSvgPoints" 
                  fill="none" 
                  :stroke="chartConfig.color" 
                  stroke-width="2.5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>

          <div class="d-flex justify-content-between text-muted small font-monospace mt-2" style="font-size: 0.72rem;">
            <span><i class="bi bi-clock me-1"></i>T-25 Packets</span>
            <span>Current Node: {{ pondState.deviceId }}</span>
            <span>Real-time TX</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Live Server Traffic Stream -->
    <div class="col-lg-7">
      <div class="card card-iot h-100">
        <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-terminal-split text-success"></i>
            <span class="fw-bold small">Server Traffic & Command Packet Stream</span>
            <span class="badge bg-light text-secondary border font-monospace" style="font-size: 0.72rem;">
              {{ filteredLogs.length }} Messages
            </span>
          </div>

          <div class="d-flex align-items-center gap-1">
            <!-- Filter Buttons -->
            <div class="btn-group btn-group-sm me-1">
              <button 
                @click="activeFilter = 'ALL'" 
                :class="['btn btn-sm py-0 px-2', activeFilter === 'ALL' ? 'btn-secondary text-white' : 'btn-outline-secondary']"
                style="font-size: 0.72rem;"
              >
                All
              </button>
              <button 
                @click="activeFilter = 'INCOMING'" 
                :class="['btn btn-sm py-0 px-2', activeFilter === 'INCOMING' ? 'btn-danger text-white' : 'btn-outline-danger']"
                style="font-size: 0.72rem;"
              >
                Commands (In)
              </button>
              <button 
                @click="activeFilter = 'OUTGOING'" 
                :class="['btn btn-sm py-0 px-2', activeFilter === 'OUTGOING' ? 'btn-primary text-white' : 'btn-outline-primary']"
                style="font-size: 0.72rem;"
              >
                Telemetry (Out)
              </button>
              <button 
                @click="activeFilter = 'EVENT'" 
                :class="['btn btn-sm py-0 px-2', activeFilter === 'EVENT' ? 'btn-warning text-dark' : 'btn-outline-warning']"
                style="font-size: 0.72rem;"
              >
                Events
              </button>
            </div>

            <button @click="clearAllLogs" class="btn btn-outline-secondary btn-sm py-0 px-2" style="font-size: 0.72rem;" title="Clear message logs">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div class="card-body p-2">
          <div ref="terminalRef" class="terminal-box-light p-2">
            <div v-if="filteredLogs.length === 0" class="text-muted text-center py-4 small">
              <i class="bi bi-inbox fs-3 d-block mb-1 text-muted"></i>
              Listening for incoming commands and telemetry dispatches...
            </div>

            <div v-for="log in filteredLogs" :key="log.id" class="terminal-line-light">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="text-muted font-monospace" style="font-size: 0.72rem;">
                  [{{ log.timestamp }}]
                  <span v-if="log.type === 'OUTGOING'" class="badge bg-primary ms-1" style="font-size: 0.65rem;">
                    <i class="bi bi-arrow-up-right me-1"></i>TX TELEMETRY
                  </span>
                  <span v-else-if="log.type.includes('INCOMING')" class="badge bg-danger ms-1" style="font-size: 0.65rem;">
                    <i class="bi bi-arrow-down-left me-1"></i>SERVER CMD
                  </span>
                  <span v-else-if="log.type === 'ERROR'" class="badge bg-danger ms-1" style="font-size: 0.65rem;">
                    ERROR
                  </span>
                  <span v-else class="badge bg-secondary ms-1" style="font-size: 0.65rem;">
                    EVENT
                  </span>
                  <span class="text-primary fw-medium ms-2 font-monospace">{{ log.source }}</span>
                </span>

                <button 
                  @click="copyToClipboard(log.data)" 
                  class="btn btn-link text-muted p-0 text-decoration-none" 
                  style="font-size: 0.72rem;" 
                  title="Copy payload JSON"
                >
                  <i class="bi bi-clipboard"></i>
                </button>
              </div>

              <!-- Payload Content in Light Monospace -->
              <pre class="mb-0 text-dark font-monospace small bg-white p-2 rounded border" style="font-size: 0.74rem; white-space: pre-wrap;">{{ typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
