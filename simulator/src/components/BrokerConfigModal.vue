<script setup>
import { reactive } from 'vue'
import { mqttService } from '../services/mqttService'
import { pondState } from '../services/simulationEngine'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['close'])

const form = reactive({
  mode: mqttService.mode,
  brokerUrl: mqttService.config.brokerUrl,
  deviceId: mqttService.config.deviceId,
  username: mqttService.config.username,
  password: mqttService.config.password,
})

const applyPreset = (preset) => {
  if (preset === 'local') {
    form.brokerUrl = 'ws://localhost:9001'
  } else if (preset === 'emqx') {
    form.brokerUrl = 'wss://broker.emqx.io:8084/mqtt'
  } else if (preset === 'hivemq') {
    form.brokerUrl = 'wss://broker.hivemq.com:8884/mqtt'
  }
}

const saveAndApply = () => {
  mqttService.setConfig({
    brokerUrl: form.brokerUrl,
    deviceId: form.deviceId,
    username: form.username,
    password: form.password,
  })
  pondState.deviceId = form.deviceId

  mqttService.setMode(form.mode)
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(15, 23, 42, 0.45); backdrop-filter: blur(4px);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-white border-0 shadow-lg text-dark" style="border-radius: 16px;">
        <div class="modal-header border-bottom py-3 px-4">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
              <i class="bi bi-sliders fs-6"></i>
            </span>
            <h5 class="modal-title fs-6 fw-bold mb-0">MQTT Communication & Operating Mode</h5>
          </div>
          <button type="button" class="btn-close" @click="emit('close')"></button>
        </div>

        <div class="modal-body p-4">
          <!-- Mode Selector -->
          <div class="mb-3">
            <label class="form-label fw-bold small text-secondary">Communication Bus:</label>
            <div class="form-check p-3 rounded bg-light border mb-2 cursor-pointer">
              <input class="form-check-input ms-0" type="radio" id="modeDummy" value="dummy" v-model="form.mode">
              <label class="form-check-label ms-2" for="modeDummy">
                <strong class="text-dark">Internal Virtual Bus + Cross-Tab Sync (Active)</strong>
                <div class="small text-muted mt-1" style="font-size: 0.8rem;">
                  Simulator runs self-contained in your browser with automatic <code>BroadcastChannel</code> synchronization to the SAC frontend at <a href="http://localhost:5173" target="_blank">localhost:5173</a>. No external broker installation required.
                </div>
              </label>
            </div>

            <div class="form-check p-3 rounded bg-light border cursor-pointer">
              <input class="form-check-input ms-0" type="radio" id="modeReal" value="real" v-model="form.mode">
              <label class="form-check-label ms-2" for="modeReal">
                <strong class="text-dark">Real MQTT over WebSocket</strong>
                <div class="small text-muted mt-1" style="font-size: 0.8rem;">
                  Connects to a network or cloud MQTT broker (Mosquitto/EMQX/HiveMQ) using WebSocket protocols (ws:// or wss://).
                </div>
              </label>
            </div>
          </div>

          <!-- Real MQTT Settings -->
          <div v-if="form.mode === 'real'" class="border-top pt-3 mt-3">
            <div class="mb-3">
              <label class="form-label small text-secondary">Broker Presets:</label>
              <div class="btn-group btn-group-sm w-100">
                <button type="button" @click="applyPreset('local')" class="btn btn-outline-secondary">Local Mosquitto (9001)</button>
                <button type="button" @click="applyPreset('emqx')" class="btn btn-outline-secondary">EMQX Cloud (wss)</button>
                <button type="button" @click="applyPreset('hivemq')" class="btn btn-outline-secondary">HiveMQ (wss)</button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small text-secondary">WebSocket URL:</label>
              <input type="text" class="form-control form-control-sm" v-model="form.brokerUrl" placeholder="ws://localhost:9001">
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label small text-secondary">Username (Optional):</label>
                <input type="text" class="form-control form-control-sm" v-model="form.username">
              </div>
              <div class="col-6">
                <label class="form-label small text-secondary">Password (Optional):</label>
                <input type="password" class="form-control form-control-sm" v-model="form.password">
              </div>
            </div>
          </div>

          <!-- Device ID -->
          <div class="border-top pt-3 mt-3">
            <label class="form-label small text-secondary fw-semibold">ESP32 Device Node ID:</label>
            <input type="text" class="form-control form-control-sm" v-model="form.deviceId">
            <div class="small text-muted mt-1" style="font-size: 0.75rem;">
              Telemetry Topic: <code>esp32/{{ form.deviceId }}/telemetry</code>
            </div>
          </div>
        </div>

        <div class="modal-footer border-top py-2 px-4 bg-light" style="border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
          <button type="button" class="btn btn-light btn-sm border" @click="emit('close')">Cancel</button>
          <button type="button" class="btn btn-primary btn-sm px-3" @click="saveAndApply">Apply Configuration</button>
        </div>
      </div>
    </div>
  </div>
</template>
