# Cursor prompts: Sampay Aquaculture Co-Pilot (paste in order)

Copy this whole `build-kit/` folder into your new repo as `/kit` first. Keep `@kit/SPEC.md`, `@kit/sop-thresholds.md` and `@kit/samples` in Cursor context. Numbers come ONLY from `kit/sop-thresholds.md` (derived from `source-validation.md`).
> **Comment rule (already inside every prompt):** "Add short comments explaining WHY each library, pattern or step exists (not just what it does)."
> **Number rule:** "Do not invent any science or market number; use only kit/sop-thresholds.md and kit/SPEC.md."

Stop at the end of each prompt and run its "Done when" checklist before moving on. Official last date: **18 Oct 2026, "we will not be able to extend this"** (Ask-the-Expert session 52:46; hour and time zone NOT stated). Internal target: **end of Sat 17 Oct MYT** (buffer). Team formation **closed 14 Oct** (official site; session said 16 Oct). Official video rule: **strictly under 3:00**.
> **Agent Platform rule:** Gemini is called ONLY through Gemini Enterprise Agent Platform (formerly Vertex AI) with `@google/genai` `{enterprise:true, project, location:'global'}` and the Cloud Run service account (ADC). No Gemini API key anywhere. See @kit/SPEC.md §6 and §11.

---
## Day 1 — Wed 14 Oct night + Thu morning: skeleton, deploy, data

**W1. Skeleton.** "Read @kit/SPEC.md. Create a repo with `/api` (Node.js 22, Express, ESM, Vitest) and `/web` (Next.js App Router, TypeScript — or Vite React if faster). Add `GET /healthz` → `ok`, `.env.example` (GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION=global, GOOGLE_GENAI_USE_ENTERPRISE=true, FIRESTORE_COLLECTION=audit_events, GEMINI_MODEL=gemini-3.8-flash, GEMINI_MODEL_LITE=gemini-3.1-flash-lite, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DEMO_MODE=1), and docker-compose with MySQL 8 for local dev. Add short comments explaining WHY each library, pattern or step exists."
Done when:
- [ ] `docker compose up -d` starts MySQL; `npm run dev` in /api and /web both run
- [ ] `curl localhost:8080/healthz` → `ok`
- [ ] `.env` is git-ignored; `.env.example` has NO real values and NO `GEMINI_API_KEY`

**W2. Cloud Run hello.** "Add Dockerfiles for api and web and a `deploy.sh` using `gcloud run deploy` (region asia-southeast2, `--allow-unauthenticated`, `--service-account=sampay-run@$PROJECT.iam.gserviceaccount.com`, `--timeout` sized for the slowest briefing, secret DB_PASSWORD from Secret Manager via `--set-secrets`; read PROJECT/REGION from the shell env, never hard-code values). In `infra.md` list: enable run, sqladmin, aiplatform, firestore, secretmanager APIs; create the service account and grant roles/aiplatform.user, roles/datastore.user, roles/cloudsql.client, roles/secretmanager.secretAccessor. Create the Cloud SQL MySQL db-f1-micro instance commands in `infra.md` and connect via the Cloud SQL unix socket (`--add-cloudsql-instances`). Add short comments explaining WHY (e.g. why Secret Manager, why the socket instead of a public IP)."
Done when:
- [ ] Both Cloud Run URLs return 200; `/healthz` → `ok` on the deployed API
- [ ] API can `SELECT 1` against Cloud SQL (log it at boot)
- [ ] `rg -n "AIza|GEMINI_API_KEY|password=" .` finds nothing committed

**W2b. Agent Platform Gemini + Firestore smoke.** "Create `api/src/gemini.js` exporting one `GoogleGenAI` client exactly as @kit/SPEC.md §6 (enterprise:true, project/location from env, location default 'global', no apiKey). Create `api/src/audit.js` with `new Firestore()` (ADC) and `logAuditEvent(evt)` that `add()`s to `audit_events` with `FieldValue.serverTimestamp()`, schema per @kit/SPEC.md §3b. Add `firestore.rules` denying all client reads/writes. Add `GET /api/diag` (DEMO_MODE only) that calls Gemini with 'reply OK' and writes+reads one `diag` audit event, returning model name and latency ms. Add short comments explaining WHY Agent Platform instead of an API key, WHY location global, WHY Firestore is server-write-only."
Done when:
- [ ] Locally (after `gcloud auth application-default login`) and on Cloud Run, `/api/diag` returns `{gemini:'OK', model:'gemini-3.8-flash', firestore:'ok'}`
- [ ] Cloud Run logs show no API key; request goes to Agent Platform (check Agent Platform API metrics in console)
- [ ] Firestore console shows the `diag` document in the chosen region (asia-southeast2/1)

**W3. Schema + Knex migrate.** "Implement @kit/SPEC.md §3 as Knex migrations (mysql2) — users, ponds (incl. max_feed_kg), telemetry_readings, sop_documents, tool_calls, approvals. Add a seed that loads @kit/samples/ponds.json. Add short comments explaining WHY each table and column exists (e.g. why blocked attempts are stored, why one decision per proposal)."
Done when:
- [ ] `npx knex migrate:latest && npx knex seed:run` works locally AND against Cloud SQL
- [ ] `SELECT id, volume_m3 FROM ponds` → A 30, B 30
- [ ] Inserting a second approval for the same tool_call fails (unique key)

**W4. Replayable telemetry.** "Add `POST /api/telemetry` (array or single, validated with Zod) and `POST /api/telemetry/replay` (DEMO_MODE only) that loads @kit/samples/telemetry/pond_A_do_drop.csv and pond_B_tan_rise.csv, converting WIB timestamps to UTC. Replay must be idempotent (delete that pond's simulated rows first). Add `GET /api/ponds/:id/telemetry?hours=24` and a `stats(pondId)` function returning min/max/last + time-of-min per param. Add short comments explaining WHY replay is deterministic and why stats are computed in Node, not by Gemini."
Done when:
- [ ] Replay inserts 96 rows per pond; running it twice still gives 96
- [ ] `stats('A')` → DO min 2.4 at 2026-10-15 04:00 WIB, last 3.1 (matches ground_truth GT01/GT03)
- [ ] `stats('B')` → TAN last 1.0, NH3 last 0.06 (GT08/GT09)

**W5. Basic chat UI + deploy.** "In /web build one page: two pond cards (latest DO/pH/temp/TAN/NH3, badge 'SIMULASI'), a 'Putar ulang data' button calling replay, a chat box posting to `/api/chat` (stub echo for now), and an empty audit table. Show times in WIB. Add short comments explaining WHY (e.g. why the SIMULATED label is always visible)."
Done when:
- [ ] Deployed web URL shows both cards after clicking replay
- [ ] Chat echo round-trips
- [ ] **Deployed by end of Thu morning. If not, stop and fix deploy before anything else.**

## Day 2 — Thu 15 Oct: RAG, Gemini, tools, HITL

**T1. SOP RAG ingest.** "Add `POST /api/sop/ingest` that reads @kit/samples/sop/*.md, parses front-matter (doc_key, title, citations, tags), splits by `##` heading into chunks, embeds each with a Gemini embedding model via @google/genai (model name from env `GEMINI_EMBED_MODEL`; check Model Garden for your project; call through the same Agent Platform client from W2b), and upserts into sop_documents. Add `retrieve(query, k)` doing cosine similarity in Node, with a keyword/tag fallback when embedding is NULL. Add short comments explaining WHY no vector DB is used."
Done when:
- [ ] Ingest twice → same row count (idempotent)
- [ ] `retrieve('oksigen turun malam', 3)` returns SOP-02 first; `retrieve('molase', 3)` returns SOP-01 first

**T2. Prompt A briefing.** "Implement `POST /api/briefings` per @kit/SPEC.md §6 Prompt A using @google/genai with `responseMimeType: application/json` and a response schema {briefing, facts[]}. Input = stats for all ponds + top-6 retrieved SOP chunks. Store result. Add short comments explaining WHY Gemini gets precomputed stats and must cite chunks."
Done when:
- [ ] Briefing mentions Kolam A DO 2.4 mg/L at 04:00 and the >3 mg/L limit with SDSU citation
- [ ] facts[] contains GT01, GT07, GT09 values exactly
- [ ] Says data is SIMULATED; contains none of the banned claims in SPEC §10

**T3. Function-calling stubs.** "Declare tools start_aerator, set_feeder_kg, dose_molasses_gL (SPEC §6) and pass them to Gemini in Prompt A and C. Each handler validates args with Zod and ONLY inserts a tool_calls row with status='proposed', rationale, citations, model, prompt_id. No hardware, no HTTP to devices. Add a deterministic `suggestMolasses(tanMgL, volumeM3)` per SPEC §7 (Avnimelech 20 g/m³ per 1 ppm TAN, cap 0.12). Add short comments explaining WHY dose maths is in code."
Done when:
- [ ] Briefing creates start_aerator(A,120) proposal (GT11) and dose_molasses_gL(B,0.045) (GT12); no molasses for A (GT13)
- [ ] `suggestMolasses(1.0, 30)` → {g_per_L: 0.045, kg_total: 1.36} (20/0.44, rounded) unit test passes

**T4. Chat: Prompt B + C.** "Wire `/api/chat`: Prompt B (model GEMINI_MODEL_LITE) parses BI/EN intent incl. decimal comma and '2 jam' → 120 min; status_query answers from stats; propose_action runs Prompt C with retrieved SOP chunks. Add short comments explaining WHY the cheap model is used for intent."
Done when:
- [ ] GT17 and GT20 pass via the UI
- [ ] Unknown messages get a polite 'other' reply, no tool call

**T5. HITL approve/reject.** "Add `POST /api/tool-calls/:id/approve|reject` (NO login: actor is the fixed demo supervisor set server-side; `express-rate-limit` on both routes → 429; 409 if not 'proposed'), write approvals row, set status approved→executed_simulated in one transaction; AFTER commit, call `logAuditEvent` (W2b) for the decision. Also log `proposed` and `blocked` events wherever tool_calls rows are inserted. Firestore failure → retry once, then mark 'audit sync pending', never undo the MySQL decision. Add `GET /api/audit-events` and show it in the UI audit table. UI: proposal cards with Approve/Tolak and the citation; live audit table. Add short comments explaining WHY approval is enforced server-side and in a transaction."
Done when:
- [ ] GT22 (409) passes; GT21 (operator 403) is RETIRED by the no-login decision — mark N/A in selfcheck.md
- [ ] 11th approve in a minute from one IP → 429
- [ ] Audit table shows approver, time (WIB), args, citation
- [ ] Each approve/reject/block creates exactly one Firestore `audit_events` doc with matching `tool_call_id`

## Day 3 — Fri 16 Oct: safety, bilingual, polish, freeze (18:00 midpoint cut, 22:00 code freeze)

**F1. Safety hard-blocks.** "Create `api/src/safety.js` as pure functions implementing every rule in @kit/SPEC.md §7 with constants imported from one `thresholds.js` file whose values are copied from @kit/sop-thresholds.md (with a source comment per constant). Run it on EVERY proposal (from briefing or chat) before insert; blocked → status='blocked' with safety_result. Vitest table tests for all rules. Add short comments explaining WHY limits live in code and not in the prompt."
Done when:
- [ ] GT14, GT15, GT16, GT18, GT19 pass as unit tests and via chat
- [ ] Changing a constant in thresholds.js changes behaviour (single source)

**F2. Prompt D refusal.** "When safety blocks, call Prompt D (SPEC §6) in the user's language; never suggest a bypass. Add short comments explaining WHY the refusal is LLM-worded but code-decided."
Done when:
- [ ] 'tambah molase 0,2 g/L di kolam A' → BI refusal citing 0.12 g/L and Pérez-Fuentes et al. 2016, plus 'aerasi dulu' alternative

**F3. Bilingual briefing.** "Add an ID/EN toggle (default 'id'; BI output always has an English caption line below it because all submission materials must be English) passed to Prompt A, B-reply and D. Format numbers with decimal comma in ID. Add short comments explaining WHY."
Done when:
- [ ] Same facts[] in both languages (diff the JSON); ID uses '2,4 mg/L'

**F4. Self-check script.** "Write `api/scripts/selfcheck.js` that replays the samples, runs the briefing and the chat cases from @kit/samples/ground_truth.csv, and prints PASS/FAIL per case_id plus a total; write `selfcheck.md`. Numeric facts exact; text checks by contains. Add short comments explaining the matching rules."
Done when:
- [ ] `node scripts/selfcheck.js` prints ≥ 18/22 PASS; failures listed honestly in selfcheck.md

**F5. Polish + video helpers.** "Add empty/loading/error states, a one-click 'Reset demo' button calling `POST /api/demo/reset` per @kit/SPEC.md §4 (rate-limited, writes a demo_reset audit event), and a header stepper: Data → Briefing → Approve → Audit. Pin the briefing for the video by caching the last good output, and serve it labelled 'cached' when Gemini returns 503/quota errors after one retry. No login of any kind. Show 'SIMULASI / SIMULATED' on every data view. Add short comments explaining WHY."
Done when:
- [ ] Full @kit/samples/demo_script_seed.json scenes 1–7 run on the deployed URL in < 3 min
- [ ] Opening the URL in a fresh incognito window lands in the demo with no sign-in
- [ ] Reset demo → pond cards, audit table and briefings back to the clean seed state in one click
- [ ] Forcing a Gemini error (bad model env) shows the cached briefing, not a crash
- [ ] **18:00 MYT midpoint: apply the cut list below. 22:00 MYT: code freeze (only README/video after this).**

## Day 4 — Sat 17 Oct: ship

**S1. README + submit.** "Write README.md: one-paragraph pitch (Future of Work: supervisor stays in charge, agent does the monitoring/maths/paperwork), the mermaid diagram from @kit/SPEC.md §1 with actuators as ROADMAP, setup + deploy, the 'What is stubbed' table (§9, include a row 'Pond view — SIMULATED illustration, not a camera or real pond'), a **'How we use Google Cloud' section** (Cloud Run = hosting; Gemini 3.8 Flash on Gemini Enterprise Agent Platform via service account; Firestore = audit event stream; Cloud SQL MySQL = telemetry/SOP/state, and WHY MySQL for telemetry; Secret Manager; Firebase NOT used — say so plainly), data sources + guardrails, 'Sample questions for judges' (3–5 known-good prompts from demo_script_seed), 'Known limits' (simulated data, no login + rate limits, Gemini global endpoint = no data residency, any quota cap), sources table from @kit/sop-thresholds.md, cost notes (§8), selfcheck result, AI-use disclosure (Gemini + Cursor), team (Ilfa Hidayat — leader, Alif Asraf). Use 'Source-Grounded Biofloc Reasoning', never the banned claims in §10. Plain markdown."
Done when:
- [ ] Fresh clone → `docker compose up` + migrate + seed + replay works
- [ ] Every link resolves (run `npx markdown-link-check README.md`)
- [ ] `rg -i "70%|1\.56|275|zero.hallucination|0\.002" README.md web api` → nothing
- [ ] README states only measured latency numbers (or none)

**S2. Pre-submit DQ checklist.** "Write `SUBMIT_CHECKLIST.md` and a script `scripts/predeploy-check.sh` that: (1) greps the repo and git history for secrets (`git log -p | rg -i 'AIza|api[_-]?key|password|BEGIN PRIVATE KEY'`), (2) greps README/web/api for the banned claims, (3) curls the deployed `/healthz`, `/` and one `/api/briefings` call and prints status + latency, (4) prints `gcloud run services describe` min-instances and timeout. Add short comments explaining WHY each check exists (each maps to a DQ rule from the session)."
Done when:
- [ ] Team shows as formed on the dashboard (formation CLOSED 14 Oct — if not formed, escalate to support+aibuildercup@hack2skill.com now); all members working professionals 21+, JAPAC (student = DQ)
- [ ] Mandatory items: live Cloud Run URL; video **strictly under 3:00** (target 2:50, public YouTube/Vimeo/Drive); **public** GitHub repo; deck exported **as PDF** (architecture + business case, theme named)
- [ ] Everything in English (BI lines captioned in English); 'brief description' field (UNVERIFIED) prepared anyway naming Cloud Run + Gemini on Agent Platform + Firestore (+ why no Firebase)
- [ ] All code written during the event (git history starts in the event window)
- [ ] Secret scan clean in working tree AND history; deck and video show no keys or `gcloud ... --set-env-vars` lines
- [ ] Deployed URL opens without login in incognito; `/api/briefings` < request timeout
- [ ] `--min 1` applied for judging (cost noted); no feature redeploys after submit, critical fixes only
- [ ] Submitted by end of Sat 17 Oct MYT; exact official hour/time zone checked on the dashboard

**S3 (stretch, only if S1–S2 are green). ADK agent path + Agent Platform Sessions.** Docs check (SPEC §12): ADK-TS exists but `VertexAiSessionService` is not listed for TypeScript, so for a named Agent Platform service use a Python ADK sidecar. TS variant below is tools-only. "On a branch `adk-stretch`, wrap the three tools as ADK `FunctionTool`s (zod schemas, `execute` only inserts tool_calls via the existing service + safety.js) in an `LlmAgent` using `@google/adk`. Note ADK-TS quickstart needs Node 24.13+, so this lives in a separate package/container. Configure the model for Agent Platform per https://google.github.io/adk-docs/ (Models & Authentication page — verify, do not guess). Add short comments explaining WHY safety.js still decides, not the agent." Python variant: a separate Cloud Run service with ADK Python + `VertexAiSessionService` storing chat sessions in Agent Platform Sessions; the Node API calls it for `/api/chat` behind a flag, with the current path as fallback.
Done when:
- [ ] Same GT14/GT17 outcomes as the main path; never merged if it risks the demo

---
## Midpoint cut list (Fri 18:00 MYT — cut in this order, top first)
1. Embeddings → keep keyword/tag retrieval only (T1 fallback).
2. set_feeder_kg tool → leave declared, drop from the demo.
3. Cloud Scheduler auto-briefing → manual button.
4. Self-check → run just GT01, GT11, GT12, GT14 manually and screenshot.
5. Next.js → serve a static React page from the API container (one Cloud Run service).
6. Bilingual → BI only, English subtitles in the video.
0. **F6 pond view is cut FIRST (before item 1).**
**Never cut:** deploy, safety.js hard-blocks, approve → audit row, SIMULATED labels, citations.

**F6 (optional, CUT-FIRST at midpoint). Isometric pond view.** "Add a `PondView` component in /web: one pond drawn in CSS/SVG isometric style. Water colour interpolates by latest DO (colour bands keyed to the existing DO thresholds imported from the same thresholds module — no new numbers), aerator bubbles animate only while an *approved* `start_aerator` command is within its `duration_min`, feeder drop animates once per approved `set_feeder_kg`. Inputs are ONLY the telemetry replay API and the approved-command audit log; Gemini never drives the UI directly. Add a 'Simulate night' button that calls the existing replay (DO-drop file). A permanent 'SIMULATED / SIMULASI' badge is always visible on the pond view (no prop can hide it). Add short comments explaining WHY the view reads the audit log instead of model output (the human approval is what moves the picture)."
Done when:
- [ ] 'Simulate night' → water shifts as DO falls to 2.4; approve aerator → bubbles appear; reject → nothing moves
- [ ] SIMULATED badge visible in every state, including loading/error
- [ ] Removing PondView leaves the rest of the app untouched (cut-first safe)
