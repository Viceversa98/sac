<script setup>
import { computed } from 'vue'
import { pondState, simulationEngine, DEVICE_PROFILES } from '../services/simulationEngine'
import { mqttService } from '../services/mqttService'

const formattedUptime = computed(() => {
  const s = pondState.uptimeSeconds
  const hrs = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const handleProfileChange = (e) => {
  simulationEngine.setDeviceProfile(e.target.value)
}

const phStatus = computed(() => {
  if (pondState.ph < 6.8) return { text: 'Acidic', class: 'bg-warning text-dark' }
  if (pondState.ph > 8.2) return { text: 'Alkaline', class: 'bg-danger text-white' }
  return { text: 'Optimal', class: 'bg-success text-white' }
})

const ammoniaStatus = computed(() => {
  if (pondState.ammonia < 0.25) return { text: 'Safe', class: 'bg-success text-white' }
  if (pondState.ammonia < 0.8) return { text: 'Warning', class: 'bg-warning text-dark' }
  return { text: 'Critical', class: 'bg-danger text-white' }
})

const doStatus = computed(() => {
  if (pondState.dissolvedOxygen >= 5.0) return { text: 'Optimal', class: 'bg-success text-white' }
  if (pondState.dissolvedOxygen >= 3.5) return { text: 'Moderate', class: 'bg-warning text-dark' }
  return { text: 'Hypoxia Risk', class: 'bg-danger text-white' }
})

const mudStatus = computed(() => {
  if (pondState.mudSolids <= 150) return { text: 'Clear', class: 'bg-success text-white' }
  if (pondState.mudSolids <= 280) return { text: 'Turbid', class: 'bg-warning text-dark' }
  return { text: 'Heavy Sludge', class: 'bg-danger text-white' }
})

const tempStatus = computed(() => {
  if (pondState.temperature >= 26 && pondState.temperature <= 31) return { text: 'Stable', class: 'bg-success text-white' }
  return { text: 'Suboptimal', class: 'bg-warning text-dark' }
})
</script>

<template>
  <div class="mb-4">
    <!-- Top System Card (Hardware Identity & Server Link) -->
    <div class="card card-iot mb-3">
      <div class="card-body p-3">
        <div class="row g-3 align-items-center">
          <!-- Device ID & Pond Selector -->
          <div class="col-md-4 col-xl-3 border-end-md">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary px-2 py-1">
                <i class="bi bi-cpu-fill me-1"></i>Node ID
              </span>
              <select 
                class="form-select form-select-sm bg-light border-secondary text-dark fw-bold w-auto"
                :value="pondState.deviceId"
                @change="handleProfileChange"
              >
                <option v-for="prof in DEVICE_PROFILES" :key="prof.id" :value="prof.id">
                  {{ prof.id }} ({{ prof.pondId }})
                </option>
              </select>
            </div>
            <div class="small text-muted text-truncate">
              {{ DEVICE_PROFILES.find(p => p.id === pondState.deviceId)?.name }}
            </div>
          </div>

          <!-- Server Link & Provenance Notice -->
          <div class="col-md-4 col-xl-4 border-end-md">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                <i class="bi bi-link-45deg me-1"></i>Server Slave Mode
              </span>
              <span class="badge bg-light text-secondary border">
                Full Remote Control
              </span>
            </div>
            <div class="small text-secondary" style="font-size: 0.78rem;">
              Orchestrated by SAC Platform (<a href="http://localhost:5173" target="_blank" class="text-decoration-none fw-semibold">localhost:5173</a>)
            </div>
          </div>

          <!-- Hardware Diagnostics & Mini LEDs -->
          <div class="col-md-4 col-xl-5">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div class="d-flex align-items-center gap-3 small text-secondary" style="font-size: 0.78rem;">
                <div>
                  <i class="bi bi-clock-history me-1 text-primary"></i>Uptime:
                  <strong class="text-dark font-monospace">{{ formattedUptime }}</strong>
                </div>
                <div>
                  <i class="bi bi-wifi me-1 text-info"></i>RSSI:
                  <strong class="text-dark font-monospace">{{ pondState.wifiRssi }} dBm</strong>
                </div>
                <div>
                  <i class="bi bi-battery-charging me-1 text-success"></i>Batt:
                  <strong class="text-dark font-monospace">{{ pondState.batteryVoltage }}V</strong>
                </div>
              </div>

              <!-- Hardware Activity LEDs -->
              <div class="d-flex align-items-center gap-2 bg-light px-2 py-1 rounded border">
                <span class="small text-muted me-1" style="font-size: 0.68rem;">LEDs:</span>
                <span :class="['led-indicator', pondState.leds.pwr ? 'on-red' : '']" title="Power"></span>
                <span :class="['led-indicator', pondState.leds.wifi ? 'on-blue' : '']" title="Wi-Fi"></span>
                <span :class="['led-indicator', pondState.leds.mqttTx ? 'on-amber' : '']" title="MQTT TX"></span>
                <span :class="['led-indicator', pondState.leds.actAerator ? 'on-cyan' : '']" title="Aerator Relay"></span>
                <span :class="['led-indicator', pondState.leds.actFeeder ? 'on-green' : '']" title="Feeder Relay"></span>
                <span :class="['led-indicator', pondState.leds.actMolasses ? 'on-purple' : '']" title="Molasses Relay"></span>
                <span :class="['led-indicator', pondState.leds.actWater ? 'on-cyan' : '']" title="Water Flush Relay"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Telemetry Status Metric Cards Grid -->
    <div class="row g-3">
      <!-- 1. DISSOLVED OXYGEN (DO) -->
      <div class="col-sm-6 col-lg-3">
        <div class="card card-iot h-100 border-start border-4 border-info">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small fw-semibold">Dissolved Oxygen</span>
              <span :class="['badge rounded-pill', doStatus.class]" style="font-size: 0.7rem;">
                {{ doStatus.text }}
              </span>
            </div>
            <div class="d-flex align-items-baseline gap-1 my-1">
              <span class="fs-2 fw-bold text-dark font-monospace">
                {{ pondState.dissolvedOxygen.toFixed(2) }}
              </span>
              <span class="text-muted small">mg/L</span>
            </div>
            <div class="small text-muted mt-2 pt-2 border-top d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>Target: 5.0 - 7.5 mg/L</span>
              <span v-if="pondState.aerator.state === 'running'" class="text-info fw-semibold">
                <i class="bi bi-fan me-1"></i>Aerator ON
              </span>
              <span v-else class="text-danger fw-semibold">
                <i class="bi bi-exclamation-circle me-1"></i>Aerator OFF
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. TOTAL AMMONIA NITROGEN (TAN) -->
      <div class="col-sm-6 col-lg-3">
        <div class="card card-iot h-100 border-start border-4" :class="pondState.ammonia > 0.5 ? 'border-danger' : 'border-success'">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small fw-semibold">Ammonia (TAN)</span>
              <span :class="['badge rounded-pill', ammoniaStatus.class]" style="font-size: 0.7rem;">
                {{ ammoniaStatus.text }}
              </span>
            </div>
            <div class="d-flex align-items-baseline gap-1 my-1">
              <span class="fs-2 fw-bold text-dark font-monospace" :class="pondState.ammonia > 0.5 ? 'text-danger' : ''">
                {{ pondState.ammonia.toFixed(3) }}
              </span>
              <span class="text-muted small">mg/L</span>
            </div>
            <div class="small text-muted mt-2 pt-2 border-top d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>Safety Limit: &lt; 0.50 mg/L</span>
              <span class="text-success fw-semibold">
                <i class="bi bi-check2-circle me-1"></i>Biofloc OK
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. pH WATER -->
      <div class="col-sm-6 col-lg-3">
        <div class="card card-iot h-100 border-start border-4 border-success">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small fw-semibold">Water pH</span>
              <span :class="['badge rounded-pill', phStatus.class]" style="font-size: 0.7rem;">
                {{ phStatus.text }}
              </span>
            </div>
            <div class="d-flex align-items-baseline gap-1 my-1">
              <span class="fs-2 fw-bold text-dark font-monospace">
                {{ pondState.ph.toFixed(2) }}
              </span>
              <span class="text-muted small">pH</span>
            </div>
            <div class="small text-muted mt-2 pt-2 border-top d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>Ideal Range: 7.0 - 8.2</span>
              <span class="text-secondary font-monospace">
                <i class="bi bi-thermometer-half me-1 text-warning"></i>{{ pondState.temperature.toFixed(1) }}°C
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. TSS / TURBIDITY -->
      <div class="col-sm-6 col-lg-3">
        <div class="card card-iot h-100 border-start border-4 border-warning">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-secondary small fw-semibold">Sludge / TSS Turbidity</span>
              <span :class="['badge rounded-pill', mudStatus.class]" style="font-size: 0.7rem;">
                {{ mudStatus.text }}
              </span>
            </div>
            <div class="d-flex align-items-baseline gap-1 my-1">
              <span class="fs-2 fw-bold text-dark font-monospace">
                {{ pondState.mudSolids.toFixed(1) }}
              </span>
              <span class="text-muted small">mg/L</span>
            </div>
            <div class="small text-muted mt-2 pt-2 border-top d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>Next Telemetry TX</span>
              <span class="badge bg-light text-primary border font-monospace">
                <i class="bi bi-broadcast me-1"></i>{{ pondState.nextPublishCountdown }}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 768px) {
  .border-end-md {
    border-right: 1px solid #e2e8f0;
  }
}
</style>
