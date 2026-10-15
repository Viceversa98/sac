# Sampay API

Node.js 22 service for the Sampay aquaculture demo. It stores telemetry in MySQL, asks Gemini to write briefings, and appends every decision to Firestore. Dose maths and the hard refusals run in this process. Nothing here turns a pump, feeder, or aerator on.

## How we use Google Cloud

The API is built for Cloud Run in `asia-southeast2`. Gemini is called only through Agent Platform (`@google/genai` with `enterprise: true`, location `global`, Application Default Credentials on the `sampay-run` service account). There is no AI Studio key and no `GEMINI_API_KEY`. Firestore collection `audit_events` is the approval log the UI reads; `firestore.rules` deny all client access, and the server writes with `roles/datastore.user`. Cloud SQL for MySQL holds telemetry, ponds, SOP chunks, and the `approvals` row with one decision per proposal. Firebase Hosting, the Firebase client SDK, and Firebase Auth are not used.

`global` Gemini calls may be processed in any Google Cloud location. Cloud Run, Cloud SQL, and Firestore stay in Asia. The demo data is simulated.

A Firestore write is attempted after MySQL commits. If it fails, it is retried once and the response says `audit_sync: "pending"`. The MySQL decision is not rolled back.

## Local run

```bash
cd api
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm test
npm run dev
```

`GET /healthz` returns `ok`. With `DEMO_MODE=1`, `POST /api/telemetry/replay` loads `pond_A_do_drop.csv` and `pond_B_tan_rise.csv` (WIB timestamps stored as UTC, skipped when that pond already has the same timestamp). `GET /api/diag` calls Gemini with `reply OK` and writes one Firestore document. If Application Default Credentials or `GOOGLE_CLOUD_PROJECT` are missing, that route returns a 503 and the process keeps running.

`DB_PASSWORD` in `.env.example` is only for the local Docker MySQL. On Cloud Run the real password comes from Secret Manager. Do not commit `.env`.

## Routes

| Method | Path | Notes |
|---|---|---|
| GET | `/healthz` | `ok` |
| POST | `/api/telemetry` | one reading or an array |
| POST | `/api/telemetry/replay` | `DEMO_MODE=1` |
| GET | `/api/ponds` | ponds plus 24 h stats |
| GET | `/api/ponds/:id/telemetry?hours=24` | window ends at the newest sample |
| POST | `/api/sop/ingest` | keyword chunks, no embeddings |
| POST | `/api/briefings` | Prompt A; proposals computed in Node |
| POST | `/api/chat` | Prompts B, C, and D |
| GET | `/api/tool-calls` | MySQL state |
| GET | `/api/audit-events` | Firestore log the UI renders |
| POST | `/api/tool-calls/:id/approve` | actor is users.id 1; sets `executed_simulated` |
| POST | `/api/tool-calls/:id/reject` | 409 unless status is `proposed` |
| POST | `/api/demo/reset` | clears decisions, replays both CSVs |
| GET | `/api/diag` | Gemini plus one Firestore doc |

Approve, reject, briefings, and chat are limited to about 10 requests per minute per IP. There is no login. Blocked requests are still stored with `status: "blocked"`.

## What is simulated

Telemetry is the replayed CSV. Approve writes an audit row only. SOP files are synthetic summaries of the cited papers. Un-ionised NH3 comes from the CSV. The morning briefing in Bahasa Indonesia includes `english_caption` for the line under it.

## Tests

`npm test` covers the safety rules, the molasses rounding, and the 24 h stats (pond A dissolved oxygen minimum 2.4 mg/L at 2026-10-15 04:00 WIB). Those tests do not need MySQL or Google Cloud.
