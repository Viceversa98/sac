<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

const formattedUptime = computed(() => {
  const s = props.node.uptimeSeconds
  const hrs = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const doStatus = computed(() => {
  if (props.node.dissolvedOxygen >= 5.0) return { text: 'Optimal', class: 'bg-success text-white' }
  if (props.node.dissolvedOxygen >= 3.5) return { text: 'Moderate', class: 'bg-warning text-dark' }
  return { text: 'Hypoxia', class: 'bg-danger text-white' }
})

const ammoniaStatus = computed(() => {
  if (props.node.ammonia < 0.25) return { text: 'Safe', class: 'bg-success text-white' }
  if (props.node.ammonia < 0.8) return { text: 'Warning', class: 'bg-warning text-dark' }
  return { text: 'Critical', class: 'bg-danger text-white' }
})

const phStatus = computed(() => {
  if (props.node.ph < 6.8) return { text: 'Acidic', class: 'bg-warning text-dark' }
  if (props.node.ph > 8.2) return { text: 'Alkaline', class: 'bg-danger text-white' }
  return { text: 'Optimal', class: 'bg-success text-white' }
})
</script>

<template>
  <div class="card card-iot h-100 shadow-sm border-top border-4" :class="node.pondId === 'K01' ? 'border-primary' : node.pondId === 'K02' ? 'border-success' : node.pondId === 'K03' ? 'border-info' : 'border-warning'">
    <!-- Node Header -->
    <div class="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
      <div>
        <div class="d-flex align-items-center gap-1">
          <span class="led-indicator on-green me-1" style="width: 8px; height: 8px;"></span>
          <strong class="text-dark small font-monospace">{{ node.id }}</strong>
          <span class="badge bg-light text-secondary border font-monospace" style="font-size: 0.65rem;">
            {{ node.pondId }}
          </span>
        </div>
        <div class="text-muted text-truncate" style="font-size: 0.72rem; max-width: 170px;">
          {{ node.name }}
        </div>
      </div>

      <!-- Quick Link Status -->
      <div class="text-end font-monospace" style="font-size: 0.68rem; color: #64748b;">
        <div><i class="bi bi-clock me-1 text-primary"></i>{{ formattedUptime }}</div>
        <div>{{ node.wifiRssi }}dBm | {{ node.batteryVoltage }}V</div>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body p-2 d-flex flex-column justify-content-between">
      <!-- 1. Live Telemetry Sensors (Compact 2x2 Grid) -->
      <div class="row g-1 mb-2">
        <!-- DO -->
        <div class="col-6">
          <div class="p-2 rounded bg-light border border-light-subtle h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-muted" style="font-size: 0.68rem;">DO (mg/L)</span>
              <span :class="['badge rounded-pill', doStatus.class]" style="font-size: 0.6rem; padding: 2px 5px;">
                {{ doStatus.text }}
              </span>
            </div>
            <div class="fs-5 fw-bold text-dark font-monospace lh-1">
              {{ node.dissolvedOxygen.toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- Ammonia -->
        <div class="col-6">
          <div class="p-2 rounded bg-light border border-light-subtle h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-muted" style="font-size: 0.68rem;">Ammonia (TAN)</span>
              <span :class="['badge rounded-pill', ammoniaStatus.class]" style="font-size: 0.6rem; padding: 2px 5px;">
                {{ ammoniaStatus.text }}
              </span>
            </div>
            <div class="fs-5 fw-bold text-dark font-monospace lh-1" :class="node.ammonia > 0.5 ? 'text-danger' : ''">
              {{ node.ammonia.toFixed(3) }}
            </div>
          </div>
        </div>

        <!-- pH & Temp -->
        <div class="col-6">
          <div class="p-2 rounded bg-light border border-light-subtle h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-muted" style="font-size: 0.68rem;">pH & Temp</span>
              <span :class="['badge rounded-pill', phStatus.class]" style="font-size: 0.6rem; padding: 2px 5px;">
                pH {{ node.ph.toFixed(1) }}
              </span>
            </div>
            <div class="fw-bold text-dark font-monospace lh-1" style="font-size: 0.95rem;">
              {{ node.ph.toFixed(2) }} <span class="fw-normal text-muted" style="font-size: 0.72rem;">| {{ node.temperature.toFixed(1) }}°C</span>
            </div>
          </div>
        </div>

        <!-- Sludge TSS -->
        <div class="col-6">
          <div class="p-2 rounded bg-light border border-light-subtle h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-muted" style="font-size: 0.68rem;">TSS / Sludge</span>
              <span class="badge bg-secondary text-white rounded-pill" style="font-size: 0.6rem; padding: 2px 5px;">
                {{ node.mudSolids > 200 ? 'Turbid' : 'Clear' }}
              </span>
            </div>
            <div class="fs-5 fw-bold text-dark font-monospace lh-1">
              {{ node.mudSolids.toFixed(0) }} <span class="fw-normal text-muted" style="font-size: 0.68rem;">mg/L</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Active Relay Execution Monitor (Action Berjalan) -->
      <div class="border rounded p-2 bg-white mb-2">
        <div class="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
          <span class="fw-bold small text-secondary" style="font-size: 0.72rem;">
            <i class="bi bi-gear-fill me-1 text-primary"></i>Actuator Relay Matrix
          </span>
          <span class="badge bg-light text-muted border font-monospace" style="font-size: 0.62rem;">
            Server Remote Mode
          </span>
        </div>

        <!-- Actuator 1: Aerator -->
        <div class="d-flex justify-content-between align-items-center mb-2 py-1 px-2 rounded bg-light" style="font-size: 0.74rem;">
          <div class="d-flex align-items-center gap-1">
            <i :class="['bi bi-fan fs-6 text-info', node.aerator.state === 'running' ? 'animate-spin-fast' : 'text-muted']"></i>
            <span class="fw-medium text-dark">Aerator:</span>
          </div>
          <div>
            <span v-if="node.aerator.state === 'running'" class="badge bg-info text-white font-monospace" style="font-size: 0.68rem;">
              RUNNING ({{ node.aerator.powerPercent }}%)
            </span>
            <span v-else class="badge bg-secondary text-white font-monospace" style="font-size: 0.68rem;">
              OFF
            </span>
          </div>
        </div>

        <!-- Actuator 2: Feeder -->
        <div class="mb-2 py-1 px-2 rounded bg-light" style="font-size: 0.74rem;">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <div class="d-flex align-items-center gap-1">
              <i :class="['bi bi-basket fs-6 text-success', node.feeder.state === 'running' ? 'animate-spin-fast' : 'text-muted']"></i>
              <span class="fw-medium text-dark">Feeder:</span>
            </div>
            <div>
              <span v-if="node.feeder.state === 'running'" class="badge bg-success text-white animate-pulse font-monospace" style="font-size: 0.68rem;">
                DISPENSING ({{ node.feeder.dose }}g)
              </span>
              <span v-else class="text-muted font-monospace" style="font-size: 0.68rem;">
                IDLE ({{ node.feeder.totalToday }}g today)
              </span>
            </div>
          </div>
          <div v-if="node.feeder.state === 'running'" class="progress" style="height: 4px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" :style="{ width: `${node.feeder.progress}%` }"></div>
          </div>
        </div>

        <!-- Actuator 3: Molasses -->
        <div class="mb-2 py-1 px-2 rounded bg-light" style="font-size: 0.74rem;">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <div class="d-flex align-items-center gap-1">
              <i :class="['bi bi-funnel fs-6 text-warning', node.molassesPump.state === 'running' ? 'animate-bounce' : 'text-muted']"></i>
              <span class="fw-medium text-dark">Molasses:</span>
            </div>
            <div>
              <span v-if="node.molassesPump.state === 'running'" class="badge bg-warning text-dark animate-pulse font-monospace" style="font-size: 0.68rem;">
                DOSING ({{ node.molassesPump.dose }}ml)
              </span>
              <span v-else class="text-muted font-monospace" style="font-size: 0.68rem;">
                IDLE ({{ node.molassesPump.totalToday }}ml today)
              </span>
            </div>
          </div>
          <div v-if="node.molassesPump.state === 'running'" class="progress" style="height: 4px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" :style="{ width: `${node.molassesPump.progress}%` }"></div>
          </div>
        </div>

        <!-- Actuator 4: Water Exchange -->
        <div class="py-1 px-2 rounded bg-light" style="font-size: 0.74rem;">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <div class="d-flex align-items-center gap-1">
              <i :class="['bi bi-arrow-repeat fs-6 text-primary', node.waterChange.state !== 'idle' ? 'animate-spin-fast' : 'text-muted']"></i>
              <span class="fw-medium text-dark">Water Siphon:</span>
            </div>
            <div>
              <span v-if="node.waterChange.state !== 'idle'" class="badge bg-primary text-white animate-pulse font-monospace" style="font-size: 0.68rem;">
                {{ node.waterChange.phase }} ({{ node.waterChange.volume }}L)
              </span>
              <span v-else class="text-muted font-monospace" style="font-size: 0.68rem;">
                STANDBY ({{ node.waterChange.totalToday }}L today)
              </span>
            </div>
          </div>
          <div v-if="node.waterChange.state !== 'idle'" class="progress" style="height: 4px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" :style="{ width: `${node.waterChange.progress}%` }"></div>
          </div>
        </div>
      </div>

      <!-- 3. Hardware LEDs Footer -->
      <div class="pt-2 border-top d-flex justify-content-between align-items-center" style="font-size: 0.68rem;">
        <span class="text-muted">LEDs:</span>
        <div class="d-flex align-items-center gap-1">
          <span :class="['led-indicator', node.leds.pwr ? 'on-red' : '']" title="Power" style="width: 8px; height: 8px;"></span>
          <span :class="['led-indicator', node.leds.wifi ? 'on-blue' : '']" title="WiFi" style="width: 8px; height: 8px;"></span>
          <span :class="['led-indicator', node.leds.mqttTx ? 'on-amber' : '']" title="MQTT TX" style="width: 8px; height: 8px;"></span>
          <span :class="['led-indicator', node.leds.actAerator ? 'on-cyan' : '']" title="Aerator Relay" style="width: 8px; height: 8px;"></span>
          <span :class="['led-indicator', node.leds.actFeeder ? 'on-green' : '']" title="Feeder Relay" style="width: 8px; height: 8px;"></span>
          <span :class="['led-indicator', node.leds.actMolasses ? 'on-purple' : '']" title="Molasses Relay" style="width: 8px; height: 8px;"></span>
          <span :class="['led-indicator', node.leds.actWater ? 'on-cyan' : '']" title="Water Flush Relay" style="width: 8px; height: 8px;"></span>
        </div>
        <span class="badge bg-light text-muted border font-monospace" style="font-size: 0.62rem;">
          {{ node.freeHeap ? Math.round(node.freeHeap / 1024) : 180 }}KB Heap
        </span>
      </div>
    </div>
  </div>
</template>
