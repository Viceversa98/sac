<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { simulationEngine, pondState } from './services/simulationEngine'
import { mqttService } from './services/mqttService'

import Esp32Board from './components/Esp32Board.vue'
import TelemetryPanel from './components/TelemetryPanel.vue'
import ActuatorPanel from './components/ActuatorPanel.vue'
import BackendMockConsole from './components/BackendMockConsole.vue'
import MqttLogViewer from './components/MqttLogViewer.vue'
import BrokerConfigModal from './components/BrokerConfigModal.vue'

const showConfigModal = ref(false)

onMounted(() => {
  simulationEngine.start()
})

onUnmounted(() => {
  simulationEngine.stop()
})
</script>

<template>
  <div class="min-vh-100 d-flex flex-column pb-4">
    <!-- Top Navbar -->
    <nav class="navbar navbar-dark bg-black border-bottom border-secondary border-opacity-50 sticky-top px-3">
      <div class="container-fluid px-0">
        <a class="navbar-brand d-flex align-items-center mb-0" href="#">
          <span class="badge bg-primary me-2 px-2 py-1 fs-6">
            <i class="bi bi-cpu-fill"></i>
          </span>
          <span class="fw-bold fs-5">ESP32 IoT Simulator</span>
          <span class="text-secondary small ms-2 d-none d-sm-inline">| Smart Pond & Aquaculture</span>
        </a>

        <div class="d-flex align-items-center gap-2">
          <!-- Connection / Mode Badge -->
          <div class="d-flex align-items-center px-2 py-1 rounded bg-dark border border-secondary" style="font-size: 0.8rem;">
            <span class="led-indicator on-green me-2" style="width: 10px; height: 10px;"></span>
            <span class="text-light me-2">
              <strong v-if="mqttService.mode === 'dummy'">Dummy / Mock Mode</strong>
              <strong v-else>Real MQTT (WebSocket)</strong>
            </span>
            <span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50">
              Active
            </span>
          </div>

          <!-- Configuration Button -->
          <button @click="showConfigModal = true" class="btn btn-outline-secondary btn-sm" title="Pengaturan Broker & Device">
            <i class="bi bi-gear-fill me-1"></i>Konfigurasi
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Container Content -->
    <div class="container-fluid px-3 px-lg-4 mt-3 flex-grow-1">
      <!-- Section 1: ESP32 Hardware + Telemetry Sensors -->
      <div class="row g-3 mb-3">
        <div class="col-lg-5 col-xl-4">
          <Esp32Board />
        </div>
        <div class="col-lg-7 col-xl-8">
          <TelemetryPanel />
        </div>
      </div>

      <!-- Section 2: Actuators (Feeder, Molasses, Water Change) -->
      <div class="row g-3 mb-3">
        <div class="col-12">
          <ActuatorPanel />
        </div>
      </div>

      <!-- Section 3: Mock Backend & MQTT Inspector -->
      <div class="row g-3">
        <div class="col-lg-5">
          <BackendMockConsole />
        </div>
        <div class="col-lg-7">
          <MqttLogViewer />
        </div>
      </div>
    </div>

    <!-- Broker Configuration Modal -->
    <BrokerConfigModal 
      :show="showConfigModal" 
      @close="showConfigModal = false" 
    />
  </div>
</template>
