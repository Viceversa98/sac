# SAC Backend Service

Layanan Backend API & Integrasi IoT MQTT untuk Sampay Aquaculture Co-Pilot (SAC).

## Rencana Arsitektur & Fitur
- **Telemetry Ingestion**: Menangkap data sensor real-time dari ESP32 / Simulator via MQTT broker.
- **Actuator Controller**: Mengirimkan perintah aktuator (aerator, feeder, pompa) ke node kolam.
- **AI Copilot & Biofloc Engine**: Evaluasi parameter kualitas air, penghitungan dosis molase/C:N ratio, dan deteksi anomali.
- **Database & Audit Logs**: Riwayat telemetri, log tindakan, dan riwayat siklus budidaya kolam.

## Quick Start
```bash
npm install
npm run dev
```
