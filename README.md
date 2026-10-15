# Sampay Aquaculture Co-Pilot (SAC) Platform

An intelligent AI & IoT platform for smart aquaculture management and modern biofloc systems.

This repository uses a **Monorepo** structure that unifies all system components: Frontend, IoT Simulator, Backend, and Documentation.

---

## 📁 Directory Structure

```text
SAC/
├── frontend/     # Web Dashboard & AI Copilot (Vue 3 + Vite)
├── simulator/    # ESP32 IoT Pond Telemetry & Actuator Simulator (Vue 3 + Vite)
├── backend/      # Backend API & IoT MQTT Message Broker Service
├── plan/         # Architecture planning documents, diagrams & guidelines
├── package.json  # Root package orchestrator
└── README.md     # Monorepo documentation
```

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js (version 18+ recommended)
- npm

### 2. Running Components

From the root directory:

```bash
# Run Web Frontend Dashboard (Port: 5173)
npm run dev:frontend

# Run ESP32 IoT Pond Simulator (Port: 5175)
npm run dev:simulator

# Run Backend Service
npm run dev:backend
```

Or navigate to each respective directory:
```bash
# Run Frontend
cd frontend
npm install
npm run dev

# Run Simulator
cd simulator
npm install
npm run dev

# Run Backend
cd backend
npm install
npm run dev
```

---

## 🛠️ System Components

### 1. `frontend/` (SAC Web Dashboard & Copilot)
- **Tech Stack:** Vue 3, Vite, Lucide Vue, Bootstrap Icons.
- **Key Features:**
  - Real-time water telemetry monitoring (Temperature, pH, DO, TDS, Turbidity).
  - Biofloc Science & C:N ratio calculator.
  - AI Aquaculture Copilot for actionable pond intervention suggestions.
  - Pond lifecycle management (stocking, sampling, harvesting).
  - Actuator matrix control (aerator, feeder, water pump).

### 2. `simulator/` (ESP32 IoT Pond Simulator)
- **Tech Stack:** Vue 3, Vite, MQTT.js, Bootstrap 5.
- **Key Features:**
  - Realistic pond sensor telemetry simulation with natural biological drift models.
  - Dual MQTT modes: Internal Virtual Broker (dummy mode) & Real WebSocket MQTT broker.
  - Interactive actuator simulations (automated feeder, molasses dosing, water change).
  - Live telemetry traffic log viewer and crisis scenario testing (DO drop, ammonia spike, heavy sludge).

### 3. `backend/` (Backend Service & API)
- Handles MQTT message ingestion, REST APIs, telemetry time-series storage, and AI Copilot LLM integrations.

### 4. `plan/` (Architecture & Specifications)
- Contains design specifications, roadmap features, and system integration workflows (`plan.pdf`).

---

## 🔒 Environment & Security
- Ensure confidential files (such as `.env`, API keys, database or MQTT credentials) are kept inside `.env` files that are ignored by `.gitignore`.
- Never commit `.env` files into the repository.
