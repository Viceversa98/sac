<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  Wifi, 
  Zap, 
  RotateCw, 
  Radio, 
  Server, 
  ArrowUpRight
} from 'lucide-vue-next'
import PageIntro from '../components/PageIntro.vue'

const router = useRouter()
const { ponds, setPond } = usePonds()
const { showToast } = useToast()

const isPingingAll = ref(false)
const pingResults = ref({})

// Dynamically generate hardware node representations from reactive ponds
const nodes = computed(() => {
  return ponds.value.map((pond, idx) => {
    const nodeNum = pond.id.replace(/\D/g, '') || (idx + 1).toString().padStart(2, '0')
    const ipLast = 100 + Number(nodeNum)
    const basePing = pingResults.value[pond.id] || (pond.id === 'K04' ? 28 : (pond.id === 'K01' ? 34 : (pond.id === 'K02' ? 42 : 36)))
    
    // Live sensors
    const sensors = [
      { name: 'DO Probe', code: 'RS485-DO', val: `${pond.telemetry?.do || 6.2} mg/L`, ok: (pond.telemetry?.do || 6.2) >= 3.5 },
      { name: 'pH Sensor', code: 'RS485-pH', val: `${pond.telemetry?.ph || 7.5} pH`, ok: true },
      { name: 'Temp Sensor', code: 'DS18B20', val: `${pond.telemetry?.temp || 28.5}Â°C`, ok: true }
    ]

    if (pond.telemetry?.flocSensor) {
      sensors.push({ 
        name: 'Imhoff AI', 
        code: 'NIR-Cam', 
        val: `${pond.telemetry.flocDensity || 12} mL/L`, 
        ok: true 
      })
    } else {
      sensors.push({ 
        name: 'Ammonia NH3', 
        code: 'OPT-NH3', 
        val: `${pond.telemetry?.ammonia || 0.02} ppm`, 
        ok: (pond.telemetry?.ammonia || 0.02) <= 0.05 
      })
    }

    // Live relays
    const feeder = pond.actuators?.feeder
    const aerator = pond.actuators?.aerator
    const dosing = pond.actuators?.dosing
    const flush = pond.actuators?.flush

    const relays = [
      {
        id: 'R1',
        name: 'Auto-Feeder',
        status: feeder?.status || 'IDLE',
        sub: `${feeder?.dispensedTodayKg || 0}kg`,
        active: feeder?.status === 'DISPENSING' || feeder?.status === 'ACTIVE'
      },
      {
        id: 'R2',
        name: 'VFD Aerator',
        status: aerator?.status || 'RUNNING',
        sub: `${aerator?.powerPercent || 80}%`,
        active: aerator?.status === 'RUNNING'
      },
      {
        id: 'R3',
        name: 'Molasses Valve',
        status: dosing?.status || 'STANDBY',
        sub: dosing?.status === 'DOSING' ? 'Dosing' : 'Closed',
        active: dosing?.status === 'DOSING'
      },
      {
        id: 'R4',
        name: 'Siphon Drain',
        status: flush?.status || 'STANDBY',
        sub: flush?.status === 'DRAINING' ? 'Drain' : 'Closed',
        active: flush?.status === 'DRAINING'
      }
    ]

    return {
      id: `ESP32-${pond.id}`,
      pondId: pond.id,
      pondName: pond.name,
      ip: `192.168.1.${ipLast}`,
      mac: `24:6F:28:B4:7A:0${idx + 1}`,
      firmware: 'v2.4.1-biofloc',
      rssi: pond.id === 'K04' ? '-52 dBm' : (pond.id === 'K01' ? '-58 dBm' : '-62 dBm'),
      signalBars: pond.id === 'K04' ? 4 : 3,
      status: 'ONLINE',
      pingMs: basePing,
      uptime: pond.id === 'K04' ? '24d 9h' : (pond.id === 'K01' ? '18d 4h' : '12d 6h'),
      sensors,
      relays
    }
  })
})

// Summary metrics across all nodes
const totalSensorsCount = computed(() => {
  return nodes.value.reduce((acc, n) => acc + n.sensors.length, 0)
})

const activeRelaysCount = computed(() => {
  return nodes.value.reduce((acc, n) => acc + n.relays.filter(r => r.active).length, 0)
})

const avgPingMs = computed(() => {
  if (!nodes.value.length) return 32
  const sum = nodes.value.reduce((acc, n) => acc + n.pingMs, 0)
  return Math.round(sum / nodes.value.length)
})

// Quick interactive actions
const pingNode = (node) => {
  const newPing = Math.floor(Math.random() * 15) + 24
  pingResults.value[node.pondId] = newPing
  showToast(`Ping to ${node.id} (${node.ip}): ${newPing} ms. Packet loss 0%.`, 'info')
}

const pingAllNodes = () => {
  isPingingAll.value = true
  setTimeout(() => {
    nodes.value.forEach(n => {
      pingResults.value[n.pondId] = Math.floor(Math.random() * 18) + 22
    })
    isPingingAll.value = false
    showToast(`Checked all ${nodes.value.length} nodes. Average latency ${avgPingMs.value} ms.`, 'success')
  }, 400)
}

const inspectNodePond = (pondId) => {
  setPond(pondId)
  router.push('/')
}
</script>

<template>
  <div class="hardware-view">
    <!-- View Header -->
    <div class="view-header">
      <PageIntro
        title="Equipment"
        purpose="Controllers and sensors for each pond. This hardware is simulated."
      />
      <div class="header-actions">
        <button
          id="btn-ping-all-nodes"
          type="button"
          class="btn-ping-all"
          :disabled="isPingingAll"
          @click="pingAllNodes"
        >
          <RotateCw :size="13" :class="{ 'spin-anim': isPingingAll }" aria-hidden="true" />
          <span>{{ isPingingAll ? 'Checking...' : 'Check all' }}</span>
        </button>
      </div>
    </div>

    <!-- 4 Network Summary Mini KPIs (Compact Strip) -->
    <div class="summary-kpis-bar font-mono">
      <div class="kpi-mini-card">
        <div class="kpi-mini-icon sky">
          <Server :size="14" />
        </div>
        <div class="kpi-mini-content">
          <span class="kpi-mini-lbl">Online Edge Nodes</span>
          <span class="kpi-mini-val text-sky">{{ nodes.length }} / {{ nodes.length }} <small>ESP32-S3</small></span>
        </div>
      </div>

      <div class="kpi-mini-card">
        <div class="kpi-mini-icon emerald">
          <Radio :size="14" />
        </div>
        <div class="kpi-mini-content">
          <span class="kpi-mini-lbl">RS485 Sensor Probes</span>
          <span class="kpi-mini-val text-emerald">{{ totalSensorsCount }} <small>Online (0 Faults)</small></span>
        </div>
      </div>

      <div class="kpi-mini-card">
        <div class="kpi-mini-icon amber">
          <Zap :size="14" />
        </div>
        <div class="kpi-mini-content">
          <span class="kpi-mini-lbl">Actuator Relays</span>
          <span class="kpi-mini-val text-amber">{{ activeRelaysCount }} <small>Energized ({{ nodes.length * 4 }} Total)</small></span>
        </div>
      </div>

      <div class="kpi-mini-card">
        <div class="kpi-mini-icon purple">
          <Wifi :size="14" />
        </div>
        <div class="kpi-mini-content">
          <span class="kpi-mini-lbl">MQTT Telemetry Latency</span>
          <span class="kpi-mini-val text-purple">{{ avgPingMs }}ms <small>RTT (0% Loss)</small></span>
        </div>
      </div>
    </div>

    <!-- Mode A: Compact Cards Grid (Default 4-col or 2-col) -->
    <div class="compact-nodes-grid">
      <div 
        v-for="node in nodes" 
        :key="node.id" 
        class="compact-node-card glass-panel"
      >
        <!-- Card Header: Compact & Direct -->
        <div class="c-node-head">
          <div class="c-head-left">
            <span class="c-pond-tag font-mono">{{ node.pondId }}</span>
            <div class="c-title-wrap">
              <span class="c-node-title font-display">{{ node.id }}</span>
              <span class="c-pond-sub">{{ node.pondName.split('—')[1]?.trim() || node.pondName }}</span>
            </div>
          </div>
          <div class="c-head-right font-mono">
            <span class="status-chip online">
              <span class="pulse-dot online"></span>
              {{ node.status }}
            </span>
          </div>
        </div>

        <!-- Network & System Info Bar (Super Compact Row) -->
        <div class="c-node-meta font-mono">
          <div class="meta-cell">
            <span class="meta-k">IP:</span>
            <span class="meta-v">{{ node.ip }}</span>
          </div>
          <div class="meta-cell">
            <span class="meta-k">RSSI:</span>
            <span class="meta-v text-emerald">{{ node.rssi }}</span>
          </div>
          <div class="meta-cell">
            <span class="meta-k">Up:</span>
            <span class="meta-v">{{ node.uptime }}</span>
          </div>
        </div>

        <!-- Section 1: RS485 Sensors (Compact 2x2 Pills) -->
        <div class="c-block">
          <div class="c-block-head">
            <span class="c-block-title font-mono">RS485 Telemetry Probes</span>
            <span class="c-block-count font-mono">{{ node.sensors.length }} ACTIVE</span>
          </div>
          <div class="c-sensors-grid font-mono">
            <div 
              v-for="(sensor, sIdx) in node.sensors" 
              :key="sIdx" 
              class="c-sensor-pill"
            >
              <div class="sensor-info-left">
                <span class="dot-indicator" :class="{ ok: sensor.ok }"></span>
                <span class="sensor-name">{{ sensor.name }}</span>
              </div>
              <span class="sensor-val" :class="sensor.ok ? 'text-primary' : 'text-rose'">{{ sensor.val }}</span>
            </div>
          </div>
        </div>

        <!-- Section 2: Actuator Relay Channels (Clean 4 Mini Tiles) -->
        <div class="c-block">
          <div class="c-block-head">
            <span class="c-block-title font-mono">Field Actuator Relays</span>
            <span class="c-block-count font-mono">4 CHANNELS</span>
          </div>
          <div class="c-relays-grid font-mono">
            <div 
              v-for="relay in node.relays" 
              :key="relay.id" 
              class="c-relay-tile"
              :class="{ active: relay.active }"
            >
              <div class="relay-tile-top">
                <span class="relay-id-tag">{{ relay.id }}</span>
                <span class="relay-status-text" :class="relay.active ? 'text-emerald' : 'text-muted'">
                  {{ relay.active ? 'ON' : 'OFF' }}
                </span>
              </div>
              <span class="relay-tile-name">{{ relay.name }}</span>
              <span class="relay-tile-sub">{{ relay.sub }}</span>
            </div>
          </div>
        </div>

        <!-- Card Footer: Quick Actions -->
        <div class="c-card-footer font-mono">
          <button 
            :id="'btn-ping-' + node.pondId"
            class="c-action-btn ping" 
            title="Send ICMP/MQTT Ping to node"
            @click="pingNode(node)"
          >
            <Wifi :size="12" />
            <span>{{ node.pingMs }}ms Ping</span>
          </button>
          <button 
            :id="'btn-inspect-node-' + node.pondId"
            class="c-action-btn inspect" 
            title="Inspect telemetry & controls in Overview"
            @click="inspectNodePond(node.pondId)"
          >
            <span>Inspect</span>
            <ArrowUpRight :size="12" />
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.hardware-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Header */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 18px;
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: var(--sky-50);
  border: 1px solid var(--sky-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.broker-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--emerald-700);
  background: var(--emerald-50);
  border: 1px solid var(--emerald-200);
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.view-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-ping-all {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid var(--border-medium);
  border-radius: 7px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-ping-all:hover:not(:disabled) {
  background: var(--sky-50);
  border-color: var(--sky-300);
  color: var(--sky-700);
}
.btn-ping-all:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}

.layout-toggle-group {
  display: flex;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 7px;
  padding: 2px;
  gap: 2px;
}

.layout-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.layout-btn:hover {
  color: var(--text-primary);
}
.layout-btn.active {
  background: #ffffff;
  color: var(--sky-700);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 4 Network Summary Mini KPIs Bar */
.summary-kpis-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kpi-mini-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-xs);
}

.kpi-mini-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-mini-icon.sky { background: var(--sky-50); color: var(--sky-600); }
.kpi-mini-icon.emerald { background: var(--emerald-50); color: var(--emerald-600); }
.kpi-mini-icon.amber { background: var(--amber-50); color: var(--amber-600); }
.kpi-mini-icon.purple { background: var(--purple-50); color: var(--purple-600); }

.kpi-mini-content {
  display: flex;
  flex-direction: column;
}

.kpi-mini-lbl {
  font-size: 0.62rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-mini-val {
  font-size: 0.88rem;
  font-weight: 800;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.kpi-mini-val small {
  font-size: 0.64rem;
  font-weight: 500;
  color: var(--text-muted);
}

/* Compact Nodes Grid */
.compact-nodes-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, 1fr);
}

.compact-node-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s ease;
}
.compact-node-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--sky-200);
}

/* Card Header */
.c-node-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.c-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.c-pond-tag {
  background: var(--sky-600);
  color: #ffffff;
  font-size: 0.64rem;
  font-weight: 800;
  padding: 3px 6px;
  border-radius: 5px;
  letter-spacing: 0.04em;
}

.c-title-wrap {
  display: flex;
  flex-direction: column;
}

.c-node-title {
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.c-pond-sub {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
}
.status-chip.online {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}

/* Network & System Info Bar */
.c-node-meta {
  display: flex;
  justify-content: space-between;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 0.65rem;
}

.meta-cell {
  display: flex;
  gap: 4px;
}

.meta-k {
  color: var(--text-muted);
}

.meta-v {
  font-weight: 700;
  color: var(--text-primary);
}

/* Block Section */
.c-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.c-block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-block-title {
  font-size: 0.64rem;
  font-weight: 800;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.c-block-count {
  font-size: 0.58rem;
  color: var(--text-muted);
  font-weight: 700;
}

/* Sensors Grid (Compact 2x2 Pills) */
.c-sensors-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.c-sensor-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  padding: 4px 6px;
  font-size: 0.62rem;
}

.sensor-info-left {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.dot-indicator {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
}
.dot-indicator.ok {
  background: var(--emerald-500);
  box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
}

.sensor-name {
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sensor-val {
  font-weight: 800;
  font-size: 0.62rem;
  margin-left: 4px;
  flex-shrink: 0;
}

/* Relays Grid (4 Compact Mini Tiles) */
.c-relays-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.c-relay-tile {
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 5px 6px;
  transition: all 0.15s ease;
}
.c-relay-tile.active {
  background: var(--emerald-50);
  border-color: var(--emerald-200);
}

.relay-tile-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.relay-id-tag {
  font-size: 0.58rem;
  font-weight: 800;
  color: var(--text-muted);
}

.relay-status-text {
  font-size: 0.58rem;
  font-weight: 800;
}

.relay-tile-name {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.relay-tile-sub {
  font-size: 0.56rem;
  color: var(--text-muted);
}

/* Card Footer Actions */
.c-card-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.c-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 0.64rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.c-action-btn.ping {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.c-action-btn.ping:hover {
  background: #ffffff;
  color: var(--sky-700);
  border-color: var(--sky-300);
}

.c-action-btn.inspect {
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  color: var(--sky-700);
}
.c-action-btn.inspect:hover {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
}

/* Mode B: Diagnostic Table */
.diagnostic-table-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: var(--shadow-xs);
}

.diag-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.72rem;
}

.diag-table th {
  padding: 10px 14px;
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
  font-weight: 700;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.64rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.diag-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.diag-table tr:last-child td {
  border-bottom: none;
}

.diag-node-col {
  display: flex;
  flex-direction: column;
}
.d-id { color: var(--text-primary); }
.d-pond { font-size: 0.64rem; }

.d-ip { display: block; color: var(--text-primary); }
.d-mac { font-size: 0.62rem; display: block; }

.d-rssi { display: block; }
.d-ping { font-size: 0.62rem; display: block; }

.d-up { font-size: 0.64rem; display: block; margin-top: 3px; }

.diag-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.diag-chip {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.62rem;
}
.diag-chip.sensor {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: var(--text-secondary);
}
.diag-chip.relay {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: var(--text-muted);
}
.diag-chip.relay.active {
  background: var(--emerald-50);
  border-color: var(--emerald-200);
  color: var(--emerald-700);
  font-weight: 700;
}

.diag-act-row {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.btn-diag-ping {
  padding: 4px 8px;
  border-radius: 5px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 0.64rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-diag-inspect {
  padding: 4px 8px;
  border-radius: 5px;
  border: 1px solid var(--sky-300);
  background: var(--sky-50);
  color: var(--sky-700);
  font-size: 0.64rem;
  font-weight: 700;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 1400px) {
  .compact-nodes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .summary-kpis-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  .compact-nodes-grid {
    grid-template-columns: 1fr;
  }
  .toggle-text {
    display: none;
  }
}

@media (max-width: 640px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .summary-kpis-bar {
    grid-template-columns: 1fr;
  }
}
</style>
