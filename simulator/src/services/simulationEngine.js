import { reactive } from 'vue'
import { mqttService } from './mqttService'

function createNodeState(id, name, pondId, overrides = {}) {
  return {
    id,
    deviceId: id,
    name,
    pondId,
    ph: overrides.ph || 7.20,
    temperature: overrides.temperature || 28.5,
    ammonia: overrides.ammonia || 0.22,
    mudSolids: overrides.mudSolids || 95.0,
    dissolvedOxygen: overrides.dissolvedOxygen || 6.40,
    uptimeSeconds: 0,
    batteryVoltage: +(4.15 + (Math.random() * 0.05)).toFixed(2),
    wifiRssi: -60 - Math.floor(Math.random() * 10),
    freeHeap: 185000 + Math.floor(Math.random() * 5000),
    isPublishing: false,
    aerator: {
      state: overrides.aeratorState || 'running',
      powerPercent: overrides.aeratorPower || 100,
      lastTriggered: null,
    },
    feeder: {
      state: 'idle',
      dose: 0,
      progress: 0,
      totalToday: overrides.feedToday || 0,
      lastTriggered: null,
    },
    molassesPump: {
      state: 'idle',
      dose: 0,
      progress: 0,
      totalToday: overrides.molassesToday || 0,
      lastTriggered: null,
    },
    waterChange: {
      state: 'idle',
      volume: 0,
      progress: 0,
      totalToday: overrides.waterToday || 0,
      phase: '',
      lastTriggered: null,
    },
    leds: {
      pwr: true,
      wifi: true,
      mqttTx: false,
      actAerator: overrides.aeratorState !== 'idle',
      actFeeder: false,
      actMolasses: false,
      actWater: false,
    }
  }
}

export const nodes = reactive([
  createNodeState('ESP32-AQUA-01', 'Pond K01 - Biofloc Intensive', 'K01', {
    dissolvedOxygen: 6.40,
    ammonia: 0.22,
    ph: 7.20,
    temperature: 28.5,
    mudSolids: 95.0,
    aeratorState: 'running',
    aeratorPower: 100,
    feedToday: 240,
    molassesToday: 120
  }),
  createNodeState('ESP32-AQUA-02', 'Pond K02 - Nursery Alpha', 'K02', {
    dissolvedOxygen: 6.85,
    ammonia: 0.15,
    ph: 7.35,
    temperature: 28.8,
    mudSolids: 65.0,
    aeratorState: 'running',
    aeratorPower: 85,
    feedToday: 160,
    molassesToday: 60
  }),
  createNodeState('ESP32-AQUA-03', 'Pond K03 - Broodstock Center', 'K03', {
    dissolvedOxygen: 5.90,
    ammonia: 0.38,
    ph: 7.10,
    temperature: 27.9,
    mudSolids: 110.0,
    aeratorState: 'running',
    aeratorPower: 100,
    feedToday: 300,
    molassesToday: 150
  }),
  createNodeState('ESP32-AQUA-04', 'Pond K04 - Treatment / Quarantine', 'K04', {
    dissolvedOxygen: 4.80,
    ammonia: 0.65,
    ph: 6.95,
    temperature: 28.1,
    mudSolids: 145.0,
    aeratorState: 'running',
    aeratorPower: 100,
    feedToday: 80,
    molassesToday: 90
  }),
])

export const pondState = nodes[0]

export const clusterState = reactive({
  publishInterval: 5,
  nextPublishCountdown: 5,
  isLive: true,
})

class SimulationEngine {
  constructor() {
    this.countdownTimer = null
    this.uptimeTimer = null
    this.driftTimer = null
  }

  start() {
    mqttService.connect()

    // Listen to incoming commands from MQTT or Browser Sync Bus
    mqttService.on('message', ({ topic, deviceId, payload }) => {
      this.handleIncomingCommand(payload, deviceId)
    })

    // Uptime & diagnostic counter for all nodes
    this.uptimeTimer = setInterval(() => {
      nodes.forEach(node => {
        node.uptimeSeconds++
        if (node.uptimeSeconds % 12 === 0) {
          node.wifiRssi = -58 - Math.floor(Math.random() * 8)
          node.batteryVoltage = +(4.18 - (node.uptimeSeconds / 120000)).toFixed(2)
        }
      })
    }, 1000)

    // Countdown and Telemetry Dispatcher for all nodes
    this.startTelemetryLoop()

    // Natural pond parameter drift & biological model for all 4 nodes
    this.driftTimer = setInterval(() => {
      this.applyNaturalDriftAll()
    }, 3000)
  }

  stop() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    if (this.uptimeTimer) clearInterval(this.uptimeTimer)
    if (this.driftTimer) clearInterval(this.driftTimer)
  }

  startTelemetryLoop() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    clusterState.nextPublishCountdown = clusterState.publishInterval

    this.countdownTimer = setInterval(() => {
      if (clusterState.nextPublishCountdown > 1) {
        clusterState.nextPublishCountdown--
      } else {
        clusterState.nextPublishCountdown = clusterState.publishInterval
        this.publishTelemetryAll()
      }
    }, 1000)
  }

  publishTelemetryAll() {
    const now = new Date()
    nodes.forEach(node => {
      // Flash MQTT TX LED
      node.leds.mqttTx = true
      node.isPublishing = true
      setTimeout(() => {
        node.leds.mqttTx = false
        node.isPublishing = false
      }, 350)

      const telemetryPayload = {
        device_id: node.id,
        pond_id: node.pondId,
        timestamp: now.toISOString(),
        uptime_seconds: node.uptimeSeconds,
        system: {
          battery_v: node.batteryVoltage,
          wifi_rssi_dbm: node.wifiRssi,
          free_heap_bytes: node.freeHeap,
        },
        sensors: {
          ph: node.ph,
          temperature_c: node.temperature,
          dissolved_oxygen_mg_l: node.dissolvedOxygen,
          ammonia_mg_l: node.ammonia,
          mud_solids_mg_l: node.mudSolids,
        },
        actuators: {
          aerator: {
            state: node.aerator.state,
            power_percent: node.aerator.powerPercent
          },
          feeder: {
            state: node.feeder.state,
            total_today_grams: node.feeder.totalToday
          },
          molasses_pump: {
            state: node.molassesPump.state,
            total_today_ml: node.molassesPump.totalToday
          },
          water_change: {
            state: node.waterChange.state,
            total_today_liters: node.waterChange.totalToday
          }
        }
      }

      mqttService.publish(`esp32/${node.id}/telemetry`, telemetryPayload, node.id)
    })
  }

  applyNaturalDriftAll() {
    nodes.forEach(node => {
      // Biological DO Dynamics based on Aerator state:
      let dDo = 0
      if (node.aerator.state === 'running') {
        const aeratorFactor = (node.aerator.powerPercent || 100) / 100
        if (node.dissolvedOxygen < 7.2) {
          dDo = (0.03 + Math.random() * 0.04) * aeratorFactor
        } else {
          dDo = (Math.random() - 0.5) * 0.02
        }
      } else {
        // Hypoxia drift: oxygen decay without aeration
        dDo = -(0.03 + Math.random() * 0.035)
      }

      const dPh = (Math.random() - 0.5) * 0.015
      const dTemp = (Math.random() - 0.5) * 0.03
      const dAmmonia = (Math.random() - 0.47) * 0.006
      const dMud = (Math.random() - 0.5) * 0.35

      node.ph = Math.min(8.8, Math.max(6.2, +(node.ph + dPh).toFixed(2)))
      node.temperature = Math.min(33.0, Math.max(24.0, +(node.temperature + dTemp).toFixed(1)))
      node.ammonia = Math.min(2.5, Math.max(0.01, +(node.ammonia + dAmmonia).toFixed(3)))
      node.mudSolids = Math.min(450.0, Math.max(25.0, +(node.mudSolids + dMud).toFixed(1)))
      node.dissolvedOxygen = Math.min(9.5, Math.max(1.5, +(node.dissolvedOxygen + dDo).toFixed(2)))
    })
  }

  handleIncomingCommand(payload, targetDevId) {
    if (!payload || typeof payload !== 'object') return

    // Find targeted node
    let targetNode = nodes.find(n => n.id === targetDevId || n.id === payload.device_id || n.pondId === payload.pond_id)
    if (!targetNode) {
      targetNode = nodes[0] // fallback to first node
    }

    const action = (payload.action || payload.command || '').toLowerCase()
    const params = payload.params || payload.parameters || payload

    switch (action) {
      case 'aerator':
      case 'set_aerator':
      case 'paddlewheel':
      case 'blower':
        this.executeAerator(
          targetNode,
          params.state !== false && params.state !== 'off' && params.state !== 'idle',
          params.powerPercent || params.power || 100,
          payload.command_id
        )
        break

      case 'feed':
      case 'feeder':
      case 'pakan':
        this.executeFeed(targetNode, params.dose || params.amount || 50, params.unit || 'g', payload.command_id)
        break

      case 'pump_molasses':
      case 'molasses':
      case 'molase':
        this.executeMolasses(targetNode, params.dose || params.amount || 100, params.unit || 'ml', payload.command_id)
        break

      case 'water_change':
      case 'ganti_air':
      case 'drain_refill':
        this.executeWaterChange(targetNode, params.volume || params.dose || 200, params.unit || 'liter', payload.command_id)
        break

      default:
        console.warn('Unknown command action for node', targetNode.id, action)
        break
    }
  }

  executeAerator(node, enable = true, powerPercent = 100, commandId = null) {
    node.aerator.state = enable ? 'running' : 'idle'
    node.aerator.powerPercent = enable ? Math.min(100, Math.max(25, Number(powerPercent) || 100)) : 0
    node.aerator.lastTriggered = new Date().toLocaleTimeString()
    node.leds.actAerator = enable

    mqttService.publish(`esp32/${node.id}/events`, {
      device_id: node.id,
      event: enable ? 'AERATOR_STARTED' : 'AERATOR_STOPPED',
      data: { command_id: commandId, state: node.aerator.state, powerPercent: node.aerator.powerPercent }
    }, node.id)
  }

  executeFeed(node, dose, unit = 'g', commandId = null) {
    if (node.feeder.state === 'running') return

    node.feeder.state = 'running'
    node.feeder.dose = dose
    node.feeder.progress = 0
    node.feeder.lastTriggered = new Date().toLocaleTimeString()
    node.leds.actFeeder = true

    mqttService.publish(`esp32/${node.id}/events`, {
      device_id: node.id,
      event: 'FEED_STARTED',
      data: { command_id: commandId, dose, unit }
    }, node.id)

    const durationSec = Math.min(12, Math.max(3, Math.round(dose / 25)))
    const stepInterval = (durationSec * 1000) / 50

    let currentProgress = 0
    const feedInterval = setInterval(() => {
      currentProgress += 2
      node.feeder.progress = Math.min(100, currentProgress)

      if (currentProgress >= 100) {
        clearInterval(feedInterval)
        node.feeder.state = 'idle'
        node.feeder.progress = 100
        node.feeder.totalToday += Number(dose)
        node.leds.actFeeder = false

        setTimeout(() => {
          node.ammonia = +(node.ammonia + 0.04).toFixed(3)
        }, 3000)

        mqttService.publish(`esp32/${node.id}/events`, {
          device_id: node.id,
          event: 'FEED_COMPLETED',
          data: { command_id: commandId, total_today: node.feeder.totalToday }
        }, node.id)
      }
    }, stepInterval)
  }

  executeMolasses(node, dose, unit = 'ml', commandId = null) {
    if (node.molassesPump.state === 'running') return

    node.molassesPump.state = 'running'
    node.molassesPump.dose = dose
    node.molassesPump.progress = 0
    node.molassesPump.lastTriggered = new Date().toLocaleTimeString()
    node.leds.actMolasses = true

    mqttService.publish(`esp32/${node.id}/events`, {
      device_id: node.id,
      event: 'MOLASSES_STARTED',
      data: { command_id: commandId, dose, unit }
    }, node.id)

    const durationSec = Math.min(15, Math.max(4, Math.round(dose / 20)))
    const stepInterval = (durationSec * 1000) / 50

    let currentProgress = 0
    const pumpInterval = setInterval(() => {
      currentProgress += 2
      node.molassesPump.progress = Math.min(100, currentProgress)

      if (currentProgress % 20 === 0 && node.ammonia > 0.05) {
        node.ammonia = +(Math.max(0.02, node.ammonia - 0.02)).toFixed(3)
      }

      if (currentProgress >= 100) {
        clearInterval(pumpInterval)
        node.molassesPump.state = 'idle'
        node.molassesPump.progress = 100
        node.molassesPump.totalToday += Number(dose)
        node.leds.actMolasses = false

        mqttService.publish(`esp32/${node.id}/events`, {
          device_id: node.id,
          event: 'MOLASSES_COMPLETED',
          data: { command_id: commandId, total_today: node.molassesPump.totalToday }
        }, node.id)
      }
    }, stepInterval)
  }

  executeWaterChange(node, volume, unit = 'liter', commandId = null) {
    if (node.waterChange.state !== 'idle') return

    node.waterChange.state = 'draining'
    node.waterChange.volume = volume
    node.waterChange.progress = 0
    node.waterChange.phase = 'Drain Sludge'
    node.waterChange.lastTriggered = new Date().toLocaleTimeString()
    node.leds.actWater = true

    const totalDurationSec = Math.min(20, Math.max(6, Math.round(volume / 30)))
    const stepInterval = (totalDurationSec * 1000) / 50

    let currentProgress = 0
    const wcInterval = setInterval(() => {
      currentProgress += 2
      node.waterChange.progress = Math.min(100, currentProgress)

      if (currentProgress === 50) {
        node.waterChange.state = 'refilling'
        node.waterChange.phase = 'Refill Water'
      }

      if (currentProgress <= 50) {
        node.mudSolids = +(Math.max(25.0, node.mudSolids - 1.8)).toFixed(1)
      } else {
        node.dissolvedOxygen = +(Math.min(7.5, node.dissolvedOxygen + 0.06)).toFixed(2)
        node.ammonia = +(Math.max(0.05, node.ammonia - 0.03)).toFixed(3)
      }

      if (currentProgress >= 100) {
        clearInterval(wcInterval)
        node.waterChange.state = 'idle'
        node.waterChange.phase = 'Complete'
        node.waterChange.progress = 100
        node.waterChange.totalToday += Number(volume)
        node.leds.actWater = false
      }
    }, stepInterval)
  }
}

export const simulationEngine = new SimulationEngine()
