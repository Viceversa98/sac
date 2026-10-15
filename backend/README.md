# SAC Backend Service

Backend API and IoT MQTT message broker integration service for Sampay Aquaculture Co-Pilot (SAC).

## Architecture & Roadmap
- **Telemetry Ingestion**: Ingests high-frequency sensor readings from ESP32 edge nodes and the pond simulator via MQTT broker.
- **Actuator Controller**: Dispatches verified control commands (aerators, feeders, water pumps) to edge controllers.
- **AI Copilot & Biofloc Engine**: Evaluates water quality time-series, calculates C:N ratio requirements, predicts anomalies, and generates LLM-powered recommendations.
- **Database & Audit Logs**: Stores historical telemetry records, operation audit trails, and pond lifecycle data.

## Setup & Development
```bash
# Install dependencies
npm install

# Run service
npm run dev
```
