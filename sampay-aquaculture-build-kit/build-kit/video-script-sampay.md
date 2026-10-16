# Video Script + Shot List: Sampay Aquaculture Co-Pilot (v3, official rules: strictly under 3:00)
Theme: Future of Work & Enterprise Productivity. Target **2:50**, hard cap **strictly under 3:00** (official Terms + FAQ; written rules override the session captions). All in English: BI segment keeps English captions.
Structure per session (38:26, 31:36): open on the live product, cut to architecture, back to the result; cover use case, tech choices, sample inputs, result, impact. Loud, clear voiceover (32:39).

Rules: "SIMULATED SENSOR FEED" on every product shot. Commands appear only as audit-log entries, never moving equipment. Only figures marked Verified / Wrong-corrected in source-validation.md (rows 1-9, G1, G2, G9, G13, G14). Thresholds from sop-thresholds.md win. No login screen (demo opens without login). [FILL] only from tests actually run.
Never say: 70% of crop failures, 60-70% OpEx, 1.56 Mt, BPS, $275 BOM, $0.002/1k, "zero-hallucination", 5.9 Mt tilapia, "53% of food supply", Indonesia as top producer, "automation is new", "biofloc fails everywhere for one reason".

## Script (bullet beats, not word-for-word)
| # | Time | Beat | Criterion | On screen | Voice beats | Source |
|---|---|---|---|---|---|---|
| 1 | 0:00-0:10 | Cold open on live product | UX, Tech | Live URL, no login; "SIMULATED SENSOR FEED" banner; 3 a.m. DO alert already firing on Kolam A | "It's 3 a.m. Kolam A's oxygen is falling. Watch what the supervisor sees." | build |
| 2 | 0:10-0:28 | Global problem -> Indonesia | Problem 25% | "103 Mt farmed in 2024, 53% of aquatic animal production (FAO, SOFIA 2026)"; "Trained-staff shortage documented in Mexico and Lake Victoria"; zoom to Indonesia: "Tilapia: Indonesia's largest farmed fish by volume", "1.38 Mt in 2024 (KKP)" | Fish farming feeds the world; skilled hands are short where biofloc spreads; in Indonesia, that's one supervisor, alone, from memory; feed is 40-60% of production cost, so mistakes are expensive | G1, G2, G9, G13; rows 1a, 2, 4 |
| 3 | 0:28-0:40 | The idea + how we differ | Innovation 25% | Flow: simulated feed -> Gemini agent + farm SOPs -> briefing -> human approval -> logged command | "Sensor-driven pond automation already exists. What's new: the AI drafts each decision from your farm's own SOPs, a person approves every action, and code enforces the safety limits." | G13 (Jiuzhou Noah) |
| 4 | 0:40-1:00 | Sample input: overnight DO drop | Tech 40% | Replayed scenario: DO falls below 3 mg/L; pH, NH3, temp alongside; show the sample input (sensor JSON) briefly | "Here's the input: a scripted night of readings, labelled simulated." | sop-thresholds.md, SDSU |
| 5 | 1:00-1:30 | BI briefing, grounded | Gen AI 40%, UX 10% | Briefing in Bahasa Indonesia, English captions; each recommendation cites its SOP passage (click shows source text); toggle to English | Gemini grounded in the farm's SOPs, with citations, not guesses | RAG over curated SOPs |
| 6 | 1:30-1:48 | Cut to architecture | Tech 40% | Diagram: simulated feed -> Node.js on Cloud Run -> Gemini via Agent Platform (Vertex, service account) ("Gemini on Agent Platform" only; mention ADK Sessions only if the Python sidecar is built and shown) -> approval queue + audit log in Firestore | Name each Google Cloud piece and why it's there, one line each | final SPEC (T2, T9, T10) |
| 7 | 1:48-2:05 | Back to result: approve | Tech, UX | Proposed function call "start_aerator(Kolam A)"; supervisor taps Approve; audit log entry with timestamp + approver | Human-in-the-loop: nothing runs without a person | build |
| 8 | 2:05-2:22 | Result: dosing + refusal | Tech 40% | Molasses proposal 0.045 g/L (1.36 kg for 30 m³, from 1.0 mg/L TAN × 20 / 0.44), status proposed; then a dose above 0.12 g/L REFUSED by code, rule shown | "The safety limits live in code, not the prompt. Even an approved command outside them is refused." | sop-thresholds.md; Pérez-Fuentes 2016 |
| 9 | 2:22-2:35 | Proof | Tech 40% | Test results: [FILL: unsafe commands refused N/N; citation coverage] — measured only | Honest stubs: no real ESP32 or actuators yet; synthetic data | build tests |
| 10 | 2:35-2:50 | Why it travels + close | Impact, Innovation | Split: changes per country (SOP pack, language, sensors) vs stays (agent, approval, safety in code, audit log); roadmap Indonesia -> JAPAC -> global labelled "plan"; markers only Mexico, Lake Victoria; "23.1 million people work in aquaculture (FAO)"; live URL, repo, team (Ilfa Hidayat, lead) | "New country, new SOP pack and language. Same safety rules in code. A co-pilot, not an autopilot." | G9, G13, G14 |

## Shot list (record each as its own clip)
| Clip | Type | Done when |
|---|---|---|
| 1 Cold open | Screen capture of live URL | No login screen; banner visible; alert already firing |
| 4 DO drop + input | Screen capture | Banner whole clip; DO crosses 3 mg/L; sample JSON readable |
| 5 BI briefing | Screen capture | English captions checked by Ilfa; citation click shows real SOP text |
| 6 Architecture | Slide | Matches final SPEC exactly (Agent Platform route, log store) |
| 7, 8 Approve + dosing + refusal | Screen capture | Approve tap + log entry; 0.045 g/L / 1.36 kg shown; refusal shows the 0.12 g/L rule |
| 9 Proof | Slide | Measured numbers only; no [FILL] left |
| 2, 3, 10 Story | Slides + voiceover | Every stat shows its source; markers only on sourced places |

Setup: 1920x1080, zoom 125%, notifications off, use the app's "Reset demo" button (or reset script) before every take so each starts at the same overnight state; keep Reset off-screen in clip 1, no background music, captions on. Audio: external or headset mic, quiet room, normalise loudness in edit, listen back once on laptop speakers.

## Fallbacks
- Different briefing text on a retake: fine if citations are real; never edit text in post.
- Gemini/Agent Platform call fails: retry from reset; if down, record from frozen local build, caption "recorded from frozen build", fix live URL before submitting.
- Over 2:55: trim beat 2 zoom b-roll, then beat 10 roadmap, then the sample-JSON moment in beat 4. Never cut beat 8's refusal. Pond view (F6) is NOT in this cut; only add it if a final take comes in under 2:40, and swap it for time in beat 2, with a permanent "SIMULATED" label.

## Final check before upload
Strictly under 3:00 (aim 2:50); audio loud and clear; no login; "SIMULATED SENSOR FEED" on every product shot; no hardware shown moving; every stat sourced; nothing from the never-say list; BI captions checked; video opens logged out; live URL and repo work.
