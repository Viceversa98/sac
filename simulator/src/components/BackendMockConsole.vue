<script setup>
import { ref } from 'vue'
import { pondState } from '../services/simulationEngine'
import { mqttService } from '../services/mqttService'

const customJson = ref(JSON.stringify({
  command_id: "cmd-" + Math.floor(Math.random() * 9000 + 1000),
  action: "feed",
  params: {
    dose: 150,
    unit: "g"
  }
}, null, 2))

const jsonError = ref('')

const sendAeratorCommand = (enable = true, power = 100) => {
  const payload = {
    command_id: "cmd-" + Math.floor(Math.random() * 9000 + 1000),
    action: "set_aerator",
    params: {
      state: enable,
      powerPercent: power
    }
  }
  mqttService.simulateIncomingCommand(payload)
}

const sendFeedCommand = (dose = 100) => {
  const payload = {
    command_id: "cmd-" + Math.floor(Math.random() * 9000 + 1000),
    action: "feed",
    params: {
      dose,
      unit: "g"
    }
  }
  mqttService.simulateIncomingCommand(payload)
}

const sendMolassesCommand = (dose = 75) => {
  const payload = {
    command_id: "cmd-" + Math.floor(Math.random() * 9000 + 1000),
    action: "pump_molasses",
    params: {
      dose,
      unit: "ml"
    }
  }
  mqttService.simulateIncomingCommand(payload)
}

const sendWaterChangeCommand = (volume = 200) => {
  const payload = {
    command_id: "cmd-" + Math.floor(Math.random() * 9000 + 1000),
    action: "water_change",
    params: {
      volume,
      unit: "liter"
    }
  }
  mqttService.simulateIncomingCommand(payload)
}

const sendCustomCommand = () => {
  jsonError.value = ''
  try {
    const parsed = JSON.parse(customJson.value)
    mqttService.simulateIncomingCommand(parsed)
  } catch (err) {
    jsonError.value = 'Invalid JSON payload format: ' + err.message
  }
}
</script>

<template>
  <div class="card card-iot h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>
        <i class="bi bi-cloud-arrow-down me-2 text-danger"></i>Mock Backend Server Console
      </span>
      <span class="badge bg-danger bg-opacity-75 font-monospace">Topic: esp32/{{ pondState.deviceId }}/commands</span>
    </div>

    <div class="card-body">
      <p class="small text-secondary mb-3">
        Use this console to inject backend remote control commands into the ESP32 firmware via MQTT simulation.
      </p>

      <!-- Quick Action Buttons -->
      <div class="d-flex flex-wrap gap-2 mb-3">
        <button 
          @click="sendAeratorCommand(pondState.aerator.state !== 'running', 100)" 
          class="btn btn-outline-info btn-sm flex-fill"
        >
          <i class="bi bi-fan me-1"></i>Toggle Aerator (100%)
        </button>
        <button @click="sendFeedCommand(120)" class="btn btn-outline-success btn-sm flex-fill">
          <i class="bi bi-basket me-1"></i>Feed (120g)
        </button>
        <button @click="sendMolassesCommand(80)" class="btn btn-outline-warning btn-sm flex-fill">
          <i class="bi bi-funnel me-1"></i>Molasses (80ml)
        </button>
        <button @click="sendWaterChangeCommand(250)" class="btn btn-outline-primary btn-sm flex-fill">
          <i class="bi bi-arrow-left-right me-1"></i>Water Change (250L)
        </button>
      </div>

      <!-- Custom JSON Editor -->
      <div class="mb-2">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <label class="form-label small text-secondary mb-0">Custom Command JSON Payload:</label>
          <span v-if="jsonError" class="text-danger small" style="font-size: 0.75rem;">
            <i class="bi bi-exclamation-triangle me-1"></i>{{ jsonError }}
          </span>
        </div>
        <textarea 
          class="form-control font-monospace bg-black text-light border-secondary" 
          rows="4" 
          v-model="customJson" 
          style="font-size: 0.8rem;"
        ></textarea>
      </div>

      <div class="d-flex justify-content-end">
        <button @click="sendCustomCommand" class="btn btn-danger btn-sm">
          <i class="bi bi-play-circle-fill me-1"></i>Dispatch JSON Command
        </button>
      </div>
    </div>
  </div>
</template>
