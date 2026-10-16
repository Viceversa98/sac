# Build kit: Sampay Aquaculture Co-Pilot

This is a kit, not an app. You (Alif) write the app in Cursor; the kit gives the spec, prompts and test data.

## Start tonight (5 minutes)
1. Unzip (or copy) this `build-kit/` folder into a new empty repo as `kit/`. Also copy `../source-validation.md` into `kit/` so Cursor can see the evidence.
2. Open the repo folder in Cursor. In the chat, add `@kit/SPEC.md`, `@kit/sop-thresholds.md`, `@kit/samples`.
3. Open `kit/CURSOR_PROMPTS.md`, paste **W1**, run its "Done when" checklist, then W2, … in order. Follow `kit/sprint-plan.md` for timing.

## Files, read in this order
1. `SPEC.md`: architecture (mermaid, actuators = ROADMAP), MySQL schema, API, Gemini prompts A–D + function declarations, hard safety limits, stack, cost notes, stubbed list, banned claims.
2. `sop-thresholds.md`: DRAFT thresholds copied only from `source-validation.md` (Challenge Validator may overwrite; if so, update `thresholds.js` from it). Policy choices that are not from a paper are labelled.
3. `CURSOR_PROMPTS.md`: W1–W5 + W2b (Agent Platform Gemini + Firestore smoke), T1–T5, F1–F5 + F6 (optional pond view, cut first), S1 (README), S2 (pre-submit DQ checklist), S3 (stretch ADK-TS) + midpoint cut list.
4. `sprint-plan.md`: hour-by-hour, Build/Fake/Cut table. Official: "submit before October 18" (hour/zone UNVERIFIED); internal target **end of Sat 17 Oct MYT**. Team formation **closed 14 Oct**. Video **strictly under 3:00** (2:50). Deck as PDF, all English, public repo. Official rules override session notes — see SPEC §13.
5. `samples/` — **ALL SYNTHETIC**:
   - `sop/SOP-01..04*.md`: C/N & molasses, DO/aeration, ammonia/pH, feeding. Each cites real papers (Avnimelech 1999; Pérez-Fuentes et al. 2016; SDSU FS963-02 2010; Khanjani et al. 2024; Tongsiri et al. 2020).
   - `telemetry/pond_A_do_drop.*` (DO falls to 2.4 mg/L at 04:00 WIB) and `pond_B_tan_rise.*` (TAN → 1.0, NH3 → 0.06). Regenerate with `python3 generate.py`.
   - `ponds.json`: 2 ponds (30 m³) + fictitious users.
   - `ground_truth.csv`: 22 expected facts / proposals / blocks (GT01–GT22) for F4 self-check.
   - `video-script-sampay.md` (copied from ../ — re-copy if Demo Day Coach updates it).
   - `demo_script_seed.json`: exact numbers and scenes for the video (shared with Demo Day Coach).

## Stack decision (what judges asked us to explain)
- **Cloud Run**: hosts web + API (mandatory per session 08:11).
- **Gemini 3.8 Flash on Gemini Enterprise Agent Platform** (formerly Vertex AI), `location=global` because the model has no APAC regional endpoint; auth via Cloud Run service account — no API key exists.
- **Firestore**: append-only `audit_events` stream for every proposal/block/approval (small, serverless, server-write-only).
- **Cloud SQL MySQL**: kept for telemetry, SOP chunks and the transactional approval state — SQL aggregates and a unique-decision constraint fit relational data better.
- **Agent Platform managed services**: ADK-TS lacks Agent Platform Sessions per docs; Sessions only via optional Python sidecar (S3). Otherwise claim only "Gemini on Agent Platform".
- **Firebase**: not used (no client SDK, no Firebase Hosting); say this plainly in the description.
- **Secret Manager**: DB password only.

## Ground rules
- Never type a number into code or the pitch that is not in `sop-thresholds.md` / `source-validation.md`.
- Banned: "70% crop failures", "1.56 Mt" (unconfirmed), "$275 BOM", "Zero-Hallucination", "$0.002/1k tokens".
- No secrets in the repo, git history, deck or video (DQ). No login at all (rate limits + one-click Reset demo instead). English captions on all BI text. Keep the Cloud Run URL live until results.
- Approve = audit row only. Nothing controls real hardware.
