# Sampay Aquaculture Co-Pilot (SAC) Platform

Platform AI & IoT cerdas untuk pengelolaan akuakultur dan sistem bioflok modern.

Repository ini menggunakan struktur **Monorepo** yang menyatukan seluruh komponen sistem: Frontend, Simulator IoT, Backend, dan Dokumentasi.

---

## 📁 Struktur Direktori

```text
SAC/
├── frontend/     # Web Dashboard & AI Copilot (Vue 3 + Vite)
├── simulator/    # ESP32 IoT Pond Telemetry & Actuator Simulator
├── backend/      # Backend API & IoT MQTT Message Broker Service
├── plan/         # Dokumen perencanaan, skema arsitektur & panduan sistem
├── package.json  # Root package orchestrator
└── README.md     # Panduan monorepo ini
```

---

## 🚀 Quick Start (Memulai Pengembangan)

### 1. Prasyarat
- Node.js (versi 18+ disarankan)
- npm

### 2. Menjalankan Komponen

Dari root direktori project:

```bash
# Menjalankan Web Frontend Dashboard (Port: 5173)
npm run dev:frontend

# Menjalankan ESP32 IoT Pond Simulator (Port: 5175)
npm run dev:simulator

# Menjalankan Backend Service
npm run dev:backend
```

Atau masuk ke direktori masing-masing:
```bash
# Masuk ke Frontend
cd frontend
npm install
npm run dev

# Masuk ke Simulator
cd simulator
npm install
npm run dev

# Masuk ke Backend
cd backend
npm install
npm run dev
```

---

## 🛠️ Komponen Sistem

### 1. `frontend/` (SAC Web Dashboard & Copilot)
- **Tech Stack:** Vue 3, Vite, Lucide Vue, Bootstrap Icons.
- **Fitur:**
  - Realtime water telemetry monitoring (Suhu, pH, DO, TDS, Turbidity).
  - Kalkulator Biofloc & C:N ratio analysis.
  - Asisten AI Copilot untuk rekomendasi operasional tambak.
  - Manajemen siklus kolam (tebar benih, sampling, panen).
  - Kontrol matriks aktuator (aerator, feeder, pompa).

### 2. `simulator/` (ESP32 IoT Pond Simulator)
- **Tech Stack:** Vue 3, Vite, MQTT.js, Bootstrap 5.
- **Fitur:**
  - Simulasi sensor kolam dengan model fluktuasi alami (suhu, DO, pH, amonia).
  - Virtual Broker MQTT internal (dummy mode) & Real WebSocket MQTT broker.
  - Simulasi aktuator (aerator, feeder, kalkulasi pakan).
  - Log transmisi telemetri dan testing skenario krisis (DO drop, amonia spike).

### 3. `backend/` (Backend Service & API)
- Menangani komunikasi MQTT broker, rest API, penyimpanan riwayat data telemetri, dan integrasi model LLM AI Copilot.

### 4. `plan/` (Dokumentasi Arsitektur)
- Berisi file spesifikasi desain, roadmap fitur, dan alur integrasi sistem (`plan.pdf`).

---

## 🔒 Environment & Keamanan
- Pastikan file kredensial/rahasia (seperti `.env`, API key, token database/broker) selalu berada di dalam file `.env` yang sudah diabaikan oleh `.gitignore`.
- Jangan pernah meng-commit file `.env` ke repository.
