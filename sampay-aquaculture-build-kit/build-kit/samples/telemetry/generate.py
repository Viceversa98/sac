"""SYNTHETIC / SIMULATED telemetry generator for the Sampay demo.
Deterministic (no randomness) so every demo take shows the same numbers.
Times are WIB (UTC+7). Re-run: python3 generate.py"""
import csv, json, math
from datetime import datetime, timedelta, timezone
WIB = timezone(timedelta(hours=7))
start = datetime(2026, 10, 14, 6, 0, tzinfo=WIB)
F = ["ts", "pond_id", "do_mgL", "temp_c", "ph", "tan_mgL", "nh3_mgL", "tds_ppm", "source"]

def pond_a(i, t):
    h = t.hour + t.minute / 60
    hrs_since_18 = (h - 18) % 24  # 0 at 18:00
    if hrs_since_18 <= 10:  # 18:00 -> 04:00 decline from 5.8 to 2.4
        do = 5.8 - 3.4 * (hrs_since_18 / 10)
    elif hrs_since_18 <= 12:  # 04:00 -> 06:00 slow recovery to 3.2
        do = 2.4 + 0.4 * (hrs_since_18 - 10)
    else:  # daytime 06:00 -> 18:00
        do = 5.4 + 0.8 * math.sin(math.pi * (hrs_since_18 - 12) / 6) if hrs_since_18 < 18 else 5.8
    do = min(do, 6.2)
    temp = 27.8 + 0.6 * math.sin(math.pi * (h - 8) / 12)
    ph = 7.6 + 0.15 * math.sin(math.pi * (h - 8) / 12)
    return do, temp, ph, 0.40, 0.020, 610

def pond_b(i, t):
    h = t.hour + t.minute / 60
    do = 5.6 + 0.6 * math.sin(math.pi * (h - 8) / 12)
    temp = 27.5 + 0.5 * math.sin(math.pi * (h - 8) / 12)
    ph = 7.5 + 0.1 * math.sin(math.pi * (h - 8) / 12)
    tan = 0.40 + 0.60 * i / 95          # TAN creeps to 1.00 mg/L
    nh3 = 0.020 + 0.040 * i / 95        # NH3 creeps to 0.060 mg/L (above 0.05 optimum)
    return do, temp, ph, tan, nh3, 640

for name, pid, fn in [("pond_A_do_drop", "A", pond_a), ("pond_B_tan_rise", "B", pond_b)]:
    rows = []
    for i in range(96):
        t = start + timedelta(minutes=15 * i)
        do, temp, ph, tan, nh3, tds = fn(i, t)
        rows.append({"ts": t.isoformat(), "pond_id": pid, "do_mgL": round(do, 2), "temp_c": round(temp, 1),
                     "ph": round(ph, 2), "tan_mgL": round(tan, 2), "nh3_mgL": round(nh3, 3), "tds_ppm": tds,
                     "source": "simulated"})
    with open(f"{name}.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=F); w.writeheader(); w.writerows(rows)
    with open(f"{name}.json", "w") as f:
        json.dump({"_note": "SYNTHETIC / SIMULATED telemetry, ESP32-shaped payloads. Not real pond data.",
                   "pond_id": pid, "readings": rows}, f, indent=1)
    lo = min(rows, key=lambda r: r["do_mgL"])
    below = [r["ts"] for r in rows if r["do_mgL"] <= 3]
    print(name, "DO min", lo["do_mgL"], lo["ts"], "| DO<=3 from", below[:1], "to", below[-1:], "| last", rows[-1])
