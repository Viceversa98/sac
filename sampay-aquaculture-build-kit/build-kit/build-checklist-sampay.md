# Re-score and build checklist: Sampay Aquaculture Co-Pilot
Theme: Future of Work & Enterprise Productivity. Official criteria and weights: https://aibuildercup.com/themes.html (Tech/GenAI 40, Problem/Impact 25, Innovation 25, UX 10).
Scores are my judgement of the locked MVP plan. Nothing is built yet, so they are provisional. Every fact must come from `source-validation.md` (rows marked Verified or Wrong-corrected only). The deadline is assumed to be end of 17 Oct MYT (UNVERIFIED).

## Estimated score (if the locked BUILD list ships)
| Criterion | Weight | Score | Why |
|---|---|---|---|
| Technical Merit & Gen AI | 40% | 3.5/5 (28) | Gemini function calling, plus retrieval over the SOPs with citations, plus an approval gate before any tool call is real agentic work. Risks: the hardware is simulated, and agent actions could breach safety limits unless hard checks exist. |
| Problem Alignment & Impact | 25% | 4.5/5 (22.5) | Raised from 4 by the sourced global framing: 103 Mt aquaculture and over 59% of aquatic animal food (G1/G2), 23.1M aquaculture workers (G14), and the skills gap documented where biofloc is spreading (G9, G13). Original reasoning: | The labour and skill gap in biofloc farming is sourced (Khanjani 2024: "lack of skilled staff"), and feed is a large share of total production cost (40–60%, and 58.34% on a Thai biofloc tilapia farm). Framed as Future of Work: one supervisor, many ponds. |
| Innovation & Creativity | 25% | 4/5 (20) | Sensor readings become a briefing in Bahasa Indonesia/English, then an approved action, then an audit log. More than a dashboard. |
| UX & Solution Design | 10% | 3.5/5 (7) | Chat briefing and one-tap Approve are clear. Unproven until built. |
| **Total** | | **~77/100** (was ~75 before the global framing) | Innovation stays at 4, because the framing changes the reach story, not the novelty.  It could drop to the mid-60s if the simulation looks like real hardware, if any old unsourced figure survives, or if the agent proposes an unsafe dose. It could reach about 80 if the T5/T6 safety and accuracy results are shown. |

## Technical Merit & Gen AI (40%)
- [ ] T1 Deployed. Done when: the Node.js API and UI run on Cloud Run, connected to Cloud SQL MySQL (Knex), and a private window can play the scenario end to end.
- [ ] T2 Current model via Agent Platform. Done when: Gemini (`gemini-3.8-flash` or `gemini-3.1-flash-lite`) is called through Gemini Enterprise Agent Platform (formerly Vertex AI). For example, `@google/genai` with `vertexai: true` and a service account, not an AI Studio API key. The README says so, and nothing references 1.5 or the old "$0.002/1k" price. Prices quoted only from the Gemini pricing page, dated.
- [ ] T3 Simulated feed. Done when: a replayable feed (DO, pH, NH3, temperature) includes an overnight DO drop, can be reset and replayed the same way every time, and the UI shows "SIMULATED SENSOR FEED" whenever it's on screen.
- [ ] T4 Grounded retrieval. Done when: every recommendation cites a specific SOP passage from `sop-thresholds.md` or its source papers (Avnimelech 1999, Pérez-Fuentes 2016, SDSU FS963-02, Khanjani 2024), and a question the SOPs don't cover gets "not in SOPs" rather than an answer.
- [ ] T5 Hard safety limits. Done when: the tool layer (code, not the prompt) rejects any command outside `sop-thresholds.md`. For example, a molasses dose that would push the concentration above 0.12 g/L (Pérez-Fuentes 2016: the DO crash) is refused. A test with at least 5 unsafe requests shows that every one is refused. The cases must cover `MOLASSES_MAX_GL`, feeding or molasses below `DO_CRITICAL_MGL` 1.0, pH outside 6.5–9.0, feeding below 15 °C, and feeding above `NO2_MAX_MGL` 1.0.
- [ ] T6 Calculation accuracy. Done when: the C/N and molasses calculations run in code (≈20 g carbohydrate per m³ per 1 g N/m³, from Avnimelech 1999), with unit tests against hand-worked examples that use `MOLASSES_CARB_FRACTION` 0.44. The molasses rows (GT12 in `ground_truth.csv`, `demo_script_seed.json`) and SPEC lines 43 and 238 are regenerated with 0.44: Kolam B example 45.5 g/m³ = 0.045 g/L = 1.36 kg. Unit tests must assert these values. In the README, label the design-choice limits (daily cap, 35 °C, 50 mg/L alkalinity floor, 3 mg/L DO gate) as unsourced. Gemini only explains the result. Results go in the README.
- [ ] T7 Function calling. Done when: Gemini proposes a tool call (aerator, feeder or dose), it waits as PENDING, and runs only after the supervisor approves. Every step is written to the audit log with a timestamp, who approved it, and the SOP citation.
- [ ] T8 Clean history. Done when: all commits are dated on or after kickoff, and SOP PDFs, mockups and any firmware made earlier are listed in the pre-existing work table.

- [ ] T9 Agent Platform service. Written rules allow "Gemini/Gemma or an agentic platform" (scoring risk, not a stated rule). Done when: README and architecture slide say "Gemini on Agent Platform" (Vertex-routed, T2) with one sentence on why. Do NOT claim ADK-TS Sessions/Memory Bank (not listed for TypeScript in the docs). Claim ADK/Sessions only if the optional Python sidecar is actually built and visible. Risk: without the sidecar, Tech is likely 3.5 rather than 4.
- [ ] T10 Stack justified (05:29: explain the use of "Firebase, Firestore, Cloud Run and Gemini"). Done when: EITHER the audit log and approval queue move to Firestore (the recommended option: small, serverless, and it ticks the named stack), OR the README gives one paragraph on why Cloud SQL MySQL is used (relational sensor time series and Knex migrations). The demo URL is Cloud Run either way (08:11, a hard rule).

## Problem Alignment & Impact (25%)
- [ ] P1 Only sourced figures. Done when: every statistic in the deck, README and video matches a Verified or Wrong-corrected row in `source-validation.md`, with its year and link. Banned: 70% crop failures, "60–70% OpEx", 1.56 Mt (unless the portal figure is confirmed and labelled as grow-out only, 2024), "BPS", $275 BOM, $0.002/1k.
- [ ] P2 Production figure. Done when: the pitch uses "1.38 Mt tilapia in 2024 (KKP)" or "1,368,542 t in 2023 (SEAFDEC/KKP)", and says "Indonesia's largest farmed fish by volume" rather than "#1 commodity".
- [ ] P3 Future of Work framing. Done when: the problem statement leads on supervisor workload and the skills gap (sourced), with food security as supporting context only.
- [ ] P4 Cost honesty. Done when: any per-pond hardware cost is given as a range of about $340–460 (before shipping and duty), labelled as a roadmap estimate, or left out.

- [ ] P5 Local to global, sourced. Done when: the opening global line uses only G1, G2, G3, G14, G9 or G13 from `source-validation.md`, each with its link. G4, G11 and G15 are not used, and "Indonesia is a top producer" is not claimed. No claim says biofloc farms everywhere fail for one reason. The "why it travels" beat separates what changes per country (SOP pack, language, sensors) from what stays the same (agent, approval, code safety checks, audit log), labels the roadmap as a plan, and names only sourced countries.

## Innovation & Creativity (25%)
- [ ] I1 Difference. Done when: the pitch does NOT claim that automating ponds from sensor data is new (G13: China's Jiuzhou Noah already automates aeration and feeding). Instead it leads with three things: briefings grounded in the farm's own SOPs with citations, human approval before every action, and safety limits enforced in code. If this fails, Innovation drops from 4 to 3.5 (about -2.5 points).
- [ ] I2 No overclaims. Done when: "Zero-Hallucination", "industrial-grade" and "high-availability SQL" are gone, replaced by "grounded, with citations", "maker-grade sensors (roadmap)" and the actual Cloud SQL tier. Also banned (from teammate-doc-validation.md): "fully automated IoT execution", "closed-loop actuation", VFD rpm percentages, Ilfa's comparison table, and the 0.6/0.01 molasses formula. The only usable survival line is 94.6% vs 84.96% in ONE trial (Pérez-Fuentes 2016), worded as a single trial.

## UX & Solution Design (10%)
- [ ] U1 Core flow. Done when: a supervisor goes from morning briefing to the alert, then approving, then seeing the log entry, in 4 taps or fewer.
- [ ] U2 Bilingual. Done when: the briefing renders in Bahasa Indonesia and English, and the BI segment of the video has English captions.
- [ ] U3 Clear units. Done when: ammonia is labelled as either un-ionised NH3 or TAN (not "ppm amonia"), and status uses text as well as colour.
- [ ] U4 Supervisor control. Done when: the supervisor can edit or reject any proposed command, and a rejection is logged too.

## Stubs (stated in the README, not scored as built)
Real ESP32s, real aerators, feeders and valves, auth polish, multi-farm billing.

## Submission (pass or fail)
- [ ] S1 Required or disqualified (official Terms/FAQ, see official-rules-check.md): video STRICTLY UNDER 3:00 (target 2:50; the session's "3 to four minutes" is overruled by the written rules), live URL on Cloud Run/GCP/Firebase, public GitHub repo, deck as PDF. All in English and naming the problem statement; the Bahasa Indonesia segment keeps English captions. Code written fresh during the event. Demo needs no login; the "brief description" field is UNVERIFIED.
- [ ] S6 The app stays up through judging (05:02, 11:16): Cloud Run min-instances set to 1 or a warm-up ping, and a Gemini quota and billing alert set. Only bug fixes after the deadline, no new features (41:46).
- [ ] S7 No secrets in the repo (28:01): `git log -p | rg -i "api_key|secret|password"` comes back clean, and keys live in Secret Manager or env vars.
- [ ] S2 The Future of Work & Enterprise Productivity theme is entered, under team leader Ilfa Hidayat, and the ESG copilot is NOT also entered for this team.
- [ ] S3 The exact deadline time and timezone are confirmed on Hack2skill. Submit an early draft.
- [ ] S4 The README states: simulated sensor feed, no real actuators, the "MDPI 2025" source either confirmed or replaced, and the free Gemini tier not used for real farm data.
- [ ] S5 Team locked: formation CLOSED 14 Oct (FAQ + Terms: no roster changes after 14 Oct). Done when: Alif confirms in the Hack2skill dashboard that the team is locked, with 2–4 members, all working professionals aged 21+, JAPAC-based, and no students (one student disqualifies the team).
- [ ] U5 F6 pond view (optional, first to cut): permanent on-screen "SIMULATED" label; adds a little UX polish only, no score change assumed.
