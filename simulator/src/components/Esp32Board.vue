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

const handleReset = () => {
  pondState.uptimeSeconds = 0
  pondState.oledLines = [
    'BOOTING ESP32...',
    'INIT HARDWARE...',
    'FLASH MEMORY OK',
    'READY.'
  ]
  simulationEngine.publishEvent('DEVICE_REBOOT', { uptime_reset: true })
}

const handleProfileChange = (e) => {
  simulationEngine.setDeviceProfile(e.target.value)
}
</script>

<template>
  <div class="card card-iot h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>
        <i class="bi bi-cpu me-2 text-primary"></i>ESP32 Physical Microcontroller
      </span>
      <select 
        class="form-select form-select-sm bg-dark text-light border-secondary w-auto py-0" 
        style="font-size: 0.75rem;" 
        :value="pondState.deviceId"
        @change="handleProfileChange"
      >
        <option v-for="prof in DEVICE_PROFILES" :key="prof.id" :value="prof.id">
          {{ prof.id }} ({{ prof.pondId }})
        </option>
      </select>
    </div>
    <div class="card-body">
      <!-- PCB Board Container -->
      <div class="esp32-pcb p-3 text-light">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <!-- ESP-WROOM-32 RF Shield Box -->
          <div class="metal-chip p-2 text-center" style="width: 130px;">
            <div class="fw-bold small border-bottom pb-1 mb-1" style="font-size: 0.72rem; letter-spacing: 1px;">
              ESP-WROOM-32
            </div>
            <div style="font-size: 0.65rem; color: #94a3b8;">
              <div>WiFi + BT + BLE</div>
              <div class="mt-1">FCC ID: 2AC7Z</div>
              <div class="text-success mt-1">
                <i class="bi bi-shield-check me-1"></i>VERIFIED
              </div>
            </div>
          </div>

          <!-- Virtual 0.96 inch OLED Display (SSD1306) -->
          <div class="flex-grow-1 ms-3">
            <div class="oled-screen small">
              <div class="d-flex justify-content-between border-bottom pb-1 mb-1 text-info" style="font-size: 0.72rem;">
                <span>SSD1306 I2C</span>
                <span>RSSI: {{ pondState.wifiRssi }}dBm</span>
              </div>
              <div v-for="(line, idx) in pondState.oledLines" :key="idx" class="text-truncate" style="line-height: 1.35; font-size: 0.78rem;">
                {{ line }}
              </div>
            </div>
          </div>
        </div>

        <!-- Indicator LEDs Row -->
        <div class="bg-black bg-opacity-50 p-2 rounded border border-dark mb-3">
          <div class="row g-2 text-center small" style="font-size: 0.72rem;">
            <div class="col">
              <span :class="['led-indicator', pondState.leds.pwr ? 'on-red' : '']"></span>
              <div class="text-secondary mt-1">PWR</div>
            </div>
            <div class="col">
              <span :class="['led-indicator', pondState.leds.wifi ? 'on-blue' : '']"></span>
              <div class="text-secondary mt-1">WIFI</div>
            </div>
            <div class="col">
              <span :class="['led-indicator', pondState.leds.mqttTx ? 'on-amber' : '']"></span>
              <div class="text-secondary mt-1">MQTT_TX</div>
            </div>
            <div class="col">
              <span :class="['led-indicator', pondState.leds.actAerator ? 'on-cyan' : '']"></span>
              <div class="text-secondary mt-1">AERATOR</div>
            </div>
            <div class="col">
              <span :class="['led-indicator', pondState.leds.actFeeder ? 'on-green' : '']"></span>
              <div class="text-secondary mt-1">FEED</div>
            </div>
            <div class="col">
              <span :class="['led-indicator', pondState.leds.actMolasses ? 'on-purple' : '']"></span>
              <div class="text-secondary mt-1">MOLASSE</div>
            </div>
            <div class="col">
              <span :class="['led-indicator', pondState.leds.actWater ? 'on-cyan' : '']"></span>
              <div class="text-secondary mt-1">WATER</div>
            </div>
          </div>
        </div>

        <!-- Telemetry & Diagnostic Footer inside PCB -->
        <div class="d-flex justify-content-between align-items-center small text-secondary" style="font-size: 0.75rem;">
          <div>
            <i class="bi bi-clock-history me-1 text-info"></i>Uptime: 
            <span class="text-light font-monospace">{{ formattedUptime }}</span>
          </div>
          <div>
            <i class="bi bi-battery-charging me-1 text-success"></i>Batt: 
            <span class="text-light font-monospace">{{ pondState.batteryVoltage }}V</span>
          </div>
          <div>
            <i class="bi bi-memory me-1 text-warning"></i>Heap: 
            <span class="text-light font-monospace">{{ Math.round(pondState.freeHeap / 1024) }}KB</span>
          </div>
        </div>
      </div>

      <!-- Action Hardware Controls below PCB -->
      <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-secondary border-opacity-25">
        <button @click="handleReset" class="btn btn-outline-danger btn-sm" title="Reboot MCU and reset counters">
          <i class="bi bi-arrow-counterclockwise me-1"></i>Hardware Reset (EN Pin)
        </button>

        <span class="text-secondary small" style="font-size: 0.75rem;">
          Firmware: <strong class="text-light font-monospace">SAC-v1.2.0-PROD</strong>
        </span>
      </div>
    </div>
  </div>
</template>
