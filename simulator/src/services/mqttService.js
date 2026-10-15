import mqtt from 'mqtt'

class MqttService {
  constructor() {
    this.client = null
    this.mode = 'dummy' // 'dummy' | 'real'
    this.isConnected = false
    this.listeners = new Map()
    this.messageLog = []
    this.config = {
      brokerUrl: 'ws://localhost:9001',
      clientId: 'esp32_aqua_' + Math.random().toString(16).substring(2, 8),
      deviceId: 'ESP32-AQUA-01',
      username: '',
      password: '',
      telemetryTopic: 'esp32/ESP32-AQUA-01/telemetry',
      commandTopic: 'esp32/ESP32-AQUA-01/commands',
      eventTopic: 'esp32/ESP32-AQUA-01/events',
    }
  }

  setMode(mode) {
    if (this.mode === mode) return
    this.disconnect()
    this.mode = mode
    this.connect()
  }

  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    // Update topics if deviceId changed
    this.config.telemetryTopic = `esp32/${this.config.deviceId}/telemetry`
    this.config.commandTopic = `esp32/${this.config.deviceId}/commands`
    this.config.eventTopic = `esp32/${this.config.deviceId}/events`
  }

  connect() {
    if (this.mode === 'dummy') {
      // Simulate connection immediately in dummy mode
      setTimeout(() => {
        this.isConnected = true
        this.emit('connect', { mode: 'dummy' })
        this.logTraffic('SYSTEM', 'DUMMY_BROKER', 'Connected to Virtual Internal Broker (Dummy Mode)')
      }, 300)
      return
    }

    // Real MQTT over WebSocket
    try {
      this.logTraffic('SYSTEM', this.config.brokerUrl, `Connecting to ${this.config.brokerUrl}...`)
      const options = {
        clientId: this.config.clientId,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 5000,
      }
      if (this.config.username) options.username = this.config.username
      if (this.config.password) options.password = this.config.password

      this.client = mqtt.connect(this.config.brokerUrl, options)

      this.client.on('connect', () => {
        this.isConnected = true
        this.emit('connect', { mode: 'real' })
        this.logTraffic('SYSTEM', 'MQTT', `Successfully connected to broker ${this.config.brokerUrl}`)
        // Auto-subscribe to commands topic
        this.subscribe(this.config.commandTopic)
      })

      this.client.on('message', (topic, payload) => {
        const messageStr = payload.toString()
        let parsed = null
        try {
          parsed = JSON.parse(messageStr)
        } catch {
          parsed = messageStr
        }
        this.logTraffic('INCOMING', topic, parsed)
        this.emit('message', { topic, payload: parsed, raw: messageStr })
      })

      this.client.on('error', (err) => {
        this.logTraffic('ERROR', 'MQTT', err.message || 'Connection error')
        this.emit('error', err)
      })

      this.client.on('offline', () => {
        this.isConnected = false
        this.logTraffic('SYSTEM', 'MQTT', 'Broker connection lost (Offline)')
        this.emit('offline')
      })
    } catch (err) {
      this.logTraffic('ERROR', 'MQTT', 'Failed to initialize MQTT: ' + err.message)
    }
  }

  disconnect() {
    if (this.mode === 'dummy') {
      this.isConnected = false
      this.emit('offline')
      this.logTraffic('SYSTEM', 'DUMMY_BROKER', 'Virtual Internal Broker stopped')
      return
    }

    if (this.client) {
      this.client.end(true)
      this.client = null
    }
    this.isConnected = false
    this.emit('offline')
  }

  subscribe(topic) {
    if (this.mode === 'dummy') {
      this.logTraffic('SYSTEM', 'SUBSCRIBE', `Subscribed to dummy topic: ${topic}`)
      return
    }

    if (this.client && this.isConnected) {
      this.client.subscribe(topic, (err) => {
        if (!err) {
          this.logTraffic('SYSTEM', 'SUBSCRIBE', `Subscribed to topic: ${topic}`)
        } else {
          this.logTraffic('ERROR', 'SUBSCRIBE', `Failed to subscribe to ${topic}: ${err.message}`)
        }
      })
    }
  }

  publish(topic, payload) {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
    this.logTraffic('OUTGOING', topic, payload)

    if (this.mode === 'dummy') {
      // In dummy mode, notify internal listeners
      this.emit('published', { topic, payload })
      return true
    }

    if (this.client && this.isConnected) {
      this.client.publish(topic, payloadStr, { qos: 0 })
      return true
    } else {
      this.logTraffic('WARN', topic, 'Publish failed: MQTT client is disconnected.')
      return false
    }
  }

  // Helper to simulate incoming backend command (useful for testing in dummy mode)
  simulateIncomingCommand(commandPayload) {
    const topic = this.config.commandTopic
    this.logTraffic('INCOMING (MOCK BACKEND)', topic, commandPayload)
    this.emit('message', {
      topic,
      payload: commandPayload,
      raw: JSON.stringify(commandPayload)
    })
  }

  logTraffic(type, source, data) {
    const entry = {
      id: Date.now() + Math.random().toString(16).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
      type, // 'SYSTEM' | 'INCOMING' | 'OUTGOING' | 'ERROR' | 'WARN'
      source,
      data
    }
    this.messageLog.unshift(entry)
    if (this.messageLog.length > 100) {
      this.messageLog.pop()
    }
    this.emit('log', entry)
  }

  clearLogs() {
    this.messageLog = []
    this.emit('log_clear')
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(handler)
  }

  off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler)
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)) {
        try {
          handler(data)
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e)
        }
      }
    }
  }
}

export const mqttService = new MqttService()
