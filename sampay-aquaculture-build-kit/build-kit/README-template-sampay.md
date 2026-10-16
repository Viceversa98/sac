<!-- README template for AI Builder Cup 2026, Sampay. Replace every [bracket].
Rules: only use figures marked Verified or Wrong-corrected in source-validation.md, each with its link.
Never write: "Zero-Hallucination", 70% crop failures, 60-70% OpEx, 1.56 Mt (unless portal confirmed), BPS, $275 BOM, $0.002/1k.
Never delete: the simulation notice, "What's real, simulated or stubbed", "Pre-existing work disclosure". -->

# [Logo] Sampay Aquaculture Co-Pilot
**[Slogan, one line]**

> **Demo notice:** all sensor data in this demo comes from a **simulated sensor feed** (replayed, scripted readings). No physical sensors, aerators, feeders or dosing valves are connected. Commands are written to an audit log only.

[Elevator pitch, 2 sentences: a Gemini agent that reads pond sensor data and the farm's biofloc SOPs, writes a daily briefing in Bahasa Indonesia and English, and proposes actions a supervisor approves before anything is logged.]

- Live demo: [Cloud Run URL] (tested on [date], not a 404)
- Demo video (strictly under 3:00): [link]
- Deck (PDF): [link]
- Problem statement: Future of Work & Enterprise Productivity
- Open the demo with no login needed. It stays live through judging.
- Repo: [public link]
- Theme: Future of Work & Enterprise Productivity (the only theme entered)

## The problem
Fish farming now feeds the world. In 2024, aquaculture produced a record 103 million tonnes of aquatic animals, 53% of all aquatic animal production ([FAO, SOFIA 2026](https://www.fao.org/3/cd8357en/online/sofia-2026/total-fisheries-aquaculture.html)).
[Hook question about a night-shift supervisor and a dissolved-oxygen crash.]
- Tilapia production in Indonesia: [1.38 Mt in 2024 (KKP) OR 1,368,542 t in 2023 (SEAFDEC)] ([link from source-validation.md])
- Tilapia is Indonesia's largest farmed fish by volume ([link])
- Feed is [40-60% of production cost, or 58.34% on one Thai biofloc farm] ([link])
- [Why this matters to the team, e.g. Ilfa's connection to pond farming]

## How it works
1. **Sensor feed (simulated):** a replayable feed of DO, pH, ammonia and temperature readings, labelled "SIMULATED SENSOR FEED" on every screen.
2. **Grounded reasoning:** [Gemini model name and version] uses retrieval over curated biofloc SOP documents and cites the SOP and paper behind every recommendation. It can still be wrong, which is why step 4 exists.
3. **Briefing:** a daily briefing in Bahasa Indonesia and English.
4. **Approval:** Gemini proposes an action through function calling (e.g. `start_aerator` on Kolam A, a molasses dose for Kolam B). A supervisor must approve it before the tool call runs.
5. **Safety limits in code:** C/N and molasses dosing are calculated by plain code from `sop-thresholds.md`, not by the AI. Any command outside those limits is refused, even if approved.
6. **Audit log:** every approved command is logged with its time, approver, readings and cited SOP. No real equipment is moved.

[Architecture diagram: simulated feed > Node.js on Cloud Run > Cloud SQL MySQL > Gemini + SOP retrieval > briefing > supervisor approval > safety check > audit log]

## What's real, simulated or stubbed
| Part | Status |
|---|---|
| Gemini retrieval over SOPs, with citations | Real |
| Daily briefing (BI/EN) | Real |
| Function calling plus supervisor approval | Real |
| Safety limits and dosing maths in code | Real |
| Audit log | Real |
| Sensor data (DO/pH/ammonia/temp) | **Simulated**, replayed script |
| Isometric pond view (if shipped) | **Simulated** animation, labelled on screen |
| ESP32 hardware, aerators, feeders, dosing valves | **Not connected** (roadmap) |
| Login | None. The demo opens without signing in (required) |
| Multiple farms, billing | Stubbed |

## How we differ
Sensor-driven pond automation already exists (FAO's SOFIA 2026 describes China's Jiuzhou Noah project, where sensors control aeration and feeding), so automation itself isn't our claim. What's new: (1) Gemini grounds every briefing in the farm's own SOPs, with citations; (2) a person approves every action before it runs; (3) safety limits are enforced in code and refuse unsafe commands.

## Try it: sample questions
Click **Reset demo** first to start from a clean state (the approve button is rate-limited). Then paste these into the chat on the live demo. Each should return a grounded answer with an SOP citation:
1. "[e.g. DO dropped to 2.5 mg/L at 3 a.m. What should I do?]"
2. "[e.g. Berapa molase untuk Kolam B hari ini? / How much molasses for Kolam B today?]"
3. "[e.g. Dose 10 kg molasses now]" (expected: refused by the safety limits)

## Data sources
- Sensor data: synthetic, replayed from `[file]`, labelled "SIMULATED SENSOR FEED".
- SOP knowledge base: [list documents and their sources].
- Thresholds: `sop-thresholds.md` (see the sources below).

## Guardrails
- A person approves every proposed action before the tool call runs.
- Hard safety limits in code (e.g. 0.12 g/L molasses cap, no feeding when DO is below 1.0 mg/L) refuse unsafe commands, even approved ones.
- Every answer cites its SOP; where there's no source, the agent says so instead of guessing.
- Secrets are kept in [Secret Manager / env vars], none in the repo.

## Tech stack
- Backend: Node.js on Google Cloud Run
- Database: Cloud SQL (MySQL) with Knex
- AI: [exact Gemini model] via Vertex AI / Agent Platform (service account, not an AI Studio key), function calling
- Agent Platform: Gemini runs on Agent Platform (Vertex AI). Don't claim ADK Sessions or Memory Bank unless the Python sidecar is built and shown in the demo.
- Why this stack: [why Cloud SQL, or Firestore for the approval queue and audit log, and how each Google service is used]
- Frontend: [Next.js or simple web UI]

## Evaluation
- Grounding: [x of y briefings cited a correct SOP section], method: [describe]. Only report tests actually run.
- Safety: [n] out-of-range commands tested, [n] refused.
Leave this section out rather than estimate.

## Sources for thresholds and formulas
Avnimelech (1999), Pérez-Fuentes (2016), Silva (2017), SDSU, Hargreaves (SRAC 4503), Khanjani: [full citations and links, see sop-thresholds.md]. Note any licence or reuse limits.

**Limitations (keep these in):**
- These limits are design choices, not taken from a source: the daily molasses cap, the 35 °C upper temperature limit, the 50 mg/L alkalinity floor and the 3 mg/L DO gate.
- The molasses carbohydrate fraction (0.44) is derived: 22% carbon (Silva 2017) divided by 0.50 (Avnimelech 1999).
- For Pérez-Fuentes (2016) and Avnimelech (1999), only the abstracts were reviewed.
- There's no hard limit for total ammonia (TAN). The simulator supplies NH3 directly.

## Challenges and what we learned
- [Honest point]

## Pre-existing work disclosure
All code was written during the event ([kickoff] to [deadline]) except what's listed below. Commit history starts on [date].
| Item (SOP docs, firmware, mockups, slides, code) | Origin | Created when | What changed during the event |
|---|---|---|---|
| [item, or "None"] | | | |
AI tools used during development: [e.g. Cursor].

## Team
| Name | Role | What they built |
|---|---|---|
| Ilfa Hidayat (team leader) | [role] | [contribution] |
| Muhammad Alif Asraf | [role] | [contribution] |

## Global relevance & roadmap
Indonesia is our proof case. Here's why the approach travels:
- Aquaculture supplies over 59% of the aquatic animal food people eat ([FAO, 2026](https://www.fao.org/newsroom/detail/sofia-2026--global-fisheries-and-aquaculture-production-reaches-new-highs/en)).
- 23.1 million people work in aquaculture worldwide ([FAO, SOFIA 2026](https://www.fao.org/3/cd8357en/online/sofia-2026/employment-fisheries-aquaculture.html)).
- Where biofloc is spreading, a shortage of trained staff is a documented barrier. A survey of 248 farmers in Mexico found that limited technical capacity and a lack of specialist extension staff held back adoption ([Betanzo-Torres et al., 2020](https://www.mdpi.com/2073-4441/12/10/2775)). FAO names "shortages of skilled professionals" as a constraint on Lake Victoria's tilapia cage farming ([FAO, SOFIA 2026](https://www.fao.org/3/cd8357en/online/sofia-2026/towards-sustainable-aquaculture.html)).
<!-- Do not claim Indonesia is a top producer (G4/G15 unverified). Do not claim biofloc fails everywhere for one reason. -->
What changes per country: the SOP pack (local thresholds and practice), the briefing language, and the sensor hardware. The agent, approval step, safety checks and audit log stay the same.
Roadmap: Indonesia pilot > other JAPAC countries > global, via SOP packs and new languages. Each step is a plan, not a result.
<!-- Leave out any bullet without a verified source. Never estimate the market size. -->

## What's next
- Next month: pilot with real ESP32 sensors on [one pond]. Real hardware costs: [itemised parts list with prices, or leave out].
- Next year: [goal]
- Running cost: [Gemini + Cloud Run estimate from current Google pricing, with link, or UNVERIFIED]

## After the deadline
Only bug fixes after [deadline]. No new features. The live URL stays up through judging.

## Submission checklist
- [ ] All required items are submitted: deck as a PDF, video strictly under 3:00, live URL on Cloud Run/GCP/Firebase, public GitHub repo, all in English and naming the problem statement (the description field is UNVERIFIED)
- [ ] The demo opens with no login
- [ ] Cloud Run min-instances set to 1, and the app stays live through judging
- [ ] Secrets scan run on the repo, with no keys or service-account JSON committed
- [ ] Video is strictly under 3:00 (aim for 2:50), keeps English captions on Bahasa Indonesia segments, with loud clear audio, and shows the use case, tech choices, sample inputs, result and impact
- [ ] Sample questions in the README work on the live URL
- [ ] Team locked in the Hack2skill dashboard (formation closed 14 Oct): 2 to 4 members, all working professionals aged 21 or over, based in JAPAC, no students
- [ ] Code written fresh during the event
- [ ] "SIMULATED SENSOR FEED" appears in the README, every demo screen and the video
- [ ] None of the banned claims appears anywhere
- [ ] Every figure links to a source in source-validation.md
- [ ] The video shows commands as log entries, not moving equipment, with English captions on BI segments
- [ ] Live link, repo and video open (no 404s); commit history starts after kickoff
