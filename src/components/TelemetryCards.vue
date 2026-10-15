<script setup>
import { computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { 
  Droplet, 
  Thermometer, 
  Biohazard, 
  Layers, 
  Scale, 
  Compass,
  Camera
} from 'lucide-vue-next'

const { activePond } = usePonds()

const doStatus = computed(() => {
  const v = activePond.value.telemetry.do
  if (v < 4.0) return { label: 'CRITICAL HYPOXIA', class: 'rose', border: 'border-rose' }
  if (v < 5.0) return { label: 'CAUTION (LOW)', class: 'amber', border: 'border-amber' }
  return { label: 'OPTIMAL & HEALTHY', class: 'emerald', border: '' }
})

const phStatus = computed(() => {
  const v = activePond.value.telemetry.ph
  if (v < 6.8 || v > 8.5) return { label: 'UNBALANCED', class: 'rose', border: 'border-rose' }
  if (v < 7.2 || v > 8.0) return { label: 'MONITOR CAREFULLY', class: 'amber', border: '' }
  return { label: 'BALANCED (NORMAL)', class: 'emerald', border: '' }
})

const ammoniaStatus = computed(() => {
  const v = activePond.value.telemetry.ammonia
  if (v >= 0.06) return { label: 'TOXIC DANGER', class: 'rose', border: 'border-rose' }
  if (v >= 0.04) return { label: 'ELEVATED', class: 'amber', border: 'border-amber' }
  return { label: 'SAFE & CLEAN', class: 'emerald', border: '' }
})

const flocStatus = computed(() => {
  const v = activePond.value.telemetry.flocDensity
  if (v < 5) return { label: 'TOO DILUTE', class: 'amber' }
  if (v > 20) return { label: 'TOO DENSE', class: 'amber' }
  return { label: 'THRIVING FLOC', class: 'emerald' }
})

const estimatedBiomass = computed(() => {
  return Math.round(activePond.value.fishCount * activePond.value.avgWeightGrams / 1000)
})
</script>

<template>
  <div class="telemetry-section">
    <div class="section-header-row">
      <div class="section-title-wrapper">
        <h2 class="section-title">
          <Droplet class="title-icon text-sky" :size="18" />
          Real-time Water Quality Conditions
        </h2>
        <span class="sensor-freq font-mono">Continuous sensor sampling • Pond: {{ activePond.name }}</span>
      </div>
      
      <div class="pond-badge-pill">
        <span class="active-pond-name font-display">{{ activePond.name }}</span>
      </div>
    </div>

    <div class="telemetry-grid">
      <!-- Dissolved Oxygen Card -->
      <div class="telemetry-card glass-panel" :class="doStatus.border">
        <div class="card-top">
          <div class="icon-wrap sky">
            <Droplet :size="18" />
          </div>
          <span class="badge" :class="'badge-' + doStatus.class">
            {{ doStatus.label }}
          </span>
        </div>
        <div class="card-body">
          <span class="metric-label">Dissolved Oxygen (DO)</span>
          <div class="metric-value-row">
            <span class="metric-number font-mono">{{ activePond.telemetry.do.toFixed(2) }}</span>
            <span class="metric-unit">mg/L</span>
          </div>

          <!-- Line Card Scale Tags (Min / Target / Max) -->
          <div class="gauge-scale-row font-mono">
            <span class="scale-tag min">MIN: 2.0</span>
            <span class="scale-tag target">TARGET: ≥ 5.0</span>
            <span class="scale-tag max">MAX: 8.0 mg/L</span>
          </div>

          <div class="gauge-bar-wrapper">
            <div 
              class="gauge-fill do" 
              :style="{ width: Math.min(100, (activePond.telemetry.do / 8) * 100) + '%' }"
            ></div>
            <div class="gauge-target-marker" style="left: 62.5%;" title="Target Minimum: 5.0 mg/L"></div>
          </div>
          <div class="card-footer-info">
            <span>Critical Hypoxia: &lt; 3.5 mg/L</span>
            <span>Healthy Band: 5.0 - 7.5 mg/L</span>
          </div>
        </div>
      </div>

      <!-- Water pH Card -->
      <div class="telemetry-card glass-panel" :class="phStatus.border">
        <div class="card-top">
          <div class="icon-wrap emerald">
            <Compass :size="18" />
          </div>
          <span class="badge" :class="'badge-' + phStatus.class">
            {{ phStatus.label }}
          </span>
        </div>
        <div class="card-body">
          <span class="metric-label">Water Acidity Level (pH)</span>
          <div class="metric-value-row">
            <span class="metric-number font-mono">{{ activePond.telemetry.ph.toFixed(2) }}</span>
            <span class="metric-unit">pH</span>
          </div>

          <!-- Line Card Scale Tags (Min / Target / Max) -->
          <div class="gauge-scale-row font-mono">
            <span class="scale-tag min">MIN: 6.0</span>
            <span class="scale-tag target">IDEAL: 7.2 - 8.0</span>
            <span class="scale-tag max">MAX: 9.0 pH</span>
          </div>

          <div class="gauge-bar-wrapper">
            <div 
              class="gauge-fill ph" 
              :style="{ width: Math.min(100, ((activePond.telemetry.ph - 6) / 3) * 100) + '%' }"
            ></div>
            <div class="gauge-target-marker" style="left: 50%;" title="Neutral Target 7.5"></div>
          </div>
          <div class="card-footer-info">
            <span>Buffer Stability: Normal</span>
            <span>Ideal Range: 7.2 - 8.0</span>
          </div>
        </div>
      </div>

      <!-- Water Temperature Card -->
      <div class="telemetry-card glass-panel">
        <div class="card-top">
          <div class="icon-wrap amber">
            <Thermometer :size="18" />
          </div>
          <span class="badge badge-emerald">OPTIMAL FOR FISH</span>
        </div>
        <div class="card-body">
          <span class="metric-label">Water Temperature</span>
          <div class="metric-value-row">
            <span class="metric-number font-mono">{{ activePond.telemetry.temp.toFixed(1) }}</span>
            <span class="metric-unit">°C</span>
          </div>

          <!-- Line Card Scale Tags (Min / Target / Max) -->
          <div class="gauge-scale-row font-mono">
            <span class="scale-tag min">MIN: 24.0°C</span>
            <span class="scale-tag target">OPT: 28.0 - 30.0°C</span>
            <span class="scale-tag max">MAX: 34.0°C</span>
          </div>

          <div class="gauge-bar-wrapper">
            <div 
              class="gauge-fill temp" 
              :style="{ width: Math.min(100, ((activePond.telemetry.temp - 24) / 10) * 100) + '%' }"
            ></div>
          </div>
          <div class="card-footer-info">
            <span>Feeding Response: Strong</span>
            <span>Optimum: 28.0 - 30.0 °C</span>
          </div>
        </div>
      </div>

      <!-- Total Ammonia (TAN) Card -->
      <div class="telemetry-card glass-panel" :class="ammoniaStatus.border">
        <div class="card-top">
          <div class="icon-wrap rose">
            <Biohazard :size="18" />
          </div>
          <span class="badge" :class="'badge-' + ammoniaStatus.class">
            {{ ammoniaStatus.label }}
          </span>
        </div>
        <div class="card-body">
          <span class="metric-label">Total Ammonia Nitrogen (TAN)</span>
          <div class="metric-value-row">
            <span class="metric-number font-mono">{{ activePond.telemetry.ammonia.toFixed(3) }}</span>
            <span class="metric-unit">ppm</span>
          </div>

          <!-- Line Card Scale Tags (Min / Target / Max) -->
          <div class="gauge-scale-row font-mono">
            <span class="scale-tag min safe">MIN: 0.000</span>
            <span class="scale-tag target alert">ALERT: &gt; 0.050</span>
            <span class="scale-tag max danger">MAX: 0.100 ppm</span>
          </div>

          <div class="gauge-bar-wrapper">
            <div 
              class="gauge-fill ammonia" 
              :style="{ width: Math.min(100, (activePond.telemetry.ammonia / 0.1) * 100) + '%' }"
            ></div>
            <div class="gauge-target-marker danger" style="left: 50%;" title="Danger Limit: 0.05 ppm"></div>
          </div>
          <div class="card-footer-info">
            <span>Biofloc Breakdown: Active</span>
            <span>Safe Threshold: &lt; 0.050 ppm</span>
          </div>
        </div>
      </div>

      <!-- Biofloc Volume Card -->
      <div class="telemetry-card glass-panel">
        <div class="card-top">
          <div class="icon-wrap sky">
            <Layers :size="18" />
          </div>
          <span class="badge" :class="'badge-' + flocStatus.class">
            {{ flocStatus.label }}
          </span>
        </div>
        <div class="card-body">
          <span class="metric-label">Bacterial Floc Density</span>
          <div class="metric-value-row">
            <span class="metric-number font-mono">{{ activePond.telemetry.flocDensity }}</span>
            <span class="metric-unit">mL/L</span>
          </div>

          <!-- Line Card Scale Tags (Min / Target / Max) -->
          <div class="gauge-scale-row font-mono">
            <span class="scale-tag min">MIN: 0</span>
            <span class="scale-tag target">TARGET: 10 - 15</span>
            <span class="scale-tag max">MAX: 25 mL/L</span>
          </div>

          <div class="gauge-bar-wrapper">
            <div 
              class="gauge-fill floc" 
              :style="{ width: Math.min(100, (activePond.telemetry.flocDensity / 25) * 100) + '%' }"
            ></div>
          </div>

          <!-- Sensor Hardware & Raw Optical Telemetry -->
          <div class="floc-sensor-box font-mono">
            <div class="sensor-title-row">
              <div class="sensor-tag-left">
                <Camera :size="12" class="text-sky" />
                <span class="sensor-hw-name">{{ activePond.telemetry.flocSensor?.model || 'Imhoff-Vision AI (ESP32-CAM) & NIR Probe' }}</span>
              </div>
              <span class="sensor-proto-tag">RS485 Modbus</span>
            </div>
            <div class="sensor-specs-grid">
              <div class="spec-item">
                <span class="spec-k">OD₆₀₀ Abs:</span>
                <span class="spec-v text-sky">{{ activePond.telemetry.flocSensor?.od600 ?? 0.42 }} AU</span>
              </div>
              <div class="spec-item">
                <span class="spec-k">TSS Solid:</span>
                <span class="spec-v text-emerald">{{ activePond.telemetry.flocSensor?.tssMgL ?? 485 }} mg/L</span>
              </div>
              <div class="spec-item">
                <span class="spec-k">Settling:</span>
                <span class="spec-v text-amber">{{ activePond.telemetry.flocSensor?.settlingRate ?? '1.8 mm/min' }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer-info">
            <span>Cycle: 15-min Auto Settling</span>
            <span>Standard: SNI 7550:2009 / APHA 2540 F</span>
          </div>
        </div>
      </div>

      <!-- Estimated Biomass Card -->
      <div class="telemetry-card glass-panel">
        <div class="card-top">
          <div class="icon-wrap emerald">
            <Scale :size="18" />
          </div>
          <span class="badge badge-cyan">FISHERIES EST.</span>
        </div>
        <div class="card-body">
          <span class="metric-label">Estimated Fish Biomass</span>
          <div class="metric-value-row">
            <span class="metric-number font-mono">{{ estimatedBiomass.toLocaleString() }}</span>
            <span class="metric-unit">kg</span>
          </div>

          <!-- Line Card Scale Tags (Min / Target / Max) -->
          <div class="gauge-scale-row font-mono">
            <span class="scale-tag min">MIN: 0 kg</span>
            <span class="scale-tag target">CURRENT: {{ estimatedBiomass }} kg</span>
            <span class="scale-tag max">MAX CAP: 2,500 kg</span>
          </div>

          <div class="biomass-details font-mono">
            <span>{{ activePond.fishCount.toLocaleString() }} fish</span>
            <span>•</span>
            <span>Avg: {{ activePond.avgWeightGrams }} g/fish</span>
          </div>
          <div class="card-footer-info">
            <span>Pond Capacity: {{ activePond.volumeM3 }} m³</span>
            <span>Density: {{ Math.round(estimatedBiomass / activePond.volumeM3) }} kg/m³</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.telemetry-section {
  margin-bottom: 16px;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title-wrapper {
  display: flex;
  flex-direction: column;
}

.title-icon {
  color: var(--sky-600);
}

.sensor-freq {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.pond-badge-pill {
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  padding: 3px 10px;
  border-radius: 999px;
}

.active-pond-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--sky-700);
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.telemetry-card {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  box-shadow: var(--shadow-xs);
}

.telemetry-card.border-rose {
  border-color: var(--rose-500);
  box-shadow: 0 0 0 1px var(--rose-500), var(--shadow-sm);
}

.telemetry-card.border-amber {
  border-color: var(--amber-500);
  box-shadow: 0 0 0 1px var(--amber-500), var(--shadow-sm);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-wrap.sky {
  background: var(--sky-50);
  color: var(--sky-600);
}
.icon-wrap.emerald {
  background: var(--emerald-50);
  color: var(--emerald-600);
}
.icon-wrap.amber {
  background: var(--amber-50);
  color: var(--amber-600);
}
.icon-wrap.rose {
  background: var(--rose-50);
  color: var(--rose-600);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-number {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.metric-unit {
  font-size: 0.76rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* Gauge Min / Target / Max scale tags */
.gauge-scale-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.65rem;
  margin-top: 6px;
  margin-bottom: 2px;
}

.scale-tag {
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
}

.scale-tag.min {
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
}

.scale-tag.target {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}

.scale-tag.target.alert {
  background: var(--amber-50);
  color: var(--amber-700);
  border-color: var(--amber-200);
}

.scale-tag.max {
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
}

.scale-tag.max.danger {
  color: var(--rose-600);
}

.gauge-bar-wrapper {
  position: relative;
  width: 100%;
  height: 6px;
  background: var(--bg-surface-subtle);
  border-radius: 999px;
  margin: 4px 0 6px;
  overflow: visible;
}

.gauge-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease;
}

.gauge-fill.do { background: linear-gradient(90deg, #0284c7, #38bdf8); }
.gauge-fill.ph { background: linear-gradient(90deg, #059669, #34d399); }
.gauge-fill.temp { background: linear-gradient(90deg, #d97706, #fbbf24); }
.gauge-fill.ammonia { background: linear-gradient(90deg, #059669, #e11d48); }
.gauge-fill.floc { background: linear-gradient(90deg, #0284c7, #059669); }

.gauge-target-marker {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  background: #0f172a;
}
.gauge-target-marker.danger {
  background: var(--rose-600);
}

.card-footer-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.biomass-details {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Floc Sensor Box Styling */
.floc-sensor-box {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 10px;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sensor-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.65rem;
}

.sensor-tag-left {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sensor-hw-name {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.66rem;
}

.sensor-proto-tag {
  background: var(--sky-100);
  color: var(--sky-800);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 700;
}

.sensor-specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  font-size: 0.65rem;
  background: #ffffff;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}

.spec-item {
  display: flex;
  flex-direction: column;
}

.spec-k {
  color: var(--text-muted);
  font-size: 0.58rem;
}

.spec-v {
  font-weight: 700;
}

@media (max-width: 1280px) {
  .telemetry-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .telemetry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
