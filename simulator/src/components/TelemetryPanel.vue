<script setup>
import { computed, ref } from 'vue'
import { pondState, simulationEngine } from '../services/simulationEngine'

const selectedChartParam = ref('do') // 'do' | 'ammonia' | 'ph' | 'temp'

// Helper for status badges and thresholds
const phStatus = computed(() => {
  if (pondState.ph < 6.8) return { text: 'Acidic', class: 'bg-warning text-dark' }
  if (pondState.ph > 8.2) return { text: 'Alkaline', class: 'bg-danger' }
  return { text: 'Optimal', class: 'bg-success' }
})

const ammoniaStatus = computed(() => {
  if (pondState.ammonia < 0.25) return { text: 'Safe', class: 'bg-success' }
  if (pondState.ammonia < 0.8) return { text: 'Warning', class: 'bg-warning text-dark' }
  return { text: 'Toxic / Critical', class: 'bg-danger' }
})

const doStatus = computed(() => {
  if (pondState.dissolvedOxygen >= 5.0) return { text: 'Oxygen Rich', class: 'bg-success' }
  if (pondState.dissolvedOxygen >= 3.5) return { text: 'Moderate', class: 'bg-warning text-dark' }
  return { text: 'Hypoxia Risk', class: 'bg-danger' }
})

const mudStatus = computed(() => {
  if (pondState.mudSolids <= 150) return { text: 'Clear', class: 'bg-success' }
  if (pondState.mudSolids <= 280) return { text: 'Turbid', class: 'bg-warning text-dark' }
  return { text: 'Heavy Sludge', class: 'bg-danger' }
})

const tempStatus = computed(() => {
  if (pondState.temperature >= 26 && pondState.temperature <= 31) return { text: 'Stable', class: 'bg-success' }
  return { text: 'Suboptimal', class: 'bg-warning text-dark' }
})

const triggerManualPublish = () => {
  simulationEngine.publishTelemetry()
}

const updateInterval = (e) => {
  simulationEngine.setPublishInterval(e.target.value)
}

const applyPreset = (preset) => {
  simulationEngine.setScenario(preset)
}

// Dynamic SVG Sparkline Computation
const chartConfig = computed(() => {
  const configs = {
    do: { label: 'Dissolved Oxygen (DO)', unit: 'mg/L', color: '#06b6d4', min: 1, max: 9, key: 'do' },
    ammonia: { label: 'Total Ammonia Nitrogen (TAN)', unit: 'mg/L', color: '#f43f5e', min: 0, max: 2, key: 'ammonia' },
    ph: { label: 'Water pH', unit: 'pH', color: '#10b981', min: 6.0, max: 9.0, key: 'ph' },
    temp: { label: 'Temperature', unit: '°C', color: '#f59e0b', min: 22, max: 34, key: 'temp' }
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
  <div class="card card-iot h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>
        <i class="bi bi-activity me-2 text-info"></i>Sensors & Live Pond Telemetry
      </span>
      <div class="d-flex align-items-center gap-2">
        <span class="badge" :class="pondState.isPublishing ? 'bg-warning text-dark animate-pulse' : 'bg-secondary'">
          <i class="bi bi-broadcast me-1"></i>TX in: {{ pondState.nextPublishCountdown }}s
        </span>
        <button @click="triggerManualPublish" class="btn btn-primary btn-sm py-1 px-2" style="font-size: 0.78rem;" title="Force immediate telemetry transmission">
          <i class="bi bi-send-fill me-1"></i>Publish Now
        </button>
      </div>
    </div>

    <div class="card-body">
      <!-- Quick Simulation Presets -->
      <div class="d-flex flex-wrap gap-1 align-items-center mb-3 p-2 bg-dark rounded border border-secondary border-opacity-25">
        <span class="small text-secondary me-2"><i class="bi bi-magic me-1"></i>Scenario Presets:</span>
        <button @click="applyPreset('normal')" class="btn btn-outline-success btn-sm py-0 px-2" style="font-size: 0.75rem;">
          Normal / Optimal
        </button>
        <button @click="applyPreset('ammonia_spike')" class="btn btn-outline-danger btn-sm py-0 px-2" style="font-size: 0.75rem;">
          Ammonia Spike
        </button>
        <button @click="applyPreset('low_oxygen')" class="btn btn-outline-warning btn-sm py-0 px-2" style="font-size: 0.75rem;">
          Hypoxia (DO Drop)
        </button>
        <button @click="applyPreset('heavy_mud')" class="btn btn-outline-info btn-sm py-0 px-2" style="font-size: 0.75rem;">
          Heavy Sludge / TSS
        </button>
        
        <div class="ms-auto d-flex align-items-center gap-2">
          <label class="small text-secondary mb-0" style="font-size: 0.75rem;">Interval:</label>
          <select 
            class="form-select form-select-sm bg-black text-light border-secondary py-0 w-auto" 
            style="font-size: 0.75rem;" 
            :value="pondState.publishInterval" 
            @change="updateInterval"
          >
            <option value="2">2s (Fast)</option>
            <option value="5">5s (Default)</option>
            <option value="10">10s</option>
            <option value="30">30s</option>
          </select>
        </div>
      </div>

      <!-- Live Interactive Sensor Cards Row -->
      <div class="row g-2 mb-3">
        <!-- 1. DISSOLVED OXYGEN (DO) -->
        <div class="col-6 col-md-4 col-xl">
          <div class="sensor-card p-2 rounded bg-dark border border-secondary border-opacity-25">
            <div class="d-flex justify-content-between align-items-start">
              <span class="text-secondary small" style="font-size: 0.72rem;">DO (mg/L)</span>
              <span :class="['badge', doStatus.class]" style="font-size: 0.65rem;">{{ doStatus.text }}</span>
            </div>
            <div class="fs-4 fw-bold text-cyan font-monospace my-1">
              {{ pondState.dissolvedOxygen.toFixed(2) }}
            </div>
            <input 
              type="range" 
              class="form-range form-range-sm" 
              min="1.0" 
              max="9.0" 
              step="0.05" 
              v-model.number="pondState.dissolvedOxygen"
            >
          </div>
        </div>

        <!-- 2. AMMONIA (NH3/NH4) -->
        <div class="col-6 col-md-4 col-xl">
          <div class="sensor-card p-2 rounded bg-dark border border-secondary border-opacity-25">
            <div class="d-flex justify-content-between align-items-start">
              <span class="text-secondary small" style="font-size: 0.72rem;">Ammonia (mg/L)</span>
              <span :class="['badge', ammoniaStatus.class]" style="font-size: 0.65rem;">{{ ammoniaStatus.text }}</span>
            </div>
            <div class="fs-4 fw-bold text-danger font-monospace my-1">
              {{ pondState.ammonia.toFixed(3) }}
            </div>
            <input 
              type="range" 
              class="form-range form-range-sm" 
              min="0.01" 
              max="2.5" 
              step="0.01" 
              v-model.number="pondState.ammonia"
            >
          </div>
        </div>

        <!-- 3. pH WATER -->
        <div class="col-6 col-md-4 col-xl">
          <div class="sensor-card p-2 rounded bg-dark border border-secondary border-opacity-25">
            <div class="d-flex justify-content-between align-items-start">
              <span class="text-secondary small" style="font-size: 0.72rem;">pH Level</span>
              <span :class="['badge', phStatus.class]" style="font-size: 0.65rem;">{{ phStatus.text }}</span>
            </div>
            <div class="fs-4 fw-bold text-emerald font-monospace my-1">
              {{ pondState.ph.toFixed(2) }}
            </div>
            <input 
              type="range" 
              class="form-range form-range-sm" 
              min="6.0" 
              max="9.0" 
              step="0.05" 
              v-model.number="pondState.ph"
            >
          </div>
        </div>

        <!-- 4. TEMPERATURE -->
        <div class="col-6 col-md-6 col-xl">
          <div class="sensor-card p-2 rounded bg-dark border border-secondary border-opacity-25">
            <div class="d-flex justify-content-between align-items-start">
              <span class="text-secondary small" style="font-size: 0.72rem;">Temperature (°C)</span>
              <span :class="['badge', tempStatus.class]" style="font-size: 0.65rem;">{{ tempStatus.text }}</span>
            </div>
            <div class="fs-4 fw-bold text-warning font-monospace my-1">
              {{ pondState.temperature.toFixed(1) }}°C
            </div>
            <input 
              type="range" 
              class="form-range form-range-sm" 
              min="22.0" 
              max="35.0" 
              step="0.2" 
              v-model.number="pondState.temperature"
            >
          </div>
        </div>

        <!-- 5. TSS / SLUDGE TURBIDITY -->
        <div class="col-12 col-md-6 col-xl">
          <div class="sensor-card p-2 rounded bg-dark border border-secondary border-opacity-25">
            <div class="d-flex justify-content-between align-items-start">
              <span class="text-secondary small" style="font-size: 0.72rem;">Sludge / TSS (mg/L)</span>
              <span :class="['badge', mudStatus.class]" style="font-size: 0.65rem;">{{ mudStatus.text }}</span>
            </div>
            <div class="fs-4 fw-bold text-info font-monospace my-1">
              {{ pondState.mudSolids.toFixed(1) }}
            </div>
            <input 
              type="range" 
              class="form-range form-range-sm" 
              min="20.0" 
              max="450.0" 
              step="5.0" 
              v-model.number="pondState.mudSolids"
            >
          </div>
        </div>
      </div>

      <!-- Realtime Telemetry Rolling Sparkline / Trend Graph -->
      <div class="p-3 bg-black rounded border border-secondary border-opacity-25">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-graph-up text-cyan"></i>
            <span class="fw-bold small text-light">{{ chartConfig.label }} Live Trend</span>
            <span class="badge bg-dark border border-secondary text-secondary" style="font-size: 0.7rem;">
              Rolling 25 TX Packets
            </span>
          </div>

          <div class="btn-group btn-group-sm">
            <button 
              @click="selectedChartParam = 'do'" 
              :class="['btn btn-sm py-0 px-2', selectedChartParam === 'do' ? 'btn-info text-dark' : 'btn-outline-secondary']"
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

        <!-- SVG Rolling Trendline -->
        <div style="height: 120px; width: 100%;">
          <svg viewBox="0 0 600 120" preserveAspectRatio="none" style="width: 100%; height: 100%;">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="chartConfig.color" stop-opacity="0.35"/>
                <stop offset="100%" :stop-color="chartConfig.color" stop-opacity="0.0"/>
              </linearGradient>
            </defs>

            <!-- Grid horizontal lines -->
            <line x1="0" y1="20" x2="600" y2="20" stroke="#334155" stroke-width="0.5" stroke-dasharray="3,3"/>
            <line x1="0" y1="60" x2="600" y2="60" stroke="#334155" stroke-width="0.5" stroke-dasharray="3,3"/>
            <line x1="0" y1="100" x2="600" y2="100" stroke="#334155" stroke-width="0.5" stroke-dasharray="3,3"/>

            <!-- Area fill -->
            <polygon :points="chartAreaPoints" fill="url(#chartGradient)"/>

            <!-- Trend Polyline -->
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

        <div class="d-flex justify-content-between text-secondary font-monospace mt-1" style="font-size: 0.68rem;">
          <span>Earliest Sample</span>
          <span class="text-light">Current: {{ Number(pondState[chartConfig.key]).toFixed(2) }} {{ chartConfig.unit }}</span>
          <span>Latest TX</span>
        </div>
      </div>
    </div>
  </div>
</template>
