---
doc_key: SOP-01-cn-molasses
title: C/N ratio and molasses dosing (biofloc Nile tilapia)
status: SYNTHETIC SOP — summary written for the demo, grounded in the papers below. Not an official KKP SOP.
citations:
  - Avnimelech, Y. (1999). "Carbon/nitrogen ratio as a control element in aquaculture systems." Aquaculture 176: 227–235.
  - Pérez-Fuentes et al. (2016). Molasses C:N 10:1–20:1 trial on Nile tilapia biofloc. Aquaculture 452.
tags: [molasses, molase, karbon, C/N, TAN, amonia, dosing]
---
# SOP-01 C/N ratio and molasses dosing

## Why
Bacteria in biofloc take up ammonia when they have enough carbon. Adding carbohydrate (molasses) raises the C/N ratio so TAN is converted to microbial protein.

## Calculation rule (Avnimelech 1999)
- About **20 g carbohydrate per m³** is needed to reduce TAN by **1 ppm N (1 g N/m³)**.
- Worked example in the paper: raise the C/N of a 30% protein feed from **10.75 to 15.75**.
- The co-pilot computes: `molasses g/m³ = (20 × TAN to remove (mg/L)) / 0.44`; `g/L = g/m³ ÷ 1000`. Example (derived from sop-thresholds.md): TAN 1.0 mg/L → 45.5 g/m³ = 0.045 g/L; in a 30 m³ tank = 1.36 kg.
- Molasses carbohydrate fraction is **0.44** (derived: 0.22 carbon fraction from Silva et al. 2017 ÷ 0.50 carbohydrate carbon from Avnimelech 1999). Source: derived from sop-thresholds.md v-final.

## C:N range (Pérez-Fuentes et al. 2016)
- Molasses at C:N 10:1 to 20:1 was tested on Nile tilapia; **10:1** gave good survival and growth with no water exchange. Avnimelech (1999) is cited for 15:1–20:1.

## HARD LIMITS
- **Never dose molasses above 0.12 g/L.** In Pérez-Fuentes et al. (2016), molasses > 0.12 g/L dropped dissolved oxygen from 3.2 to 1–1.5 mg/L.
- Farm policy: **no molasses while DO ≤ 3 mg/L.** Run aeration first (see SOP-02).
- Every dose needs supervisor approval.
