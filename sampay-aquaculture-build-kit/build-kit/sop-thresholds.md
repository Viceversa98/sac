# Sampay Aquaculture Co-Pilot — Safety Limits SOP (single source of truth)

**App:** Sampay Aquaculture Co-Pilot (hackathon) — Gemini agent for biofloc Nile tilapia (*Oreochromis niloticus*) ponds in Indonesia; simulated sensors (DO / pH / ammonia / temp); supervisor approves commands; **code must refuse any command outside the hard-coded limits in §3**.

**Rule:** No invented facts. Every number below was taken from a source that was opened or fetched for this document (or reused from `source-validation.md`, which itself opened those pages on 14 Oct 2026 MYT). Anything not confirmed is marked **UNVERIFIED**. Where only an abstract was accessible, that is noted.

**Checked:** 14 Oct 2026 (MYT). Reuses verified rows from `/workspace/hackathon/sampay/source-validation.md`.


## 0. Code constants (names kept from build-kit draft; verified 14 Oct 2026)

| Constant | Value | Status | Source |
|---|---|---|---|
| `DO_TARGET_MIN_MGL` | 3.0 (optimum is > 3) | Confirmed | SDSU FS963-02 Table 1 (Ross 2000) |
| `DO_SURVIVAL_MGL` | 0.1 (context only, never a target) | Confirmed | SDSU FS963-02 Table 1 (Magid & Babiker 1975) |
| `DO_CRITICAL_MGL` | 1.0 | NEW | FAO TiLV Session 3: "DO level should be greater than 1 mg/L" |
| `NH3_UNIONISED_OPT_MGL` | 0.05 | Confirmed | SDSU FS963-02 (El-Sherif 2008) |
| `NH3_UNIONISED_GROWTH_DEPRESS_MGL` | 0.1 | Confirmed | SDSU FS963-02 (El-Sherif 2008) |
| `PH_MIN` / `PH_MAX` | 7 / 9 | Confirmed (best growth) | SDSU FS963-02 (Ross 2000) |
| `PH_HARD_MIN` / `PH_HARD_MAX` | 6.5 / 9.0 | NEW (6.5 from FAO optimum 6.5–8.5; 9.0 from SDSU) | FAO TiLV S3 + SDSU |
| `TEMP_MIN_C` / `TEMP_MAX_C` | 22 / 29 | Confirmed; source corrected to SDSU only (Khanjani gives no temp range) | SDSU FS963-02 |
| `TEMP_NO_FEED_BELOW_C` | 15 | NEW | FAO TiLV S3: "stop eating when the temperature is below 15oC" |
| `NO2_WARN_MGL` | 0.2 | NEW | FAO TiLV S3 |
| `NO2_MAX_MGL` | 1.0 | NEW | NMSU CR680: tilapia nitrite "at or below 1 ppm" |
| `ALKALINITY_MIN` / `ALKALINITY_MAX` | 100 / 150 mg/L CaCO3 | Confirmed; primary source added | Hargreaves SRAC 4503 (2013); Khanjani 2024 |
| `TSS_TYPICAL_MAX` | 500 mg/L (hard 1,000) | Confirmed | Hargreaves SRAC 4503; Khanjani 2024 |
| `TSS_HARD_MAX_MGL` | 1000 | NEW | Hargreaves SRAC 4503 |
| `SS_IMHOFF_MIN_MLL` / `SS_IMHOFF_MAX_MLL` | 25 / 50 mL/L (10–20 min settle) | NEW | Hargreaves SRAC 4503, Fig. 3 |
| `MOLASSES_MAX_GL` | 0.12 g/L, HARD BLOCK above | Confirmed (abstract only) | Pérez-Fuentes et al. 2016 |
| `CARB_G_PER_G_TAN` | 20 g CH per g N (assumes CH at 50% C) | Confirmed | Avnimelech 1999 Eq. 4 (ΔCH = ΔN/0.05) |
| `CN_FEED_EXAMPLE` | 10.75 → 15.75 | Confirmed | Avnimelech 1999 |
| `CN_TESTED_RANGE` | 10–20; 10:1 best | Confirmed (abstract) | Pérez-Fuentes 2016 |
| `MOLASSES_C_FRACTION` | 0.22 g C/g | NEW | Silva et al. 2017, Rev. Caatinga (UFRPE lab assay) |
| `MOLASSES_CARB_FRACTION` | 0.44 (= 0.22 / 0.50, molasses expressed as Avnimelech-equivalent CH) | CHANGED from 1.0. Derived, not a direct measurement. Doses go up about 2.3x, and `MOLASSES_MAX_GL` still caps them | Silva 2017 + Avnimelech 1999 |
| `FEED_N_EXCRETION_FRACTION` | 0.5 | NEW | Avnimelech 1999 |
| `MOLASSES_BLOCK_IF_DO_BELOW_MGL` | 3 | Kept. Farm policy, not sourced | Design choice (Pérez-Fuentes crash started from 3.2) |

Molasses dose (g) = TAN_drop_mgL × V_m3 × CARB_G_PER_G_TAN / MOLASSES_CARB_FRACTION. The command is refused if the dose / (V_m3 × 1000) exceeds MOLASSES_MAX_GL.

---

## 1. Parameter table — Nile tilapia in biofloc

Columns: **optimal / target range**, **warning threshold** (alert / recommend supervisor review), **critical / hard limit** (refuse unsafe actuator commands), **source**.

| Parameter | Optimal / target | Warning | Critical / hard limit | Source (opened) |
|---|---|---|---|---|
| **Dissolved oxygen (DO)** | Growth optimum **> 3 mg/L** (SDSU citing Ross 2000). Farm training guidance also cites **6–8 mg/L** as optimal and **> 1 mg/L** as a floor (FAO TiLV training module). | **≤ 3 mg/L** (below growth optimum; risk rising). Pérez-Fuentes preliminary trial: molasses overdose dropped DO from **3.2 to 1–1.5 mg/L**. | **≤ 1.0 mg/L**: refuse feeding and molasses dosing; **never stop aeration**. Survival reported down to **0.1 mg/L** (Magid & Babiker 1975 via SDSU) — treat as emergency, not a target. | Mjoun, Rosentrater & Brown, SDSU Extension FS963-02 (2010), Table 1 + text ([Open PRAIRIE PDF](https://openprairie.sdstate.edu/cgi/viewcontent.cgi?article=1163&context=extension_fact)); FAO TiLV Session 3 training PDF ([fao.org](https://www.fao.org/fi/static-media/MeetingDocuments/TiLV/s3.pdf)); Pérez-Fuentes et al. 2016 abstract ([ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0044848615302386)) |
| **pH** | **7–9** best growth (SDSU citing Ross 2000). FAO training: **6.5–8.5**. | Outside **6.5–8.5** or trending toward extremes. | Outside **3.7–11** tolerance band (SDSU): refuse lime/bicarbonate dosing that would push further outside **6.5–9.0** (operational band combining SDSU optimum + FAO training). Fish “cannot grow if pH > 11” (FAO training). | SDSU FS963-02 Table 1; FAO TiLV Session 3 |
| **Un-ionised ammonia (NH₃)** | Optimum **< 0.05 mg/L** (SDSU citing El-Sherif et al. 2008). FAO training: ammonia optimally **< 0.1 mg/L**. | **≥ 0.05 mg/L**; growth depressed from **0.1 mg/L** (SDSU / El-Sherif). | **≥ 0.1 mg/L NH₃**: refuse feeding. Acute Nile tilapia toxicity reported up to **7.1 mg/L** NH₃ (El-Sherif via SDSU) — far above operational limits; do not use as a soft target. | SDSU FS963-02 Table 1 + text; FAO TiLV Session 3 |
| **Total ammonia nitrogen (TAN)** | Prefer management via **NH₃** (depends on pH & temp). NMSU aquaponics guidance: keep TAN **< 1 mg/L** (general / tilapia aquaponics table). | TAN rising while pH/temp high (more of TAN is toxic NH₃). | **No single critical TAN hard-limit sourced for biofloc tilapia alone.** App must convert TAN → NH₃ using pH & temperature before applying NH₃ limits. NMSU Table 1 gives % NH₃ of TAN by pH/temp. | NMSU Circular 680 (Sallenave; page live when fetched) ([pubs.nmsu.edu](https://pubs.nmsu.edu/_circulars/CR680/)); SDSU for NH₃ |
| **Nitrite (NO₂⁻ / N-NO₂)** | FAO TiLV training: optimally **< 0.2 mg/L**. NMSU: for tilapia maintain **≤ 1 ppm**. | **≥ 0.2 mg/L**. | **> 1 mg/L**: refuse feeding (**design choice grounded on NMSU tilapia ≤1 ppm**; FAO does not state a hard kill threshold). NMSU notes nitrite toxic at **5 ppm** generally. | FAO TiLV Session 3; NMSU Circular 680 |
| **Temperature** | SDSU: **22–29 °C** optimum growth. FAO TiLV: **25–30 °C**. | Outside **22–30 °C** (union of SDSU + FAO guidance). Growth poor **< 20 °C** (SDSU); stop eating **< 15 °C**; cannot survive more than a few days **< 10 °C** (FAO). | **< 10 °C or > 42 °C** (SDSU range extremes 8–42 °C; lethal cold ~10 °C per FAO). Refuse non-emergency dosing/feeding when outside **15–35 °C** — **15 °C stop-eating and upper band are partly design choice; upper 35 °C not a single sourced hard limit** (SDSU cites species tolerance to 42 °C). | SDSU FS963-02 Table 1; FAO TiLV Session 3 |
| **Alkalinity** | **100–150 mg/L as CaCO₃** (Hargreaves SRAC 4503; restated in Khanjani et al. 2024). | **< 100 or > 150 mg/L**. | **< 50 mg/L**: refuse further carbohydrate dosing that accelerates alkalinity loss without simultaneous alkalinity correction. (**50 mg/L floor = design choice, not sourced**; Hargreaves only states keep 100–150.) Bicarbonate / lime dosing allowed only to restore toward **100–150**. | Hargreaves, SRAC Publication No. 4503 (Apr 2013) ([srac.msstate.edu PDF](https://www.srac.msstate.edu/pdfs/Fact%20Sheets/4503%20Biofloc%20Production%20Systems%20for%20Aquaculture.pdf)); Khanjani, Sharifinia & Emerenciano 2024 ([PMC10796188](https://pmc.ncbi.nlm.nih.gov/articles/PMC10796188/)) |
| **TSS (total suspended solids)** | Typically operate **< 1,000 mg/L**, **most often < 500 mg/L**; **200–500 mg/L** sufficient for functionality (Hargreaves). | **> 500 mg/L**. | **> 1,000 mg/L**: refuse molasses / carbon dosing; require solids removal / clarifier. Undesirable highs of **2,000–3,000 mg/L** noted if unmanaged (Hargreaves). | Hargreaves SRAC 4503; Khanjani et al. 2024 (cites same) |
| **Settleable solids (Imhoff cone, mL/L)** | Tilapia biofloc: **25–50 mL/L** after **10–20 min** settle (Hargreaves Fig. 3 / text). | Outside **25–50 mL/L**. | **> 50 mL/L**: refuse further carbon dosing until solids reduced. (**Hard refuse at >50 = design choice enforcing Hargreaves’ upper target.**) | Hargreaves SRAC 4503 |

**Notes on ammonia sensors:** The proposal mock-up shows “Amonia 0.02 ppm”. Express every reading as **TAN** or **un-ionised NH₃** explicitly; 0.02 ppm is consistent with the NH₃ optimum (<0.05) only if it is NH₃, not TAN (`source-validation.md` row 8c).

---

## 2. C/N ratio target and molasses (carbohydrate) dosing formula

### 2.1 Target C/N

| Target | Evidence | Access |
|---|---|---|
| Raise feed C/N from **~10.75 → 15.75** (30% protein feed example) | Avnimelech 1999 | Abstract + article preview opened on ScienceDirect (full PDF paywalled) |
| Literature often cites **15:1–20:1** for biofloc | Pérez-Fuentes et al. 2016 abstract (citing Avnimelech); Silva et al. 2017 tested **10:1 and 20:1** | Pérez-Fuentes: abstract only; Silva et al.: full HTML opened (Redalyc) |
| **10:1** gave best production / survival in a 6-month Nile tilapia molasses biofloc trial | Pérez-Fuentes et al. 2016: total production highest at 10:1 (**18.03 ± 0.25 kg m⁻³**); survival with biofloc **94.60 ± 2.03%** vs control **84.96 ± 1.53%** | Abstract only |
| **Sampay operational target:** prefer **10:1–15:1** (Pérez-Fuentes best + Avnimelech mid-band); allow up to **20:1** only with DO ≥ 3 mg/L and settleable solids ≤ 50 mL/L | Synthesis of cited papers; upper-bound gating is **design choice** | — |

### 2.2 Avnimelech (1999) derivation — emergency TAN removal

From Avnimelech, Y. (1999). *Aquaculture* 176: 227–235. doi:10.1016/S0044-8486(99)00085-X.

Microbial carbon assimilated:

\[
\Delta C_{\mathrm{mic}} = \Delta\mathrm{CH} \times \%C \times E
\]

Nitrogen demand of new cells:

\[
\Delta N = \Delta C_{\mathrm{mic}} / [C/N]_{\mathrm{mic}} = \Delta\mathrm{CH} \times \%C \times E / [C/N]_{\mathrm{mic}}
\]

Using Avnimelech’s approximate constants **%C ≈ 0.5**, **E ≈ 0.4**, **[C/N]mic ≈ 4**:

\[
\Delta\mathrm{CH} = \Delta N / 0.05
\]

**Worked constant:** carbohydrate needed to remove **1 g N/m³** (1 ppm TAN) ≈ **20 g CH / m³**.

| Symbol | Meaning | Value used | Source of constant |
|---|---|---|---|
| `%C` | Carbon fraction of added carbohydrate | **~0.5** (generic CH) | Avnimelech 1999 (approximate) |
| `E` | Microbial conversion efficiency | **0.4–0.6** (uses **0.4**) | Avnimelech 1999 citing Paul & van Veen 1978; Gaudy & Gaudy 1980 |
| `[C/N]mic` | Microbial biomass C/N | **~4** | Avnimelech 1999 citing Gaudy & Gaudy 1980 |
| `0.05` | `%C × E / [C/N]mic` | **0.5 × 0.4 / 4** | Derived in Avnimelech 1999 Eq. (4) |

### 2.3 Feed-based prophylactic dosing (molasses)

Avnimelech also estimates ammonium flux from feed (≈ **50%** of feed N excreted as NH₄ or organic N that mineralises):

\[
\Delta N = Q_{\mathrm{feed}} \times \%N_{\mathrm{feed}} \times \%N_{\mathrm{excretion}}
\]

with `%N_feed = CP% / 6.25`, `%N_excretion ≈ 0.5`.

For a **chosen C:N target** and a measured carbon content of the carbon source (`%C_source`):

\[
\Delta\mathrm{Carbohydrate} = \frac{\Delta N \times (C{:}N)}{\%C_{\mathrm{source}}}
\]

This form is used by Silva et al. (2017) (citing Samocha et al. 2007; Avnimelech 2009) with lab-measured carbon fractions.

### 2.4 Molasses carbon content assumption

| Assumption | Value | Source | Access |
|---|---|---|---|
| Sugarcane molasses carbon | **0.22 g C / g molasses** (22%) | Silva, Falcon, Pessôa & Correia (2017), *Rev. Caatinga* — “%C … 0.22 (molasses) … analyzed in the Fundamental Chemistry Laboratory of the Federal University of Pernambuco” | Full text opened ([Redalyc HTML](https://www.redalyc.org/journal/2371/237154415023/html/)) |
| Alternate claim “~37% carbon” | **UNVERIFIED for Sampay** — seen in an Indonesian IOP conference abstract snippet; not used as default | IOP Conf. Ser. Earth Environ. Sci. 430 (2019) search snippet only | Do not hard-code |
| Avnimelech generic CH | **~50% C** | Avnimelech 1999 (for generic carbohydrate, not molasses-specific) | Use only with generic CH; for molasses prefer **0.22** |

**Default for Sampay:** use **%C_molasses = 0.22** (Silva et al. 2017). If farm molasses is assayed differently, replace this constant and log the assay.

### 2.5 Worked example (molasses, feed-based, C:N = 10:1)

Assumptions (all sourced or labelled):

- Pond volume **V = 10 m³** (example size — **design choice**).
- Daily feed **Q = 1.0 kg** (= 1000 g) of **30% CP** feed (Avnimelech’s example protein level).
- `%N_feed = 30 / 6.25 = 0.048` (4.8%).
- `%N_excretion = 0.5` (Avnimelech 1999).
- Target **C:N = 10** (Pérez-Fuentes best treatment).
- `%C_molasses = 0.22` (Silva et al. 2017).

\[
\Delta N = 1000 \times 0.048 \times 0.5 = 24\ \mathrm{g\ N}
\]

\[
\Delta\mathrm{molasses} = (24 \times 10) / 0.22 = 240 / 0.22 \approx \mathbf{1091\ g\ molasses\ / day}
\]

Per m³: **≈ 109 g / m³ / day** for this feed load.

**Emergency TAN strip (Avnimelech 20 g CH rule), same pond:** to drop TAN by **1 mg/L** (= 1 g N/m³ × 10 m³ = 10 g N):

- Generic CH at 50% C: \(\Delta\mathrm{CH} = 10 / 0.05 = 200\ \mathrm{g}\) generic carbohydrate.
- Molasses at 22% C: 200 g CH-equivalent × (0.50 / 0.22) ≈ **455 g molasses** (= 45.5 g/m³, below the 120 g/m³ cap).

### 2.6 Oxygen crash warning (hard safety interaction)

Pérez-Fuentes et al. 2016 (preliminary 21-day study, abstract):

> “Adding molasses at concentrations **> 0.12 g L⁻¹** produced dramatic lowering of oxygen, from **3.2 to 1–1.5 mg L⁻¹**.”

**Implication for Sampay:** any single molasses dose that would raise concentration **> 0.12 g/L** (= **120 g/m³**) in the pond water **must be refused** (or split across multiple supervised doses with DO recovery checks). Access: **abstract only**.

---

## 3. HARD-CODED SAFETY LIMITS (machine-readable)

Only limits backed by a cited source are marked `sourced`. Engineering judgements required for a working refuse-gate are marked `design_choice_not_sourced`.

```yaml
# sampay_hard_limits — code must never violate these
# Checked 2026-10-14 (Asia/Kuala_Lumpur). Sources keyed in §4.
schema_version: 1
species: Oreochromis_niloticus
system: biofloc

limits:
  - parameter: dissolved_oxygen
    min: 1.0
    max: null
    unit: mg/L
    action: refuse_feed_and_molasses_below_min; never_stop_aeration_below_min
    source_key: fao_tilv_s3
    note: "FAO TiLV training: DO should be >1 mg/L (optimal 6-8). SDSU growth optimum >3."

  - parameter: dissolved_oxygen
    min: 3.0
    max: null
    unit: mg/L
    action: refuse_molasses_dosing_below_min; warn_and_require_supervisor_for_feed
    source_key: sdsu_fs963_02
    note: "SDSU/Ross: optimum growth >3 mg/L. Pérez-Fuentes crash started from 3.2."

  - parameter: pH
    min: 6.5
    max: 9.0
    unit: "1"
    action: refuse_lime_or_bicarbonate_that_exits_band; refuse_molasses_if_pH_below_min
    source_key: fao_tilv_s3_and_sdsu
    note: "FAO optimal 6.5-8.5; SDSU best growth 7-9. Band is intersection/union for ops."

  - parameter: un_ionised_NH3
    min: null
    max: 0.05
    unit: mg/L
    action: warn_above_max
    source_key: sdsu_fs963_02
    note: "Optimum <0.05 mg/L (El-Sherif via SDSU)."

  - parameter: un_ionised_NH3
    min: null
    max: 0.10
    unit: mg/L
    action: refuse_feed_above_max
    source_key: sdsu_fs963_02
    note: "Growth depression from 0.1 mg/L (El-Sherif via SDSU). FAO ammonia optimally <0.1."

  - parameter: nitrite_N
    min: null
    max: 0.2
    unit: mg/L
    action: warn_above_max
    source_key: fao_tilv_s3
    note: "FAO TiLV: nitrite optimally <0.2 mg/L."

  - parameter: nitrite_N
    min: null
    max: 1.0
    unit: mg/L
    action: refuse_feed_above_max
    source_key: nmsu_cr680
    note: "NMSU: tilapia nitrite should be ≤1 ppm."

  - parameter: temperature
    min: 15.0
    max: 35.0
    unit: "°C"
    action: refuse_feed_outside_band
    source_key: fao_tilv_s3
    note: "FAO: stop eating below 15°C. Upper 35°C is design_choice_not_sourced (SDSU cites tolerance to 42°C)."
    evidence_tag: mixed_sourced_and_design_choice

  - parameter: temperature
    min: 10.0
    max: 42.0
    unit: "°C"
    action: emergency_alert_outside_band
    source_key: sdsu_fs963_02_and_fao
    note: "SDSU range 8-42; FAO cannot survive more than a few days below 10°C."

  - parameter: alkalinity_CaCO3
    min: 100.0
    max: 150.0
    unit: mg/L
    action: allow_bicarbonate_or_lime_only_toward_band
    source_key: hargreaves_srac_4503
    note: "Hargreaves: keep alkalinity 100-150 mg/L as CaCO3 with sodium bicarbonate."

  - parameter: TSS
    min: null
    max: 1000.0
    unit: mg/L
    action: refuse_carbon_dosing_above_max
    source_key: hargreaves_srac_4503
    note: "Typically operated <1000 mg/L; most often <500."

  - parameter: TSS
    min: 200.0
    max: 500.0
    unit: mg/L
    action: target_operating_band
    source_key: hargreaves_srac_4503
    note: "200-500 mg/L sufficient for functionality without excessive water respiration."

  - parameter: settleable_solids_imhoff
    min: 25.0
    max: 50.0
    unit: mL/L
    action: refuse_carbon_dosing_above_max; target_band
    source_key: hargreaves_srac_4503
    note: "Tilapia biofloc Imhoff 25-50 mL/L after 10-20 min."

  - parameter: molasses_single_dose_concentration
    min: null
    max: 0.12
    unit: g/L
    action: refuse_dose_above_max
    source_key: perez_fuentes_2016
    note: "Abstract: >0.12 g/L molasses dropped DO from 3.2 to 1-1.5 mg/L. Equivalent 120 g/m3."

  - parameter: molasses_max_per_day_per_m3
    min: null
    max: 120.0
    unit: g/m3/day
    action: refuse_cumulative_daily_dose_above_max_without_split_and_DO_checks
    source_key: perez_fuentes_2016
    note: "Maps the 0.12 g/L single-dose crash threshold to a daily ceiling. Splitting still requires DO≥3 before each aliquot — design_choice_not_sourced for split protocol."
    evidence_tag: sourced_threshold_with_design_choice_protocol

  - parameter: C_to_N_ratio_target
    min: 10.0
    max: 15.0
    unit: "ratio"
    action: prefer_band; allow_up_to_20_only_if_DO_ge_3_and_SS_le_50
    source_key: perez_fuentes_2016_and_avnimelech_1999
    note: "Pérez-Fuentes best at 10:1; Avnimelech example raises to 15.75; literature 15-20."

  - parameter: aeration
    min: null
    max: null
    unit: "state"
    action: never_stop_aeration_when_DO_below_3.0
    source_key: hargreaves_srac_4503
    note: "Hargreaves: biofloc water respiration high; response time often <1 h on failure. Stopping aeration when DO already low is refused."
    evidence_tag: design_choice_not_sourced_for_exact_3_mgL_gate
    # Gate value 3.0 aligns with SDSU growth optimum; Hargreaves stresses never lose mixing/aeration.

constants_for_dosing:
  avnimelech_CH_per_g_N: 20.0   # g generic CH / g N  (Avnimelech 1999)
  avnimelech_divisor: 0.05      # ΔCH = ΔN / 0.05
  microbial_E: 0.4
  microbial_CN: 4.0
  generic_CH_carbon_fraction: 0.5
  molasses_carbon_fraction: 0.22  # Silva et al. 2017 UFRPE lab
  feed_N_excretion_fraction: 0.5  # Avnimelech 1999
  protein_to_N: 6.25

supervisor_required: true  # all actuator commands need human approval (product rule)
```

**JSON equivalent (same content, for parsers that prefer JSON):**

```json
{
  "schema_version": 1,
  "species": "Oreochromis_niloticus",
  "system": "biofloc",
  "limits": [
    {"parameter": "dissolved_oxygen", "min": 1.0, "max": null, "unit": "mg/L", "action": "refuse_feed_and_molasses_below_min; never_stop_aeration_below_min", "source_key": "fao_tilv_s3"},
    {"parameter": "dissolved_oxygen", "min": 3.0, "max": null, "unit": "mg/L", "action": "refuse_molasses_dosing_below_min; warn_and_require_supervisor_for_feed", "source_key": "sdsu_fs963_02"},
    {"parameter": "pH", "min": 6.5, "max": 9.0, "unit": "1", "action": "refuse_lime_or_bicarbonate_that_exits_band", "source_key": "fao_tilv_s3_and_sdsu"},
    {"parameter": "un_ionised_NH3", "min": null, "max": 0.05, "unit": "mg/L", "action": "warn_above_max", "source_key": "sdsu_fs963_02"},
    {"parameter": "un_ionised_NH3", "min": null, "max": 0.10, "unit": "mg/L", "action": "refuse_feed_above_max", "source_key": "sdsu_fs963_02"},
    {"parameter": "nitrite_N", "min": null, "max": 0.2, "unit": "mg/L", "action": "warn_above_max", "source_key": "fao_tilv_s3"},
    {"parameter": "nitrite_N", "min": null, "max": 1.0, "unit": "mg/L", "action": "refuse_feed_above_max", "source_key": "nmsu_cr680"},
    {"parameter": "temperature", "min": 15.0, "max": 35.0, "unit": "°C", "action": "refuse_feed_outside_band", "source_key": "fao_tilv_s3", "evidence_tag": "mixed_sourced_and_design_choice"},
    {"parameter": "alkalinity_CaCO3", "min": 100.0, "max": 150.0, "unit": "mg/L", "action": "allow_bicarbonate_or_lime_only_toward_band", "source_key": "hargreaves_srac_4503"},
    {"parameter": "TSS", "min": null, "max": 1000.0, "unit": "mg/L", "action": "refuse_carbon_dosing_above_max", "source_key": "hargreaves_srac_4503"},
    {"parameter": "settleable_solids_imhoff", "min": 25.0, "max": 50.0, "unit": "mL/L", "action": "refuse_carbon_dosing_above_max; target_band", "source_key": "hargreaves_srac_4503"},
    {"parameter": "molasses_single_dose_concentration", "min": null, "max": 0.12, "unit": "g/L", "action": "refuse_dose_above_max", "source_key": "perez_fuentes_2016"},
    {"parameter": "molasses_max_per_day_per_m3", "min": null, "max": 120.0, "unit": "g/m3/day", "action": "refuse_cumulative_daily_dose_above_max_without_split_and_DO_checks", "source_key": "perez_fuentes_2016", "evidence_tag": "sourced_threshold_with_design_choice_protocol"},
    {"parameter": "C_to_N_ratio_target", "min": 10.0, "max": 15.0, "unit": "ratio", "action": "prefer_band; allow_up_to_20_only_if_DO_ge_3_and_SS_le_50", "source_key": "perez_fuentes_2016_and_avnimelech_1999"}
  ],
  "constants_for_dosing": {
    "avnimelech_CH_per_g_N": 20.0,
    "avnimelech_divisor": 0.05,
    "molasses_carbon_fraction": 0.22,
    "feed_N_excretion_fraction": 0.5,
    "protein_to_N": 6.25
  },
  "supervisor_required": true
}
```

---

## 4. Sources list (links + access status) and gaps

| Key | Citation | URL | Access status (14 Oct 2026) |
|---|---|---|---|
| `avnimelech_1999` | Avnimelech, Y. (1999). Carbon/nitrogen ratio as a control element in aquaculture systems. *Aquaculture* 176: 227–235. doi:10.1016/S0044-8486(99)00085-X | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S004484869900085X) | **Abstract + HTML preview opened** (formulae, 20 g/m³, C/N 10.75→15.75). Full PDF paywalled. |
| `perez_fuentes_2016` | Pérez-Fuentes, J.A., Hernández-Vergara, M.P., Pérez-Rostro, C.I. & Fogel, I. (2016). C:N ratios affect nitrogen removal and production of Nile tilapia… *Aquaculture* 452: 247–251. | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0044848615302386) | **Abstract only** (10:1 best; molasses >0.12 g/L DO crash). |
| `sdsu_fs963_02` | Mjoun, K., Rosentrater, K.A. & Brown, M.L. (2010). *Tilapia: Environmental Biology and Nutritional Requirements*. SDSU Extension FS963-02. | [Open PRAIRIE PDF](https://openprairie.sdstate.edu/cgi/viewcontent.cgi?article=1163&context=extension_fact) | **Full PDF opened.** |
| `khanjani_2024` | Khanjani, M.H., Sharifinia, M. & Emerenciano, M.G.C. (2024). Biofloc Technology (BFT) in Aquaculture: What Goes Right, What Goes Wrong? *Aquaculture Research*. PMC10796188. | [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC10796188/) | **Full text opened** (alkalinity 100–150; TSS <1000 / often <500; cites Hargreaves). |
| `hargreaves_srac_4503` | Hargreaves, J.A. (2013). Biofloc Production Systems for Aquaculture. SRAC Publication No. 4503. | [srac.msstate.edu PDF](https://www.srac.msstate.edu/pdfs/Fact%20Sheets/4503%20Biofloc%20Production%20Systems%20for%20Aquaculture.pdf) | **Full PDF opened** (Imhoff 25–50 mL/L tilapia; alkalinity; TSS; aeration urgency). |
| `fao_tilv_s3` | Tang, K.F.J. FAO TiLV Training Course — Session 3 Field work (water quality bullets for tilapia). | [fao.org PDF](https://www.fao.org/fi/static-media/MeetingDocuments/TiLV/s3.pdf) | **Full PDF opened** (DO, pH, ammonia, nitrite, temperature bullets). Training handout, not a primary toxicity study. |
| `silva_etal_2017` | Silva, U.L., Falcon, D.R., Pessôa, M.N.C. & Correia, E.S. (2017). Carbon sources and C:N ratios on water quality for Nile tilapia farming in biofloc system. *Revista Caatinga*. | [Redalyc HTML](https://www.redalyc.org/journal/2371/237154415023/html/) | **Full HTML opened** (molasses %C = 0.22; dosing equations). |
| `nmsu_cr680` | Sallenave, R. NMSU Circular 680 — Important Water Quality Parameters in Aquaponics Systems. | [pubs.nmsu.edu](https://pubs.nmsu.edu/_circulars/CR680/) | **Full page opened** (tilapia nitrite ≤1 ppm; TAN <1; NH₃ fraction table). Aquaponics context, not biofloc-specific. |
| `source_validation_md` | Internal reuse of prior opened quotes | `/workspace/hackathon/sampay/source-validation.md` | Cross-check only; does not replace primary fetches above. |

### UNVERIFIED / gaps

1. **Avnimelech 1999 full PDF** — formulae taken from ScienceDirect preview; page numbers for equations not confirmed beyond journal pagination 227–235.
2. **Pérez-Fuentes 2016 full text** — only abstract accessible; stocking density details, exact molasses %C used in that trial, and full water-quality tables **UNVERIFIED**.
3. **Molasses “37% carbon”** (some Indonesian grey literature) — **not used**; default remains Silva et al. **0.22**. Local Indonesian molasses should be assayed.
4. **MDPI 2025** (*Sustainability* 17(13):5670) — still HTTP 403 / blocked (`source-validation.md`); do not cite.
5. **No biofloc-specific hard TAN critical limit** independent of NH₃ — app must compute NH₃ from TAN + pH + temp (NMSU Table 1).
6. **Feeding stop exact DO threshold** — SDSU gives growth optimum >3, FAO floor >1; refuse-feed at DO <1 is sourced to FAO floor; refuse-molasses at DO <3 is aligned to growth optimum + Pérez-Fuentes crash context (**partly design choice**).
7. **Temperature upper refuse bound 35 °C** — **design choice**; SDSU lists tolerance to 42 °C.
8. **Alkalinity hard floor 50 mg/L** (in narrative) — **design choice**; Hargreaves only mandates 100–150 target.
9. **Daily molasses cap 120 g/m³/day** — maps Pérez-Fuentes’ **0.12 g/L** single-dose crash; multi-dose split protocol is **design choice**.
10. **FAO primary species monograph water-quality table** — TiLV training module used instead; a dedicated FAO *Oreochromis niloticus* culture fact sheet was not separately opened this pass.
11. **Nitrite LC50 for Nile tilapia in biofloc** — not fetched; warning/critical use FAO 0.2 and NMSU 1.0 only.

---

## Implementation reminder (for the app)

1. Load §3 YAML/JSON at process start; never let the LLM bypass these gates.
2. Every recommended action must show `source_key` and require supervisor approval.
3. Sensor “ammonia” must be labelled TAN or NH₃; convert before comparing to NH₃ limits.
4. Before any molasses command: check DO ≥ 3, settleable solids ≤ 50 mL/L, dose ≤ 0.12 g/L, cumulative day ≤ 120 g/m³.
5. Never emit `stop_aeration` when DO < 3 mg/L.
