# Sampay Aquaculture Co-Pilot (web)

Vue 3 + Vite dashboard and co-pilot. This folder is the frontend. The API is a separate service.

## Setup

```bash
cd web
npm install
npm run dev
```

`npm run dev` proxies `/api` to `http://localhost:8080`.

```bash
npm run build
```

Telemetry and co-pilot screens show a permanent Simulated label. Approve records an audit row (`executed_simulated`) and does not send a hardware command.
