# SAC Simulator (ESP32 IoT Pond Telemetry & Actuator Simulator)

A high-fidelity hardware simulator representing an ESP32 microcontroller deployed in an aquaculture pond. Built with Vue 3, Vite, and MQTT.js.

## Key Features
- **Virtual ESP32 Microcontroller Board**: Emulates hardware metrics including WiFi RSSI signal strength, battery voltage, uptime counter, free heap memory, and status LEDs.
- **Biophysical Pond Drift Engine**: Simulates realistic fluctuations of pH, water temperature, dissolved oxygen (DO), total suspended solids / sludge turbidity, and un-ionized ammonia.
- **Dual MQTT Modes**:
  - *Internal Virtual Broker (Dummy Mode)*: Self-contained simulation for immediate testing without external dependencies.
  - *Real WebSocket MQTT Broker*: Connects to local or cloud MQTT brokers (e.g. EMQX, HiveMQ, Mosquitto over WebSockets).
- **Actuator Hardware Emulation**:
  - Automatic Feeder: Simulates dosing duration, daily cumulative feed counter, and subsequent ammonia load.
  - Molasses Dosing Pump: Simulates biofloc carbon addition and probiotic ammonia assimilation.
  - Water Exchange Pump: Simulates two-phase bottom draining and fresh aerated water replenishment.
- **Crisis Scenarios**: One-click triggers for Ammonia Spikes, Hypoxia (Low DO Crashes), and Sludge Turbidity buildup.
- **Live MQTT Traffic Console**: Real-time inspection of published telemetry packets, incoming actuator commands, and system events.

## Tech Stack
- Vue 3 (Composition API)
- Vite
- MQTT.js (MQTT over WebSockets)
- Bootstrap 5 & Bootstrap Icons

## Setup & Development

```bash
# Install dependencies
npm install

# Start development server (Port 5175)
npm run dev

# Build for production
npm run build
```
