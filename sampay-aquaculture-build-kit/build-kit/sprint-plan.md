# Sprint plan: Sampay Aquaculture Co-Pilot (all times MYT, UTC+8; WIB = MYT − 1 h)

**Deadline (official):** "Prototype submission deadline Oct 18, 2026" / "submit it before October 18" (aibuildercup.com) — exact hour + zone **UNVERIFIED**. **Internal target: submitted by end of Sat 17 Oct MYT.** No extension (session 52:46).
**Team formation closed 14 Oct** (official) — confirm on the dashboard tonight that the team shows as formed; if not, email support+aibuildercup@hack2skill.com immediately.
Builder: Alif Asraf (Cursor). Team leader on form: Ilfa Hidayat. Prompts = `CURSOR_PROMPTS.md`. Official rules override the session notes (SPEC §13).

**Required items (official T&C):** live URL on Cloud Run · video **strictly under 3:00** (target 2:50, public YouTube/Vimeo/Drive) · **public** GitHub repo · deck **as PDF** (architecture + business case, theme named) · all in English · fresh code only. "Brief description" field UNVERIFIED — prepare one anyway.
**Judging-window rules:** app must stay live until results (down = DQ); no login; no secrets in repo/history/deck/video (use Secret Manager; Gemini via service account, no key); critical fixes only after submit.

## Wed 14 Oct (night)
| Time | Do | Prompt |
|---|---|---|
| 22:45–23:00 | Confirm deadline + submission fields; create GCP project, enable Run/SQL/Secret Manager/Agent Platform (aiplatform)/Firestore APIs; create Cloud Run service account (no Gemini key) | — |
| 23:00–23:45 | Skeleton | W1 |
| 23:45–00:45 | Cloud Run hello + start Cloud SQL instance creation (takes a while) | W2 |
| 00:45 | Sleep. | |

## Thu 15 Oct
| Time | Do | Prompt |
|---|---|---|
| 08:00–09:00 | Finish W2 DB connect | W2 |
| 09:00–10:00 | Schema + migrate + seed | W3 |
| 10:00–11:30 | Telemetry replay + stats | W4 |
| 11:30–13:00 | Basic UI, **deploy (Day-1 deploy gate)** | W5 |
| 13:00–14:00 | Lunch / buffer | |
| 14:00–15:30 | SOP ingest + retrieve | T1 |
| 15:30–17:00 | Briefing Prompt A | T2 |
| 17:00–18:30 | Function-call stubs + suggestMolasses | T3 |
| 18:30–19:30 | Dinner / buffer | |
| 19:30–21:00 | Chat B + C | T4 |
| 21:00–22:30 | Approve/reject + audit; deploy | T5 |
| 22:30–23:00 | Send Ilfa the URL for BI wording review | — |

> Thu 15 Oct 22:55 status note: if W2b (Agent Platform + Firestore) is not done, do it first thing Fri.

## Fri 16 Oct
| Time | Do | Prompt |
|---|---|---|
| 08:00–09:00 | Agent Platform Gemini client + Firestore audit smoke (if not done Thu) | W2b |
| 09:00–10:30 | safety.js + tests | F1 |
| 10:30–11:30 | Prompt D refusal | F2 |
| 11:30–13:00 | Bilingual + English captions on BI output | F3 |
| 13:00–14:00 | Lunch / buffer | |
| 14:00–15:00 | Self-check | F4 |
| 15:00–17:00 | Polish, no-login, rate limits, one-click Reset demo, 503 cached fallback; deploy | F5 |
| 17:00–18:00 | (optional) pond view — only if F1–F5 green | F6 |
| **18:00** | **Midpoint: apply cut list (F6 cut FIRST); everything not green is cut** | |
| 18:00–21:30 | Fix only demo-path bugs; dry-run demo_script_seed scenes ×3 from incognito | |
| **22:00** | **CODE FREEZE** (tag `v1-demo`, final deploy) | |
| 22:00–23:30 | Record video takes (target 2:50, loud clear voice, open on live product), Ilfa reviews BI lines | |

## Sat 17 Oct (ship day = internal deadline)
| Time | Do | Prompt |
|---|---|---|
| 09:00–10:30 | README (How we use Google Cloud, stubs table incl. pond view SIMULATED, sample questions, limits) | S1 |
| 10:30–11:30 | Pre-submit DQ checklist + secret scan (tree + history) | S2 |
| 11:30–13:00 | Edit video **< 3:00** with English captions; upload public/unlisted-accessible; deck → PDF | — |
| 13:00–14:00 | `gcloud run services update <svc> --min 1` for judging (billed while idle; revert after results) | — |
| 14:00–16:00 | Fill submission form (Ilfa submits if leader required), submit | — |
| 16:00–23:59 | **Buffer only.** No new features. (S3 Python ADK Sessions sidecar only on a branch, never redeploy main) | S3 |

## After submit (until results)
- Keep Cloud Run + Cloud SQL + Firestore running; check `/healthz` daily. Critical fixes only, no features. Watch Gemini quota.

## Build / Fake / Cut
| Item | Decision | Why |
|---|---|---|
| Node API on Cloud Run + Cloud SQL MySQL + Knex | **Build** | core, judged on deploy; MySQL = telemetry/state |
| Gemini briefing (Prompt A) with citations | **Build** | hero moment |
| Function-calling tools → tool_calls rows | **Build** | agentic story |
| safety.js hard limits (0.12 g/L molasses, DO>3, NH3, pH) | **Build** | trust story; never cut |
| Approve/reject + audit log | **Build** | Future-of-Work story |
| Bilingual BI/EN | Build (cut #6) | Indonesian users |
| RAG embeddings | Build (cut #1 → keywords) | 4 SOPs only |
| Self-check vs ground_truth | Build (cut #4) | evidence for judges |
| ESP32 sensors | **Fake** (replayed SIMULATED CSV) | no hardware/time |
| Actuators (aerator VFD, feeder, doser) | **Fake** (audit row `executed_simulated`) | safety + time; ROADMAP |
| Auth | **Cut** — no login at all; rate limits + Reset demo | judges open URL cold |
| Firestore audit_events | **Build** (small) | append-only audit; explains Firestore use |
| Gemini via Agent Platform (service account) | **Build** | no API key to leak; safe reading of rules |
| Isometric pond view (F6) | Optional, **cut FIRST** | nice-to-have visual |
| ADK Python + Agent Platform Sessions (S3) | Stretch only | ADK-TS lacks Sessions per docs |
| NH3 from TAN/pH/temp formula | **Cut** (simulator supplies NH3) | formula not in source-validation |
| Cloud Scheduler auto-briefing | Cut (#3) | button is enough |
| Real KKP SOP ingestion, multi-farm, mobile app | **Cut** → roadmap slide | scope |
