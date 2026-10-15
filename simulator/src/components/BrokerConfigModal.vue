<script setup>
import { reactive, ref, onMounted } from 'vue'
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
  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.75);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-dark border-secondary text-light">
        <div class="modal-header border-secondary">
          <h5 class="modal-title">
            <i class="bi bi-sliders me-2 text-primary"></i>MQTT Connection & Operating Mode
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="emit('close')"></button>
        </div>

        <div class="modal-body">
          <!-- Mode Selector -->
          <div class="mb-3">
            <label class="form-label fw-bold small text-info">Communication Mode:</label>
            <div class="form-check p-2 rounded bg-black bg-opacity-40 border border-secondary mb-2">
              <input class="form-check-input ms-1" type="radio" id="modeDummy" value="dummy" v-model="form.mode">
              <label class="form-check-label ms-2" for="modeDummy">
                <strong>Internal Virtual Broker (Recommended for Local Dev)</strong>
                <div class="small text-secondary">
                  Simulator runs self-contained in your browser with cross-tab BroadcastChannel sync to the SAC frontend. No external network broker needed.
                </div>
              </label>
            </div>

            <div class="form-check p-2 rounded bg-black bg-opacity-40 border border-secondary">
              <input class="form-check-input ms-1" type="radio" id="modeReal" value="real" v-model="form.mode">
              <label class="form-check-label ms-2" for="modeReal">
                <strong>Real MQTT over WebSocket</strong>
                <div class="small text-secondary">
                  Connects your browser directly to an external Mosquitto, EMQX, or HiveMQ broker using WebSocket (ws:// or wss://).
                </div>
              </label>
            </div>
          </div>

          <!-- Real MQTT Settings -->
          <div v-if="form.mode === 'real'" class="border-top border-secondary pt-3 mt-3">
            <div class="mb-3">
              <label class="form-label small text-secondary">Broker Presets:</label>
              <div class="btn-group btn-group-sm w-100">
                <button type="button" @click="applyPreset('local')" class="btn btn-outline-secondary">Local Mosquitto (9001)</button>
                <button type="button" @click="applyPreset('emqx')" class="btn btn-outline-secondary">EMQX Public (wss)</button>
                <button type="button" @click="applyPreset('hivemq')" class="btn btn-outline-secondary">HiveMQ Public (wss)</button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small text-secondary">WebSocket URL:</label>
              <input type="text" class="form-control form-control-sm bg-black text-light border-secondary" v-model="form.brokerUrl" placeholder="ws://localhost:9001">
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label small text-secondary">Username (Optional):</label>
                <input type="text" class="form-control form-control-sm bg-black text-light border-secondary" v-model="form.username">
              </div>
              <div class="col-6">
                <label class="form-label small text-secondary">Password (Optional):</label>
                <input type="password" class="form-control form-control-sm bg-black text-light border-secondary" v-model="form.password">
              </div>
            </div>
          </div>

          <!-- Device ID -->
          <div class="border-top border-secondary pt-3 mt-3">
            <label class="form-label small text-secondary">ESP32 Device Node ID:</label>
            <input type="text" class="form-control form-control-sm bg-black text-light border-secondary" v-model="form.deviceId">
            <div class="small text-secondary mt-1" style="font-size: 0.72rem;">
              MQTT Topic format: <code>esp32/{{ form.deviceId }}/...</code>
            </div>
          </div>
        </div>

        <div class="modal-footer border-secondary">
          <button type="button" class="btn btn-secondary btn-sm" @click="emit('close')">Cancel</button>
          <button type="button" class="btn btn-primary btn-sm" @click="saveAndApply">Apply Configuration</button>
        </div>
      </div>
    </div>
  </div>
</template>
