<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { simulationEngine } from './services/simulationEngine'
import { mqttService } from './services/mqttService'

import DeviceStatusCards from './components/DeviceStatusCards.vue'
import ActiveExecutionPanel from './components/ActiveExecutionPanel.vue'
import TelemetryTrafficStream from './components/TelemetryTrafficStream.vue'
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
  <div class="min-vh-100 d-flex flex-column pb-5" style="background-color: #f8fafc;">
    <!-- Top White Modern Navbar -->
    <nav class="navbar navbar-light bg-white border-bottom sticky-top px-3 py-2 shadow-sm">
      <div class="container-fluid px-0 px-lg-2">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary p-2 rounded-3 text-white">
            <i class="bi bi-cpu-fill fs-5"></i>
          </span>
          <div>
            <div class="fw-bold fs-5 text-dark lh-sm">
              ESP32 IoT Edge Simulator
            </div>
            <div class="text-muted small" style="font-size: 0.75rem;">
              Smart Biofloc Aquaculture • Pure Edge Receiver Node
            </div>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <!-- Active Synchronization Badge -->
          <div class="d-none d-md-flex align-items-center px-3 py-1 rounded-pill bg-light border" style="font-size: 0.8rem;">
            <span class="led-indicator on-green me-2"></span>
            <span class="text-secondary me-2">Server Sync:</span>
            <strong class="text-dark">
              {{ mqttService.mode === 'dummy' ? 'Cross-Tab Bus Active' : 'WebSocket MQTT Connected' }}
            </strong>
          </div>

          <!-- Open SAC Platform Dashboard Button -->
          <a 
            href="http://localhost:5173" 
            target="_blank" 
            class="btn btn-outline-primary btn-sm rounded-pill px-3"
            title="Open Main Server Dashboard to trigger actions"
          >
            <i class="bi bi-box-arrow-up-right me-1"></i>Open SAC Dashboard
          </a>

          <!-- Configuration Button -->
          <button @click="showConfigModal = true" class="btn btn-light btn-sm border rounded-pill px-3 text-secondary" title="MQTT & Device Configuration">
            <i class="bi bi-gear-fill me-1"></i>Config
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Container Content -->
    <div class="container-fluid px-3 px-lg-4 mt-3 flex-grow-1">
      <!-- Info Notice Header -->
      <div class="alert alert-light border bg-white rounded-3 p-3 mb-3 d-flex align-items-center justify-content-between shadow-sm">
        <div class="d-flex align-items-center gap-2 small text-secondary">
          <i class="bi bi-info-circle-fill text-primary fs-5"></i>
          <span>
            <strong>Edge Node Listener Mode:</strong> This simulator operates strictly as a pond hardware receiver. 
            All actuator operations (feeding, molasses injection, aerator booster, water exchange) are <strong>orchestrated from the SAC Main Server</strong> at <a href="http://localhost:5173" target="_blank" class="fw-semibold">localhost:5173</a>.
          </span>
        </div>
        <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 small">
          Slave Firmware v1.2
        </span>
      </div>

      <!-- Section 1: Top Status Cards (Hardware Identity & Water Telemetry) -->
      <DeviceStatusCards />

      <!-- Section 2: Active Remote Operations Running Monitor (Visualisasi Action Berjalan) -->
      <ActiveExecutionPanel />

      <!-- Section 3: Telemetry Trendline & Server Traffic Packet Stream -->
      <TelemetryTrafficStream />
    </div>

    <!-- Broker Configuration Modal -->
    <BrokerConfigModal 
      :show="showConfigModal" 
      @close="showConfigModal = false" 
    />
  </div>
</template>
