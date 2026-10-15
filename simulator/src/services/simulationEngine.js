import { reactive } from 'vue'
import { mqttService } from './mqttService'

export const pondState = reactive({
  // Sensors
  ph: 7.20,
  temperature: 28.5,
  ammonia: 0.22,
  mudSolids: 95.0, // Total lumpur terlarut (mg/L / NTU)
  dissolvedOxygen: 6.40, // DO (mg/L)
  
  // Settings
  autoDrift: true,
  publishInterval: 5, // detik
  nextPublishCountdown: 5,
  isPublishing: false,

  // Device Stats
  deviceId: 'ESP32-AQUA-01',
  uptimeSeconds: 0,
  batteryVoltage: 4.15,
  wifiRssi: -64,
  freeHeap: 185420,

  // Actuator States
  feeder: {
    state: 'idle', // 'idle' | 'running'
    dose: 0, // gram
    progress: 0,
    totalToday: 0,
    lastTriggered: null,
  },
  molassesPump: {
    state: 'idle', // 'idle' | 'running'
    dose: 0, // ml
    progress: 0,
    totalToday: 0,
    lastTriggered: null,
  },
  waterChange: {
    state: 'idle', // 'idle' | 'draining' | 'refilling'
    volume: 0, // liter
    progress: 0,
    totalToday: 0,
    phase: '', // 'Drain' | 'Refill'
    lastTriggered: null,
  },

  // LED and activity indicators
  leds: {
    pwr: true,
    wifi: true,
    mqttTx: false,
    actFeeder: false,
    actMolasses: false,
    actWater: false,
  },

  // OLED Screen Log Buffer (Virtual Screen)
  oledLines: [
    'ESP32 POND v1.0',
    'WiFi: CONNECTED',
    'MQTT: DUMMY_BUS',
    'SYSTEM READY',
  ],
})

class SimulationEngine {
  constructor() {
    this.telemetryTimer = null
    this.countdownTimer = null
    this.uptimeTimer = null
    this.driftTimer = null
  }

  start() {
    // Start MQTT service
    mqttService.connect()

    // Listen to incoming commands from MQTT
    mqttService.on('message', ({ topic, payload }) => {
      this.handleIncomingCommand(payload)
    })

    // Uptime & device metrics counter
    this.uptimeTimer = setInterval(() => {
      pondState.uptimeSeconds++
      // Subtle fluctuations in RSSI and battery
      if (pondState.uptimeSeconds % 10 === 0) {
        pondState.wifiRssi = -60 - Math.floor(Math.random() * 8)
        pondState.batteryVoltage = +(4.18 - (pondState.uptimeSeconds / 100000)).toFixed(2)
      }
    }, 1000)

    // Countdown and Telemetry Dispatcher
    this.startTelemetryLoop()

    // Natural pond parameter drift
    this.driftTimer = setInterval(() => {
      if (pondState.autoDrift) {
        this.applyNaturalDrift()
      }
    }, 3000)

    this.updateOled('MQTT CONNECTED', 'IDLE / RUNNING')
  }

  stop() {
    if (this.telemetryTimer) clearInterval(this.telemetryTimer)
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    if (this.uptimeTimer) clearInterval(this.uptimeTimer)
    if (this.driftTimer) clearInterval(this.driftTimer)
  }

  startTelemetryLoop() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    pondState.nextPublishCountdown = pondState.publishInterval

    this.countdownTimer = setInterval(() => {
      if (pondState.nextPublishCountdown > 1) {
        pondState.nextPublishCountdown--
      } else {
        pondState.nextPublishCountdown = pondState.publishInterval
        this.publishTelemetry()
      }
    }, 1000)
  }

  setPublishInterval(newInterval) {
    pondState.publishInterval = Math.max(1, Math.min(60, Number(newInterval) || 5))
    this.startTelemetryLoop()
  }

  publishTelemetry() {
    // Flash MQTT TX LED
    pondState.leds.mqttTx = true
    pondState.isPublishing = true
    setTimeout(() => {
      pondState.leds.mqttTx = false
      pondState.isPublishing = false
    }, 400)

    const payload = {
      device_id: pondState.deviceId,
      timestamp: Math.floor(Date.now() / 1000),
      sensors: {
        ph: +pondState.ph.toFixed(2),
        temperature: +pondState.temperature.toFixed(1),
        ammonia: +pondState.ammonia.toFixed(3),
        mud_solids: +pondState.mudSolids.toFixed(1),
        dissolved_oxygen: +pondState.dissolvedOxygen.toFixed(2),
      },
      actuators: {
        feeder: pondState.feeder.state,
        molasses_pump: pondState.molassesPump.state,
        water_change: pondState.waterChange.state,
      },
      device: {
        uptime_s: pondState.uptimeSeconds,
        rssi_dbm: pondState.wifiRssi,
        battery_v: pondState.batteryVoltage,
        free_heap: pondState.freeHeap,
      }
    }

    const topic = `esp32/${pondState.deviceId}/telemetry`
    mqttService.publish(topic, payload)

    this.updateOled(
      `pH:${payload.sensors.ph} T:${payload.sensors.temperature}C`,
      `DO:${payload.sensors.dissolved_oxygen} NH3:${payload.sensors.ammonia}`
    )
  }

  applyNaturalDrift() {
    // Only subtle variance (+- 0.02 pH, +- 0.05 C, etc.)
    const dPh = (Math.random() - 0.5) * 0.04
    pondState.ph = Math.min(9.5, Math.max(5.5, +(pondState.ph + dPh).toFixed(2)))

    const dTemp = (Math.random() - 0.5) * 0.1
    pondState.temperature = Math.min(38, Math.max(22, +(pondState.temperature + dTemp).toFixed(1)))

    const dAmmonia = (Math.random() - 0.48) * 0.01 // slight upward bias
    pondState.ammonia = Math.min(4.0, Math.max(0.01, +(pondState.ammonia + dAmmonia).toFixed(3)))

    const dMud = (Math.random() - 0.5) * 1.5
    pondState.mudSolids = Math.min(500, Math.max(10, +(pondState.mudSolids + dMud).toFixed(1)))

    const dDo = (Math.random() - 0.5) * 0.06
    pondState.dissolvedOxygen = Math.min(10.0, Math.max(1.0, +(pondState.dissolvedOxygen + dDo).toFixed(2)))
  }

  // --- ACTUATOR HANDLERS ---

  handleIncomingCommand(payload) {
    if (!payload || typeof payload !== 'object') {
      console.warn('Invalid command payload format:', payload)
      return
    }

    const action = (payload.action || payload.command || '').toLowerCase()
    const params = payload.params || payload.parameters || payload

    switch (action) {
      case 'feed':
      case 'feeder':
      case 'pakan':
        this.executeFeed(params.dose || params.amount || 50, params.unit || 'g', payload.command_id)
        break

      case 'pump_molasses':
      case 'molasses':
      case 'molase':
        this.executeMolasses(params.dose || params.amount || 100, params.unit || 'ml', payload.command_id)
        break

      case 'water_change':
      case 'ganti_air':
      case 'drain_refill':
        this.executeWaterChange(params.volume || params.dose || 200, params.unit || 'liter', payload.command_id)
        break

      default:
        console.warn('Unknown command action:', action)
        this.publishEvent('COMMAND_UNKNOWN', {
          action,
          message: 'Aksi perintah tidak dikenali oleh firmware ESP32',
        })
        break
    }
  }

  executeFeed(dose, unit = 'g', commandId = null) {
    if (pondState.feeder.state === 'running') {
      this.publishEvent('FEEDER_BUSY', { message: 'Feeder sedang berjalan, abaikan perintah duplikat' })
      return
    }

    pondState.feeder.state = 'running'
    pondState.feeder.dose = dose
    pondState.feeder.progress = 0
    pondState.feeder.lastTriggered = new Date().toLocaleTimeString()
    pondState.leds.actFeeder = true

    this.publishEvent('FEED_STARTED', {
      command_id: commandId,
      dose,
      unit,
      timestamp: Date.now()
    })
    this.updateOled(`FEEDING: ${dose}${unit}`, 'SERVO SPINNING...')

    // Duration is proportional to dose (e.g. 1 second per 20g, minimum 3s, max 15s)
    const totalDurationSeconds = Math.max(3, Math.min(15, Math.ceil(dose / 15)))
    let elapsed = 0

    const feedInterval = setInterval(() => {
      elapsed++
      pondState.feeder.progress = Math.min(100, Math.round((elapsed / totalDurationSeconds) * 100))

      if (elapsed >= totalDurationSeconds) {
        clearInterval(feedInterval)
        pondState.feeder.state = 'idle'
        pondState.feeder.progress = 100
        pondState.feeder.totalToday += Number(dose)
        pondState.leds.actFeeder = false

        // Biological side effect: Fish feeding increases ammonia slightly after some time
        pondState.ammonia = +(pondState.ammonia + 0.05).toFixed(3)

        this.publishEvent('FEED_COMPLETED', {
          command_id: commandId,
          dose,
          unit,
          total_today: pondState.feeder.totalToday,
          duration_seconds: totalDurationSeconds
        })
        this.updateOled('FEED DONE', 'IDLE')
      }
    }, 1000)
  }

  executeMolasses(dose, unit = 'ml', commandId = null) {
    if (pondState.molassesPump.state === 'running') {
      this.publishEvent('MOLASSES_BUSY', { message: 'Pompa molase sedang berjalan' })
      return
    }

    pondState.molassesPump.state = 'running'
    pondState.molassesPump.dose = dose
    pondState.molassesPump.progress = 0
    pondState.molassesPump.lastTriggered = new Date().toLocaleTimeString()
    pondState.leds.actMolasses = true

    this.publishEvent('MOLASSES_PUMP_STARTED', {
      command_id: commandId,
      dose,
      unit,
      timestamp: Date.now()
    })
    this.updateOled(`MOLASSES: ${dose}${unit}`, 'PUMP ACTIVE...')

    // Duration: 1s per 20ml, min 4s, max 20s
    const totalDurationSeconds = Math.max(4, Math.min(20, Math.ceil(dose / 15)))
    let elapsed = 0

    const pumpInterval = setInterval(() => {
      elapsed++
      pondState.molassesPump.progress = Math.min(100, Math.round((elapsed / totalDurationSeconds) * 100))

      // Gradual biological improvement: Molasses feeds probiotic bacteria which consumes ammonia
      if (pondState.ammonia > 0.05) {
        pondState.ammonia = Math.max(0.02, +(pondState.ammonia - 0.015).toFixed(3))
      }

      if (elapsed >= totalDurationSeconds) {
        clearInterval(pumpInterval)
        pondState.molassesPump.state = 'idle'
        pondState.molassesPump.progress = 100
        pondState.molassesPump.totalToday += Number(dose)
        pondState.leds.actMolasses = false

        this.publishEvent('MOLASSES_PUMP_COMPLETED', {
          command_id: commandId,
          dose,
          unit,
          total_today: pondState.molassesPump.totalToday,
          duration_seconds: totalDurationSeconds
        })
        this.updateOled('MOLASSES DONE', 'IDLE')
      }
    }, 1000)
  }

  executeWaterChange(volume, unit = 'liter', commandId = null) {
    if (pondState.waterChange.state !== 'idle') {
      this.publishEvent('WATER_CHANGE_BUSY', { message: 'Proses ganti air sedang berjalan' })
      return
    }

    pondState.waterChange.state = 'draining'
    pondState.waterChange.volume = volume
    pondState.waterChange.phase = 'Menguras (Drain)'
    pondState.waterChange.progress = 0
    pondState.waterChange.lastTriggered = new Date().toLocaleTimeString()
    pondState.leds.actWater = true

    this.publishEvent('WATER_CHANGE_STARTED', {
      command_id: commandId,
      volume,
      unit,
      step: 'DRAIN',
      timestamp: Date.now()
    })
    this.updateOled(`WATER CHG: ${volume}L`, 'DRAINING DIRTY...')

    // 2 Phase: Drain 50% time, Refill 50% time
    const totalDurationSeconds = Math.max(6, Math.min(24, Math.ceil(volume / 25)))
    const halfDuration = Math.floor(totalDurationSeconds / 2)
    let elapsed = 0

    const wcInterval = setInterval(() => {
      elapsed++
      pondState.waterChange.progress = Math.min(100, Math.round((elapsed / totalDurationSeconds) * 100))

      if (elapsed <= halfDuration) {
        pondState.waterChange.state = 'draining'
        pondState.waterChange.phase = 'Menguras Air Keruh...'
        // While draining, mud is being drawn out
        pondState.mudSolids = Math.max(30, +(pondState.mudSolids - 3.5).toFixed(1))
      } else {
        pondState.waterChange.state = 'refilling'
        pondState.waterChange.phase = 'Mengisi Air Bersih...'
        this.updateOled(`WATER CHG: ${volume}L`, 'REFILLING FRESH...')
        // While refilling fresh aerated water: DO goes up, ammonia diluted, pH normalized
        pondState.dissolvedOxygen = Math.min(7.8, +(pondState.dissolvedOxygen + 0.15).toFixed(2))
        pondState.ammonia = Math.max(0.05, +(pondState.ammonia - 0.03).toFixed(3))
        pondState.ph = +(pondState.ph + (7.4 - pondState.ph) * 0.1).toFixed(2)
      }

      if (elapsed >= totalDurationSeconds) {
        clearInterval(wcInterval)
        pondState.waterChange.state = 'idle'
        pondState.waterChange.phase = 'Selesai'
        pondState.waterChange.progress = 100
        pondState.waterChange.totalToday += Number(volume)
        pondState.leds.actWater = false

        this.publishEvent('WATER_CHANGE_COMPLETED', {
          command_id: commandId,
          volume,
          unit,
          total_today: pondState.waterChange.totalToday,
          final_sensors: {
            ph: pondState.ph,
            ammonia: pondState.ammonia,
            mud_solids: pondState.mudSolids,
            do: pondState.dissolvedOxygen
          }
        })
        this.updateOled('WATER CHG DONE', 'IDLE / BALANCED')
      }
    }, 1000)
  }

  publishEvent(eventType, eventData) {
    const topic = `esp32/${pondState.deviceId}/events`
    const payload = {
      device_id: pondState.deviceId,
      event: eventType,
      timestamp: Math.floor(Date.now() / 1000),
      data: eventData
    }
    mqttService.publish(topic, payload)
  }

  updateOled(line1, line2) {
    const timeStr = new Date().toLocaleTimeString().slice(0, 5)
    pondState.oledLines = [
      `[${pondState.deviceId}] ${timeStr}`,
      line1,
      line2,
      `TX in: ${pondState.nextPublishCountdown}s | Heap:${Math.round(pondState.freeHeap / 1024)}k`
    ]
  }

  // Pre-configured Scenarios for easy testing
  setScenario(type) {
    switch (type) {
      case 'normal':
        pondState.ph = 7.35
        pondState.temperature = 28.2
        pondState.ammonia = 0.12
        pondState.mudSolids = 80.0
        pondState.dissolvedOxygen = 6.5
        break
      case 'ammonia_spike':
        pondState.ph = 7.9
        pondState.temperature = 30.5
        pondState.ammonia = 1.45 // KRITIS
        pondState.mudSolids = 180.0
        pondState.dissolvedOxygen = 4.2
        break
      case 'low_oxygen':
        pondState.ph = 6.8
        pondState.temperature = 26.5
        pondState.ammonia = 0.45
        pondState.mudSolids = 120.0
        pondState.dissolvedOxygen = 2.4 // KRITIS
        break
      case 'heavy_mud':
        pondState.ph = 7.1
        pondState.temperature = 28.0
        pondState.ammonia = 0.85
        pondState.mudSolids = 350.0 // Sangat keruh/lumpur tinggi
        pondState.dissolvedOxygen = 3.8
        break
    }
    this.publishTelemetry()
  }
}

export const simulationEngine = new SimulationEngine()
