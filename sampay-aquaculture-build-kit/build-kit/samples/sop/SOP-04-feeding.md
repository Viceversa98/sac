---
doc_key: SOP-04-feeding
title: Feeding schedule basics
status: SYNTHETIC SOP — farm-policy rules, grounded where stated. Not an official KKP SOP.
citations:
  - Tongsiri et al. (2020). Biofloc Nile tilapia farm cost study, Maejo Int. J. Energy & Environ. Commun.
  - Khanjani, Sharifinia & Emerenciano (2024). "Biofloc Technology (BFT) in Aquaculture: What Goes Right, What Goes Wrong?"
  - Mjoun, Rosentrater & Brown (2010). SDSU Extension FS963-02.
tags: [pakan, feed, feeder, makan, ransum, jadwal]
---
# SOP-04 Feeding schedule basics

## Why it matters
- Feed was **58.34%** of total production cost on a Thai biofloc Nile tilapia farm (Tongsiri et al. 2020). Khanjani et al. (2024) give 40–60% for intensive aquaculture.
- Biofloc microbial protein "can reduce aquafeed consumption by up to 20%" (Khanjani et al. 2024).
- Low DO and NH3 from 0.1 mg/L depress feed intake (SDSU FS963-02), so feed given then is wasted and adds ammonia.

## Rules (farm policy)
- Meals: pagi / siang / sore. The kg per meal comes from the farm's own table or the feed manufacturer. **This SOP gives no feeding-rate percentages** — none are verified in our sources.
- If DO ≤ 3 mg/L or NH3 ≥ 0.1 mg/L at meal time → propose `set_feeder_kg` with a reduced or zero amount and explain why; supervisor approves.
- `set_feeder_kg` must be ≥ 0 and ≤ the pond's `max_feed_kg` if set.
