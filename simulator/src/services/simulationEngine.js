import { reactive } from 'vue'
import { mqttService } from './mqttService'

export const DEVICE_PROFILES = [
  { id: 'ESP32-AQUA-01', name: 'Pond K01 - Biofloc Intensive (Tilapia)', pondId: 'K01' },
  { id: 'ESP32-AQUA-02', name: 'Pond K02 - Nursery Alpha (Fingerlings)', pondId: 'K02' },
  { id: 'ESP32-AQUA-03', name: 'Pond K03 - Broodstock Center', pondId: 'K03' },
  { id: 'ESP32-AQUA-04', name: 'Pond K04 - Treatment / Quarantine', pondId: 'K04' },
]

export const pondState = reactive({
  // Sensors
  ph: 7.20,
  temperature: 28.5,
  ammonia: 0.22,
  mudSolids: 95.0, // Total suspended solids / turbidity (mg/L / NTU)
  dissolvedOxygen: 6.40, // DO (mg/L)
  
  // Settings
  autoDrift: true,
  publishInterval: 5, // seconds
  nextPublishCountdown: 5,
  isPublishing: false,

  // Device Stats
  deviceId: 'ESP32-AQUA-01',
  uptimeSeconds: 0,
  batteryVoltage: 4.15,
  wifiRssi: -64,
  freeHeap: 185420,

  // Actuator States
  aerator: {
    state: 'running', // 'running' | 'idle'
    powerPercent: 100, // 0 - 100%
    mode: 'continuous',
    lastTriggered: null,
  },
  feeder: {
    state: 'idle', // 'idle' | 'running'
    dose: 0, // grams
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
    actAerator: true,
    actFeeder: false,
    actMolasses: false,
    actWater: false,
  },

  // Rolling Telemetry History (for trend curves & sparklines)
  telemetryHistory: [
    { time: '10:00', do: 6.2, ph: 7.15, temp: 28.2, ammonia: 0.25, mud: 90 },
    { time: '10:01', do: 6.3, ph: 7.18, temp: 28.3, ammonia: 0.24, mud: 92 },
    { time: '10:02', do: 6.35, ph: 7.20, temp: 28.4, ammonia: 0.23, mud: 94 },
    { time: '10:03', do: 6.40, ph: 7.20, temp: 28.5, ammonia: 0.22, mud: 95 },
  ],

  // OLED Screen Log Buffer (Virtual Screen)
  oledLines: [
    'ESP32 POND v1.2',
    'WiFi: CONNECTED',
    'MQTT: READY',
    'AERATOR: ACTIVE 100%',
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

    // Listen to incoming commands from MQTT or Browser Sync
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

    // Natural pond parameter drift & biological simulation
    this.driftTimer = setInterval(() => {
      if (pondState.autoDrift) {
        this.applyNaturalDrift()
      }
    }, 3000)

    this.updateOled('MQTT CONNECTED', 'SYSTEM RUNNING')
  }

  stop() {
    if (this.telemetryTimer) clearInterval(this.telemetryTimer)
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    if (this.uptimeTimer) clearInterval(this.uptimeTimer)
    if (this.driftTimer) clearInterval(this.driftTimer)
  }

  setDeviceProfile(profileId) {
    const prof = DEVICE_PROFILES.find(p => p.id === profileId)
    if (!prof) return
    pondState.deviceId = prof.id
    mqttService.setConfig({ deviceId: prof.id })
    this.updateOled(`NODE: ${prof.pondId}`, prof.name.substring(0, 16))
    this.publishEvent('NODE_PROFILE_CHANGED', {
      deviceId: prof.id,
      pondId: prof.pondId,
      name: prof.name
    })
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
    }, 350)

    const now = new Date()
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // Append to rolling history
    pondState.telemetryHistory.push({
      time: timeLabel,
      do: pondState.dissolvedOxygen,
      ph: pondState.ph,
      temp: pondState.temperature,
      ammonia: pondState.ammonia,
      mud: pondState.mudSolids
    })
    if (pondState.telemetryHistory.length > 25) {
      pondState.telemetryHistory.shift()
    }

    const matchedProfile = DEVICE_PROFILES.find(p => p.id === pondState.deviceId)

    // Standard telemetry packet format
    const telemetryPayload = {
      device_id: pondState.deviceId,
      pond_id: matchedProfile ? matchedProfile.pondId : 'K01',
      timestamp: now.toISOString(),
      uptime_seconds: pondState.uptimeSeconds,
      system: {
        battery_v: pondState.batteryVoltage,
        wifi_rssi_dbm: pondState.wifiRssi,
        free_heap_bytes: pondState.freeHeap,
      },
      sensors: {
        ph: pondState.ph,
        temperature_c: pondState.temperature,
        dissolved_oxygen_mg_l: pondState.dissolvedOxygen,
        ammonia_mg_l: pondState.ammonia,
        mud_solids_mg_l: pondState.mudSolids,
      },
      actuators: {
        aerator: {
          state: pondState.aerator.state,
          power_percent: pondState.aerator.powerPercent
        },
        feeder: {
          state: pondState.feeder.state,
          total_today_grams: pondState.feeder.totalToday
        },
        molasses_pump: {
          state: pondState.molassesPump.state,
          total_today_ml: pondState.molassesPump.totalToday
        },
        water_change: {
          state: pondState.waterChange.state,
          total_today_liters: pondState.waterChange.totalToday
        }
      }
    }

    mqttService.publish(mqttService.config.telemetryTopic, telemetryPayload)

    // Update OLED Display buffer
    this.updateOled(
      `DO:${pondState.dissolvedOxygen.toFixed(2)} pH:${pondState.ph.toFixed(2)}`,
      `NH3:${pondState.ammonia.toFixed(2)} T:${pondState.temperature.toFixed(1)}C`,
      `TX OK [${timeLabel}]`
    )
  }

  publishEvent(eventType, eventData) {
    const payload = {
      device_id: pondState.deviceId,
      event: eventType,
      timestamp: new Date().toISOString(),
      data: eventData
    }
    mqttService.publish(mqttService.config.eventTopic, payload)
  }

  applyNaturalDrift() {
    // Biological DO Dynamics based on Aeration state:
    let dDo = 0
    if (pondState.aerator.state === 'running') {
      const aeratorFactor = (pondState.aerator.powerPercent || 100) / 100
      if (pondState.dissolvedOxygen < 7.2) {
        // Active aeration drives oxygen up towards saturation
        dDo = (0.04 + Math.random() * 0.05) * aeratorFactor
      } else {
        dDo = (Math.random() - 0.5) * 0.02
      }
    } else {
      // Hypoxia drift: microbial & fish respiration consumes oxygen without replenishment
      dDo = -(0.03 + Math.random() * 0.04)
    }

    const dPh = (Math.random() - 0.5) * 0.02
    const dTemp = (Math.random() - 0.5) * 0.04
    // Natural biological digestion adds slight baseline ammonia
    const dAmmonia = (Math.random() - 0.47) * 0.008
    const dMud = (Math.random() - 0.5) * 0.4

    pondState.ph = Math.min(9.0, Math.max(6.0, +(pondState.ph + dPh).toFixed(2)))
    pondState.temperature = Math.min(34.0, Math.max(22.0, +(pondState.temperature + dTemp).toFixed(1)))
    pondState.ammonia = Math.min(3.0, Math.max(0.01, +(pondState.ammonia + dAmmonia).toFixed(3)))
    pondState.mudSolids = Math.min(500.0, Math.max(20.0, +(pondState.mudSolids + dMud).toFixed(1)))
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
      case 'aerator':
      case 'set_aerator':
      case 'paddlewheel':
      case 'blower':
        this.executeAerator(
          params.state !== false && params.state !== 'off' && params.state !== 'idle',
          params.powerPercent || params.power || 100,
          payload.command_id
        )
        break

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
          message: 'Command action unrecognized by ESP32 firmware',
        })
        break
    }
  }

  executeAerator(enable = true, powerPercent = 100, commandId = null) {
    pondState.aerator.state = enable ? 'running' : 'idle'
    pondState.aerator.powerPercent = enable ? Math.min(100, Math.max(25, Number(powerPercent) || 100)) : 0
    pondState.aerator.lastTriggered = new Date().toLocaleTimeString()
    pondState.leds.actAerator = enable

    this.publishEvent(enable ? 'AERATOR_STARTED' : 'AERATOR_STOPPED', {
      command_id: commandId,
      state: pondState.aerator.state,
      powerPercent: pondState.aerator.powerPercent,
      timestamp: Date.now()
    })

    this.updateOled(
      enable ? `AERATOR ${pondState.aerator.powerPercent}%` : 'AERATOR OFF',
      `DO: ${pondState.dissolvedOxygen.toFixed(2)} mg/L`
    )
  }

  executeFeed(dose, unit = 'g', commandId = null) {
    if (pondState.feeder.state === 'running') {
      this.publishEvent('FEEDER_BUSY', { message: 'Feeder is busy dispensing, command ignored' })
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

    this.updateOled(`FEEDING: ${dose}${unit}`, 'DISPENSING...')

    const durationSec = Math.min(15, Math.max(3, Math.round(dose / 20)))
    const stepInterval = (durationSec * 1000) / 100

    let currentProgress = 0
    const feedInterval = setInterval(() => {
      currentProgress += 2
      pondState.feeder.progress = Math.min(100, currentProgress)

      if (currentProgress >= 100) {
        clearInterval(feedInterval)
        pondState.feeder.state = 'idle'
        pondState.feeder.progress = 100
        pondState.feeder.totalToday += Number(dose)
        pondState.leds.actFeeder = false

        // Biological side effect: Fish feeding increases ammonia slightly after some time
        setTimeout(() => {
          pondState.ammonia = +(pondState.ammonia + 0.05).toFixed(3)
        }, 4000)

        this.publishEvent('FEED_COMPLETED', {
          command_id: commandId,
          dose_delivered: dose,
          unit,
          total_today: pondState.feeder.totalToday
        })

        this.updateOled(`FEED DONE: ${dose}${unit}`, 'MOTOR IDLE')
      }
    }, stepInterval)
  }

  executeMolasses(dose, unit = 'ml', commandId = null) {
    if (pondState.molassesPump.state === 'running') {
      this.publishEvent('MOLASSES_BUSY', { message: 'Molasses pump busy dispensing' })
      return
    }

    pondState.molassesPump.state = 'running'
    pondState.molassesPump.dose = dose
    pondState.molassesPump.progress = 0
    pondState.molassesPump.lastTriggered = new Date().toLocaleTimeString()
    pondState.leds.actMolasses = true

    this.publishEvent('MOLASSES_STARTED', {
      command_id: commandId,
      dose,
      unit,
      timestamp: Date.now()
    })

    this.updateOled(`MOLASSES: ${dose}${unit}`, 'PUMPING DOSAGE...')

    const durationSec = Math.min(20, Math.max(4, Math.round(dose / 20)))
    const stepInterval = (durationSec * 1000) / 100

    let currentProgress = 0
    const pumpInterval = setInterval(() => {
      currentProgress += 2
      pondState.molassesPump.progress = Math.min(100, currentProgress)

      // Gradual biological improvement: Molasses feeds probiotic bacteria which consumes ammonia
      if (currentProgress % 20 === 0 && pondState.ammonia > 0.05) {
        pondState.ammonia = +(Math.max(0.02, pondState.ammonia - 0.02)).toFixed(3)
      }

      if (currentProgress >= 100) {
        clearInterval(pumpInterval)
        pondState.molassesPump.state = 'idle'
        pondState.molassesPump.progress = 100
        pondState.molassesPump.totalToday += Number(dose)
        pondState.leds.actMolasses = false

        this.publishEvent('MOLASSES_COMPLETED', {
          command_id: commandId,
          dose_delivered: dose,
          unit,
          total_today: pondState.molassesPump.totalToday
        })

        this.updateOled(`MOLASSE DONE: ${dose}${unit}`, 'PROBIOTIC BOOSTED')
      }
    }, stepInterval)
  }

  executeWaterChange(volume, unit = 'liter', commandId = null) {
    if (pondState.waterChange.state !== 'idle') {
      this.publishEvent('WATER_CHANGE_BUSY', { message: 'Water change cycle is currently in progress' })
      return
    }

    pondState.waterChange.state = 'draining'
    pondState.waterChange.volume = volume
    pondState.waterChange.progress = 0
    pondState.waterChange.phase = 'Drain Sludge'
    pondState.waterChange.lastTriggered = new Date().toLocaleTimeString()
    pondState.leds.actWater = true

    this.publishEvent('WATER_CHANGE_STARTED', {
      command_id: commandId,
      volume,
      unit,
      timestamp: Date.now()
    })

    this.updateOled(`WATER CHG: ${volume}L`, 'PHASE 1: DRAIN')

    const totalDurationSec = Math.min(30, Math.max(8, Math.round(volume / 25)))
    const stepInterval = (totalDurationSec * 1000) / 100

    let currentProgress = 0
    const wcInterval = setInterval(() => {
      currentProgress += 2
      pondState.waterChange.progress = Math.min(100, currentProgress)

      if (currentProgress === 50) {
        pondState.waterChange.state = 'refilling'
        pondState.waterChange.phase = 'Fresh Refill'
        this.updateOled(`WATER CHG: ${volume}L`, 'PHASE 2: REFILL')
      }

      if (currentProgress <= 50) {
        // While draining, mud is being drawn out
        pondState.mudSolids = +(Math.max(30.0, pondState.mudSolids - 1.5)).toFixed(1)
      } else {
        // While refilling fresh aerated water: DO goes up, ammonia diluted, pH normalized
        pondState.dissolvedOxygen = +(Math.min(7.5, pondState.dissolvedOxygen + 0.05)).toFixed(2)
        pondState.ammonia = +(Math.max(0.05, pondState.ammonia - 0.03)).toFixed(3)
        pondState.ph = +(7.2 + (pondState.ph - 7.2) * 0.95).toFixed(2)
      }

      if (currentProgress >= 100) {
        clearInterval(wcInterval)
        pondState.waterChange.state = 'idle'
        pondState.waterChange.phase = 'Complete'
        pondState.waterChange.progress = 100
        pondState.waterChange.totalToday += Number(volume)
        pondState.leds.actWater = false

        this.publishEvent('WATER_CHANGE_COMPLETED', {
          command_id: commandId,
          volume_exchanged: volume,
          unit,
          total_today: pondState.waterChange.totalToday
        })

        this.updateOled(`CYCLE FINISHED`, `EXCH: ${volume}L OK`)
      }
    }, stepInterval)
  }

  updateOled(line1, line2, line3 = null) {
    const lines = [
      `DEV: ${pondState.deviceId}`,
      line1,
      line2,
      line3 || `UP: ${pondState.uptimeSeconds}s`
    ]
    pondState.oledLines = lines
  }

  // Pre-configured Scenarios for easy testing
  setScenario(scenarioName) {
    switch (scenarioName) {
      case 'normal':
        pondState.ph = 7.35
        pondState.temperature = 28.2
        pondState.ammonia = 0.12
        pondState.mudSolids = 80.0
        pondState.dissolvedOxygen = 6.5
        pondState.aerator.state = 'running'
        pondState.aerator.powerPercent = 100
        pondState.leds.actAerator = true
        break
      case 'ammonia_spike':
        pondState.ph = 7.9
        pondState.temperature = 30.5
        pondState.ammonia = 1.45 // CRITICAL
        pondState.mudSolids = 180.0
        pondState.dissolvedOxygen = 4.2
        break
      case 'low_oxygen':
        pondState.ph = 6.8
        pondState.temperature = 26.5
        pondState.ammonia = 0.45
        pondState.mudSolids = 120.0
        pondState.dissolvedOxygen = 2.4 // CRITICAL
        pondState.aerator.state = 'idle'
        pondState.aerator.powerPercent = 0
        pondState.leds.actAerator = false
        break
      case 'heavy_mud':
        pondState.ph = 7.1
        pondState.temperature = 28.0
        pondState.ammonia = 0.85
        pondState.mudSolids = 350.0 // Heavy turbidity / sludge accumulation
        pondState.dissolvedOxygen = 3.8
        break
    }
    this.publishTelemetry()
  }
}

export const simulationEngine = new SimulationEngine()
