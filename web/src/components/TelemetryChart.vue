<script setup>
import { ref, computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { LineChart, Calendar, Clock, BarChart3 } from 'lucide-vue-next'

const { activePond, generateHistoryData } = usePonds()

const selectedParam = ref('do') // 'do' | 'temp' | 'ammonia'
const selectedRange = ref('24h') // '24h' | '7d' | '30d'
const hoveredPoint = ref(null)

// Dynamic historical logs based on selected time range
const activeLogs = computed(() => {
  return generateHistoryData(selectedRange.value)
})

const activeParamConfig = computed(() => {
  if (selectedParam.value === 'do') {
    return {
      title: 'Dissolved Oxygen (DO)',
      unit: 'mg/L',
      color: '#0284c7',
      min: 2.0,
      max: 8.0,
      ticks: [8.0, 6.5, 5.0, 3.5, 2.0],
      thresholds: [
        {
          value: 5.0,
          label: 'Safe Boundary: ≥ 5.0 mg/L',
          color: '#059669', // Emerald
          type: 'safe'
        },
        {
          value: 3.5,
          label: 'Critical Hypoxia: < 3.5 mg/L',
          color: '#e11d48', // Rose
          type: 'danger'
        }
      ],
      formatter: v => `${v.toFixed(2)} mg/L (DO)`,
      tickFormatter: v => `${v.toFixed(1)}`
    }
  } else if (selectedParam.value === 'temp') {
    return {
      title: 'Water Temperature',
      unit: '°C',
      color: '#d97706',
      min: 24.0,
      max: 34.0,
      ticks: [34.0, 31.5, 29.0, 26.5, 24.0],
      thresholds: [
        {
          value: 30.0,
          label: 'Optimal Safe Ceiling: 30.0°C',
          color: '#059669',
          type: 'safe'
        },
        {
          value: 26.0,
          label: 'Metabolic Low Limit: 26.0°C',
          color: '#d97706',
          type: 'danger'
        }
      ],
      formatter: v => `${v.toFixed(1)} °C (Temp)`,
      tickFormatter: v => `${v.toFixed(1)}°`
    }
  } else {
    return {
      title: 'Total Ammonia Nitrogen (TAN)',
      unit: 'ppm',
      color: '#e11d48',
      min: 0.000,
      max: 0.100,
      ticks: [0.100, 0.075, 0.050, 0.025, 0.000],
      thresholds: [
        {
          value: 0.050,
          label: 'Max Safe Boundary: 0.050 ppm',
          color: '#e11d48',
          type: 'danger'
        }
      ],
      formatter: v => `${v.toFixed(3)} ppm (TAN)`,
      tickFormatter: v => `${v.toFixed(3)}`
    }
  }
})

const rangeMeta = computed(() => {
  if (selectedRange.value === '24h') {
    return {
      title: '24-Hour Diurnal Water Quality History',
      sub: `Hourly continuous sensor sampling across daylight & night photosynthesis cycles • ${activePond.value.name}`,
      axisLabels: ['08:00 (Yesterday)', '14:00 (Afternoon Peak)', '20:00 (Evening)', '02:00 (Midnight)', '08:00 (This Morning)']
    }
  } else if (selectedRange.value === '7d') {
    return {
      title: '7-Day Weekly Biological Trend Analytics',
      sub: `Weekly microbial floc stability & nitrification dynamics • ${activePond.value.name}`,
      axisLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun (Today)']
    }
  } else {
    return {
      title: '30-Day Monthly Aquaculture Growth Cycle',
      sub: `Longitudinal water quality stability & cumulative biofloc maturation • ${activePond.value.name}`,
      axisLabels: ['Week 1 (Day 1)', 'Week 2 (Day 8)', 'Week 3 (Day 15)', 'Week 4 (Day 22)', 'Day 30 (Today)']
    }
  }
})

// Compute SVG coordinate points, Y-axis scale ticks, and threshold lines
const chartPoints = computed(() => {
  const logs = activeLogs.value
  const count = logs.length
  const width = 800
  const height = 200
  const padTop = 20
  const padBottom = 20

  const cfg = activeParamConfig.value

  const getY = (val) => {
    const clamped = Math.max(cfg.min, Math.min(cfg.max, val))
    const norm = (clamped - cfg.min) / (cfg.max - cfg.min)
    return height - padBottom - norm * (height - padTop - padBottom)
  }

  const getTopPercent = (val) => {
    const clamped = Math.max(cfg.min, Math.min(cfg.max, val))
    const norm = (clamped - cfg.min) / (cfg.max - cfg.min)
    const y = height - padBottom - norm * (height - padTop - padBottom)
    return (y / height) * 100
  }

  // Y-axis tick values on left
  const ticks = cfg.ticks.map(val => ({
    val,
    y: getY(val),
    topPercent: getTopPercent(val),
    formatted: cfg.tickFormatter(val)
  }))

  // Threshold safe & danger boundary lines
  const thresholds = cfg.thresholds.map(th => ({
    ...th,
    y: getY(th.value),
    topPercent: getTopPercent(th.value)
  }))

  // Active telemetry curve coordinates
  const coords = logs.map((log, idx) => {
    const x = (idx / (count - 1)) * width
    const val = log[selectedParam.value]
    const y = getY(val)
    return { x, y, val, time: log.time }
  })

  const polyline = coords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const first = coords[0]
  const last = coords[coords.length - 1]
  const areaPolygon = `${polyline} ${last.x},${height - padBottom} ${first.x},${height - padBottom}`

  return { coords, polyline, areaPolygon, width, height, ticks, thresholds }
})
</script>

<template>
  <div class="chart-panel glass-panel">
    <!-- Header -->
    <div class="chart-header">
      <div class="header-left">
        <LineChart class="header-icon text-sky" :size="20" />
        <div>
          <h3 class="panel-title font-display">{{ rangeMeta.title }}</h3>
          <span class="panel-sub font-mono">{{ rangeMeta.sub }}</span>
        </div>
      </div>

      <!-- Controls Right: Time Range & Parameter Selectors -->
      <div class="chart-controls-group">
        <!-- Time Range Switcher Pills -->
        <div class="time-range-pills font-mono">
          <button 
            id="btn-range-24h"
            class="range-btn" 
            :class="{ active: selectedRange === '24h' }"
            @click="selectedRange = '24h'"
            title="Hourly readings across the last 24 hours"
          >
            <Clock :size="12" />
            <span>24 Hours (Daily)</span>
          </button>
          <button 
            id="btn-range-7d"
            class="range-btn" 
            :class="{ active: selectedRange === '7d' }"
            @click="selectedRange = '7d'"
            title="Daily averages across the last 7 days"
          >
            <Calendar :size="12" />
            <span>7 Days (Weekly)</span>
          </button>
          <button 
            id="btn-range-30d"
            class="range-btn" 
            :class="{ active: selectedRange === '30d' }"
            @click="selectedRange = '30d'"
            title="Monthly cumulative water quality curve"
          >
            <BarChart3 :size="12" />
            <span>30 Days (Monthly)</span>
          </button>
        </div>

        <!-- Parameter Switcher Pills -->
        <div class="param-pills">
          <button 
            class="param-btn" 
            :class="{ active: selectedParam === 'do' }"
            @click="selectedParam = 'do'"
          >
            Dissolved Oxygen (DO)
          </button>
          <button 
            class="param-btn" 
            :class="{ active: selectedParam === 'temp' }"
            @click="selectedParam = 'temp'"
          >
            Water Temp
          </button>
          <button 
            class="param-btn" 
            :class="{ active: selectedParam === 'ammonia' }"
            @click="selectedParam = 'ammonia'"
          >
            Ammonia (TAN)
          </button>
        </div>
      </div>
    </div>

    <!-- Threshold & Scale Legend Bar -->
    <div class="chart-legend-bar font-mono">
      <div class="legend-item active-metric">
        <span class="legend-indicator dot" :style="{ background: activeParamConfig.color }"></span>
        <span>Sensor Telemetry Curve ({{ activeParamConfig.title }})</span>
      </div>
      <div 
        v-for="th in activeParamConfig.thresholds" 
        :key="th.label"
        class="legend-item"
        :class="th.type"
      >
        <span class="legend-indicator dash" :style="{ borderColor: th.color }"></span>
        <span>{{ th.label }}</span>
      </div>
    </div>

    <!-- Layout: Separate Left Y-Axis HTML column + Vector SVG canvas to prevent text stretching -->
    <div class="chart-content-layout">
      <!-- Left Y-Axis Scale (Rendered in Native Crisp Typography, Never Stretched) -->
      <div class="y-axis-column font-mono">
        <span class="y-unit-badge">{{ activeParamConfig.unit }}</span>
        <div class="y-ticks-list">
          <div 
            v-for="(tick, idx) in chartPoints.ticks" 
            :key="idx" 
            class="y-tick-row"
            :style="{ top: tick.topPercent + '%' }"
          >
            <span class="y-tick-text">{{ tick.formatted }}</span>
            <span class="y-tick-mark"></span>
          </div>
        </div>
      </div>

      <!-- Chart Canvas Area (Vector SVG + Proportional HTML Threshold Badges) -->
      <div class="chart-canvas-area">
        <svg 
          :viewBox="`0 0 ${chartPoints.width} ${chartPoints.height}`" 
          preserveAspectRatio="none"
          class="chart-svg"
        >
          <defs>
            <linearGradient id="chartGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="activeParamConfig.color" stop-opacity="0.22" />
              <stop offset="100%" :stop-color="activeParamConfig.color" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <!-- Horizontal Grid Lines -->
          <g v-for="(tick, idx) in chartPoints.ticks" :key="'grid-' + idx">
            <line 
              x1="0" 
              :y1="tick.y" 
              :x2="chartPoints.width" 
              :y2="tick.y" 
              stroke="#f1f5f9" 
              stroke-width="1.2"
            />
          </g>

          <!-- Threshold Safe & Danger Boundary Dashed Lines -->
          <g v-for="th in chartPoints.thresholds" :key="'line-' + th.label">
            <line 
              x1="0" 
              :y1="th.y" 
              :x2="chartPoints.width" 
              :y2="th.y" 
              :stroke="th.color" 
              stroke-dasharray="6 5" 
              stroke-width="1.6"
            />
          </g>

          <!-- Area Fill -->
          <polygon :points="chartPoints.areaPolygon" fill="url(#chartGradientLight)" />

          <!-- Path Stroke Line -->
          <polyline 
            :points="chartPoints.polyline" 
            fill="none" 
            :stroke="activeParamConfig.color" 
            stroke-width="2.5" 
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Interactive Points -->
          <circle 
            v-for="(pt, idx) in chartPoints.coords" 
            :key="'dot-' + idx"
            :cx="pt.x" 
            :cy="pt.y" 
            :r="selectedRange === '30d' ? 3 : 4" 
            :fill="activeParamConfig.color"
            stroke="#ffffff"
            stroke-width="2"
            class="chart-dot"
            @mouseenter="hoveredPoint = pt"
            @mouseleave="hoveredPoint = null"
          />
        </svg>

        <!-- HTML Threshold Badges (Properly Proportioned, Crisp Typography) -->
        <div 
          v-for="th in chartPoints.thresholds" 
          :key="'badge-' + th.label"
          class="threshold-badge font-mono"
          :class="th.type"
          :style="{ top: th.topPercent + '%', borderColor: th.color, color: th.color }"
        >
          <span class="th-dot" :style="{ background: th.color }"></span>
          <span>{{ th.label }}</span>
        </div>

        <!-- Tooltip Box -->
        <div 
          v-if="hoveredPoint" 
          class="chart-tooltip font-mono"
          :style="{ left: (hoveredPoint.x / chartPoints.width * 100) + '%', top: hoveredPoint.y - 45 + 'px' }"
        >
          <span class="tooltip-time">{{ hoveredPoint.time }}</span>
          <span class="tooltip-val">{{ activeParamConfig.formatter(hoveredPoint.val) }}</span>
        </div>
      </div>
    </div>

    <!-- Time Labels Axis (Aligned Exactly with Canvas Area) -->
    <div class="time-axis font-mono">
      <span v-for="(lbl, idx) in rangeMeta.axisLabels" :key="idx">
        {{ lbl }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.chart-panel {
  padding: 14px 18px;
  margin-bottom: 16px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-xs);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: var(--sky-600);
}

.panel-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--text-primary);
}

.panel-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.chart-controls-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Time Range Switcher */
.time-range-pills {
  display: flex;
  gap: 4px;
  background: var(--bg-surface-subtle);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.range-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.15s ease;
}

.range-btn:hover {
  color: var(--text-primary);
}

.range-btn.active {
  background: #ffffff;
  color: var(--sky-700);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Parameter Switcher */
.param-pills {
  display: flex;
  gap: 4px;
  background: var(--bg-surface-subtle);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.param-btn {
  padding: 5px 11px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.15s ease;
}

.param-btn:hover {
  color: var(--text-primary);
}

.param-btn.active {
  background: #ffffff;
  color: var(--sky-700);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Threshold & Scale Legend Bar */
.chart-legend-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  padding: 6px 12px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-size: 0.68rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.legend-indicator.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-indicator.dash {
  width: 16px;
  height: 0;
  border-top: 2px dashed #059669;
}

/* Flex layout separating Y-Axis from SVG */
.chart-content-layout {
  display: flex;
  position: relative;
  width: 100%;
  height: 200px;
}

/* Left Y-Axis HTML column (Proportional typography) */
.y-axis-column {
  width: 58px;
  position: relative;
  flex-shrink: 0;
  border-right: 1px solid #cbd5e1;
  margin-right: 10px;
}

.y-unit-badge {
  position: absolute;
  top: 0px;
  right: 8px;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-secondary);
}

.y-ticks-list {
  position: relative;
  width: 100%;
  height: 100%;
}

.y-tick-row {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 5px;
}

.y-tick-text {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: -0.01em;
}

.y-tick-mark {
  width: 5px;
  height: 1px;
  background: #94a3b8;
}

/* Canvas Area */
.chart-canvas-area {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: visible;
}

.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.chart-dot {
  cursor: pointer;
  transition: r 0.2s ease;
}
.chart-dot:hover {
  r: 6;
}

/* HTML Threshold Badges - 100% Proportional font */
.threshold-badge {
  position: absolute;
  right: 12px;
  transform: translateY(-50%);
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid currentColor;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  z-index: 5;
  white-space: nowrap;
}

.threshold-badge.safe {
  background: #f0fdf4;
}

.threshold-badge.danger {
  background: #fff1f2;
}

.threshold-badge .th-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.chart-tooltip {
  position: absolute;
  transform: translateX(-50%);
  background: #ffffff;
  border: 1px solid var(--sky-200);
  padding: 5px 10px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  font-size: 0.72rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 10;
  white-space: nowrap;
}

.tooltip-time {
  color: var(--text-muted);
  font-size: 0.65rem;
}
.tooltip-val {
  color: var(--sky-700);
  font-weight: 700;
}

/* Time axis aligned with canvas area */
.time-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 0.68rem;
  color: var(--text-muted);
  padding-left: 68px; /* 58px y-axis + 10px margin */
  padding-right: 12px;
}

@media (max-width: 1100px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
