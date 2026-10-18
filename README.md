# Sampay

A supervisor stays in charge. The app watches two simulated tilapia ponds, calculates a molasses dose in code, and asks for approval before anything is recorded. Approving writes a row. It does not turn on a pump, feeder, or aerator.

Theme / problem statement: Future of Work & Enterprise Productivity — one pond supervisor must watch many ponds overnight; Sampay does the monitoring, dose maths and paperwork, and the supervisor approves every recorded action.
Team: Ilfa Hidayat and Alif Asraf.

## Live

- Site: https://frontend-sac-811818892931.asia-southeast1.run.app/
- API: https://sac-git-811818892931.asia-southeast1.run.app
- Health: https://sac-git-811818892931.asia-southeast1.run.app/api/health
- Ponds: https://sac-git-811818892931.asia-southeast1.run.app/api/ponds
- Approval log: https://sac-git-811818892931.asia-southeast1.run.app/api/audit-events

- Demo video (2:50): https://youtu.be/5leqvlQJqAU — Sampay Aquaculture Co-Pilot — AI Builder Cup 2026

## How we use Google Cloud

Cloud Run hosts the Vue site (`frontend-sac`) and the Node API (`sac-git`) in `asia-southeast1`. Gemini is called only through Agent Platform (`@google/genai`, `enterprise: true`, location `global`) with the Cloud Run service account. There is no API key. Firestore database `sampay-firestore`, collection `audit_events`, is the approval log. `firestore.rules` deny every browser read and write. Cloud SQL for MySQL (`sampay-prod-db`, database `sampay`) holds ponds, telemetry, SOP chunks, and the one decision on each proposal. Firebase Hosting, the Firebase client SDK, and Firebase Auth are not used.

`global` Gemini calls may be processed in any Google Cloud location. Cloud Run, Cloud SQL, and Firestore stay in `asia-southeast1`. The pond data is simulated.

## Run locally

```bash
cd api
npm install
npm test
npm run dev
```

```bash
cd web
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8080`.

## What is simulated

Pond A and Pond B are simulated. Telemetry can be replayed from CSV. A molasses dose uses `(20 × TAN mg/L) / 0.44` grams per cubic metre, and anything above `0.12 g/L` is refused in code. Approve records `executed_simulated`.
