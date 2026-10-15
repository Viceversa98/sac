<script setup>
import { computed } from 'vue'
import { pondState, simulationEngine } from '../services/simulationEngine'

// Helper helpers for badges and health states
const phStatus = computed(() => {
  if (pondState.ph < 6.8) return { text: 'Asam', class: 'bg-warning text-dark' }
  if (pondState.ph > 8.2) return { text: 'Terlalu Basa', class: 'bg-danger' }
  return { text: 'Optimal', class: 'bg-success' }
})

const ammoniaStatus = computed(() => {
  if (pondState.ammonia < 0.25) return { text: 'Aman', class: 'bg-success' }
  if (pondState.ammonia < 0.8) return { text: 'Waspada', class: 'bg-warning text-dark' }
  return { text: 'Toksik / Kritis', class: 'bg-danger' }
})

const doStatus = computed(() => {
  if (pondState.dissolvedOxygen >= 5.0) return { text: 'Kaya Oksigen', class: 'bg-success' }
  if (pondState.dissolvedOxygen >= 3.5) return { text: 'Cukup', class: 'bg-warning text-dark' }
  return { text: 'Hipoksia Kritis', class: 'bg-danger' }
})

const mudStatus = computed(() => {
  if (pondState.mudSolids <= 150) return { text: 'Jernih', class: 'bg-success' }
  if (pondState.mudSolids <= 280) return { text: 'Mulai Keruh', class: 'bg-warning text-dark' }
  return { text: 'Lumpur Pekat', class: 'bg-danger' }
})

const tempStatus = computed(() => {
  if (pondState.temperature >= 26 && pondState.temperature <= 31) return { text: 'Stabil', class: 'bg-success' }
  return { text: 'Di Luar Kisaran', class: 'bg-warning text-dark' }
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
</script>

<template>
  <div class="card card-iot h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>
        <i class="bi bi-activity me-2 text-info"></i>Sensor & Telemetri Kolam
      </span>
      <div class="d-flex align-items-center gap-2">
        <span class="badge" :class="pondState.isPublishing ? 'bg-warning text-dark animate-pulse' : 'bg-secondary'">
          <i class="bi bi-broadcast me-1"></i>Next TX: {{ pondState.nextPublishCountdown }}s
        </span>
        <button @click="triggerManualPublish" class="btn btn-primary btn-sm py-1 px-2" style="font-size: 0.78rem;" title="Kirim telemetri saat ini juga">
          <i class="bi bi-send-fill me-1"></i>Kirim Sekarang
        </button>
      </div>
    </div>

    <div class="card-body">
      <!-- Quick Simulation Presets -->
      <div class="d-flex flex-wrap gap-1 align-items-center mb-3 p-2 bg-dark rounded border border-secondary border-opacity-25">
        <span class="small text-secondary me-2"><i class="bi bi-magic me-1"></i>Preset Skenario:</span>
        <button @click="applyPreset('normal')" class="btn btn-outline-success btn-sm py-0 px-2" style="font-size: 0.75rem;">
          Normal / Ideal
        </button>
        <button @click="applyPreset('ammonia_spike')" class="btn btn-outline-danger btn-sm py-0 px-2" style="font-size: 0.75rem;">
          Amoniak Tinggi
        </button>
        <button @click="applyPreset('low_oxygen')" class="btn btn-outline-warning btn-sm py-0 px-2" style="font-size: 0.75rem;">
          DO Rendah (Malam)
        </button>
        <button @click="applyPreset('heavy_mud')" class="btn btn-outline-info btn-sm py-0 px-2" style="font-size: 0.75rem;">
          Lumpur Menumpuk
        </button>
        
        <div class="ms-auto form-check form-switch mb-0">
          <input class="form-check-input" type="checkbox" id="autoDriftSwitch" v-model="pondState.autoDrift">
          <label class="form-check-label small text-secondary" for="autoDriftSwitch" style="font-size: 0.75rem;">
            Auto-Drift Alami
          </label>
        </div>
      </div>

      <!-- 5 Sensor Cards Grid -->
      <div class="row g-2 mb-3">
        <!-- 1. pH Sensor -->
        <div class="col-md-4 col-sm-6">
          <div class="p-2 rounded bg-dark border border-secondary border-opacity-25 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small"><i class="bi bi-droplet-half me-1 text-primary"></i>pH Air</span>
              <span :class="['badge font-monospace', phStatus.class]" style="font-size: 0.7rem;">{{ phStatus.text }}</span>
            </div>
            <div class="h3 fw-bold mb-1 text-light font-monospace">{{ pondState.ph.toFixed(2) }}</div>
            <input type="range" class="form-range" min="4.0" max="10.0" step="0.05" v-model.number="pondState.ph">
            <div class="d-flex justify-content-between text-secondary" style="font-size: 0.65rem;">
              <span>4.0 (Asam)</span>
              <span>7.0</span>
              <span>10.0 (Basa)</span>
            </div>
          </div>
        </div>

        <!-- 2. Temperatur Sensor -->
        <div class="col-md-4 col-sm-6">
          <div class="p-2 rounded bg-dark border border-secondary border-opacity-25 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small"><i class="bi bi-thermometer-half me-1 text-danger"></i>Temperatur</span>
              <span :class="['badge font-monospace', tempStatus.class]" style="font-size: 0.7rem;">{{ tempStatus.text }}</span>
            </div>
            <div class="h3 fw-bold mb-1 text-light font-monospace">{{ pondState.temperature.toFixed(1) }} <small class="text-secondary fs-6">°C</small></div>
            <input type="range" class="form-range" min="20.0" max="40.0" step="0.2" v-model.number="pondState.temperature">
            <div class="d-flex justify-content-between text-secondary" style="font-size: 0.65rem;">
              <span>20°C</span>
              <span>28°C (Ideal)</span>
              <span>40°C</span>
            </div>
          </div>
        </div>

        <!-- 3. Konsentrasi Amoniak -->
        <div class="col-md-4 col-sm-6">
          <div class="p-2 rounded bg-dark border border-secondary border-opacity-25 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small"><i class="bi bi-radioactive me-1 text-warning"></i>Amoniak (NH3)</span>
              <span :class="['badge font-monospace', ammoniaStatus.class]" style="font-size: 0.7rem;">{{ ammoniaStatus.text }}</span>
            </div>
            <div class="h3 fw-bold mb-1 text-light font-monospace">{{ pondState.ammonia.toFixed(3) }} <small class="text-secondary fs-6">ppm</small></div>
            <input type="range" class="form-range" min="0.0" max="3.0" step="0.02" v-model.number="pondState.ammonia">
            <div class="d-flex justify-content-between text-secondary" style="font-size: 0.65rem;">
              <span>0.00 (Bersih)</span>
              <span>0.50 (Batas)</span>
              <span>3.00 (Bahaya)</span>
            </div>
          </div>
        </div>

        <!-- 4. Total Lumpur Terlarut / Mud Solids -->
        <div class="col-md-6 col-sm-6">
          <div class="p-2 rounded bg-dark border border-secondary border-opacity-25 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small"><i class="bi bi-water me-1 text-secondary"></i>Total Lumpur (TSS)</span>
              <span :class="['badge font-monospace', mudStatus.class]" style="font-size: 0.7rem;">{{ mudStatus.text }}</span>
            </div>
            <div class="h3 fw-bold mb-1 text-light font-monospace">{{ pondState.mudSolids.toFixed(1) }} <small class="text-secondary fs-6">mg/L</small></div>
            <input type="range" class="form-range" min="10" max="500" step="5" v-model.number="pondState.mudSolids">
            <div class="d-flex justify-content-between text-secondary" style="font-size: 0.65rem;">
              <span>10 (Jernih)</span>
              <span>150 (Normal)</span>
              <span>500 (Endapan Tinggi)</span>
            </div>
          </div>
        </div>

        <!-- 5. Dissolved Oxygen (DO) -->
        <div class="col-md-6 col-sm-12">
          <div class="p-2 rounded bg-dark border border-secondary border-opacity-25 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small"><i class="bi bi-wind me-1 text-info"></i>DO (Oksigen Terlarut)</span>
              <span :class="['badge font-monospace', doStatus.class]" style="font-size: 0.7rem;">{{ doStatus.text }}</span>
            </div>
            <div class="h3 fw-bold mb-1 text-light font-monospace">{{ pondState.dissolvedOxygen.toFixed(2) }} <small class="text-secondary fs-6">mg/L</small></div>
            <input type="range" class="form-range" min="0.5" max="10.0" step="0.1" v-model.number="pondState.dissolvedOxygen">
            <div class="d-flex justify-content-between text-secondary" style="font-size: 0.65rem;">
              <span>0.5 (Kritis)</span>
              <span>5.0 (Optimal)</span>
              <span>10.0 (Jenuh)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Telemetry Frequency Controls Footer -->
      <div class="d-flex justify-content-between align-items-center small text-secondary pt-2 border-top border-secondary border-opacity-25">
        <div class="d-flex align-items-center">
          <i class="bi bi-clock me-1"></i>Interval Publikasi:
          <select class="form-select form-select-sm ms-2 bg-dark text-light border-secondary" style="width: auto; font-size: 0.78rem;" :value="pondState.publishInterval" @change="updateInterval">
            <option value="1">1 Detik (Fast Test)</option>
            <option value="3">3 Detik</option>
            <option value="5">5 Detik (Default)</option>
            <option value="10">10 Detik</option>
            <option value="30">30 Detik</option>
          </select>
        </div>
        <div class="text-end">
          <span class="badge bg-dark border border-secondary text-info font-monospace">
            Topik: esp32/{{ pondState.deviceId }}/telemetry
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
