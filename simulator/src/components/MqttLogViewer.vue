<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { mqttService } from '../services/mqttService'

const logs = ref([])
const activeFilter = ref('ALL') // 'ALL' | 'OUTGOING' | 'INCOMING' | 'EVENT'
const autoScroll = ref(true)
const terminalRef = ref(null)

const handleNewLog = () => {
  logs.value = [...mqttService.messageLog]
  if (autoScroll.value && terminalRef.value) {
    setTimeout(() => {
      terminalRef.value.scrollTop = 0
    }, 50)
  }
}

const handleClear = () => {
  logs.value = []
}

onMounted(() => {
  logs.value = [...mqttService.messageLog]
  mqttService.on('log', handleNewLog)
  mqttService.on('log_clear', handleClear)
})

onUnmounted(() => {
  mqttService.off('log', handleNewLog)
  mqttService.off('log_clear', handleClear)
})

const filteredLogs = computed(() => {
  if (activeFilter.value === 'ALL') return logs.value
  if (activeFilter.value === 'OUTGOING') {
    return logs.value.filter(l => l.type === 'OUTGOING')
  }
  if (activeFilter.value === 'INCOMING') {
    return logs.value.filter(l => l.type.includes('INCOMING'))
  }
  if (activeFilter.value === 'EVENT') {
    return logs.value.filter(l => l.source && l.source.includes('/events'))
  }
  return logs.value
})

const clearAllLogs = () => {
  mqttService.clearLogs()
}

const copyToClipboard = (data) => {
  const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <div class="card card-iot h-100">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-terminal-split me-1 text-success"></i>
        <span>MQTT Traffic & Traffic Inspector</span>
        <span class="badge bg-secondary font-monospace" style="font-size: 0.72rem;">{{ filteredLogs.length }} Log</span>
      </div>

      <div class="d-flex align-items-center gap-1">
        <!-- Filter Buttons -->
        <div class="btn-group btn-group-sm me-2">
          <button 
            @click="activeFilter = 'ALL'" 
            :class="['btn btn-sm py-0 px-2', activeFilter === 'ALL' ? 'btn-secondary active' : 'btn-outline-secondary text-light']"
            style="font-size: 0.75rem;"
          >
            Semua
          </button>
          <button 
            @click="activeFilter = 'OUTGOING'" 
            :class="['btn btn-sm py-0 px-2', activeFilter === 'OUTGOING' ? 'btn-primary active' : 'btn-outline-primary']"
            style="font-size: 0.75rem;"
          >
            Telemetri (Out)
          </button>
          <button 
            @click="activeFilter = 'INCOMING'" 
            :class="['btn btn-sm py-0 px-2', activeFilter === 'INCOMING' ? 'btn-danger active' : 'btn-outline-danger']"
            style="font-size: 0.75rem;"
          >
            Perintah (In)
          </button>
          <button 
            @click="activeFilter = 'EVENT'" 
            :class="['btn btn-sm py-0 px-2', activeFilter === 'EVENT' ? 'btn-warning active' : 'btn-outline-warning']"
            style="font-size: 0.75rem;"
          >
            Events (ACK)
          </button>
        </div>

        <button @click="clearAllLogs" class="btn btn-outline-secondary btn-sm py-0 px-2" style="font-size: 0.75rem;" title="Bersihkan riwayat log">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>

    <div class="card-body p-2">
      <div ref="terminalRef" class="terminal-box p-2">
        <div v-if="filteredLogs.length === 0" class="text-secondary text-center py-4">
          <i class="bi bi-inbox fs-4 d-block mb-1"></i>
          Belum ada lalu lintas pesan MQTT yang tercatat.
        </div>

        <div v-for="log in filteredLogs" :key="log.id" class="terminal-line">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="text-secondary font-monospace" style="font-size: 0.72rem;">
              [{{ log.timestamp }}]
              <span v-if="log.type === 'OUTGOING'" class="badge bg-primary ms-1" style="font-size: 0.65rem;">
                <i class="bi bi-arrow-up-right me-1"></i>TX (OUT)
              </span>
              <span v-else-if="log.type.includes('INCOMING')" class="badge bg-danger ms-1" style="font-size: 0.65rem;">
                <i class="bi bi-arrow-down-left me-1"></i>RX (IN)
              </span>
              <span v-else-if="log.type === 'ERROR'" class="badge bg-danger ms-1" style="font-size: 0.65rem;">
                ERROR
              </span>
              <span v-else class="badge bg-secondary ms-1" style="font-size: 0.65rem;">
                SYSTEM
              </span>
              <span class="text-info ms-2">{{ log.source }}</span>
            </span>

            <button 
              @click="copyToClipboard(log.data)" 
              class="btn btn-link text-secondary p-0 text-decoration-none" 
              style="font-size: 0.7rem;" 
              title="Salin JSON"
            >
              <i class="bi bi-clipboard"></i>
            </button>
          </div>

          <!-- Payload Content -->
          <pre class="mb-0 text-light font-monospace small bg-black bg-opacity-40 p-2 rounded" style="font-size: 0.75rem; white-space: pre-wrap;">{{ typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
