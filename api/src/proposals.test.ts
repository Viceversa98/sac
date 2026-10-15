import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTelemetryCsv } from './csv.js';
import { telemetryFile } from './paths.js';
import { parseIntentLocal, planBriefingActions, planFromIntent, type PondContext } from './proposals.js';
import { stats, withinHours } from './stats.js';

const pond = (id: 'A' | 'B', latestDo: number, latestTan: number): PondContext => ({
  id,
  volume_m3: 30,
  max_feed_kg: 3,
  latest_do: latestDo,
  latest_tan: latestTan,
});

describe('chat decisions', () => {
  it('parses the demo phrases without calling Gemini', () => {
    expect(parseIntentLocal('tambah molase 0,2 g/L di kolam A').amount).toBe(0.2);
    expect(parseIntentLocal('nyalakan aerator kolam A 2 jam').amount).toBe(120);
    expect(parseIntentLocal('run aerator pond A for 600 minutes').amount).toBe(600);
    expect(parseIntentLocal('berapa DO kolam A sekarang?').intent).toBe('status_query');
  });

  it('blocks 0.2 g/L, low-DO 0.1 g/L, 600 minutes, and 5 kg', () => {
    const molassesHigh = planFromIntent(parseIntentLocal('tambah molase 0,2 g/L di kolam A'), pond('A', 5.5, 0.4));
    expect(molassesHigh?.status).toBe('blocked');
    expect(molassesHigh?.safety.rule).toBe('MOLASSES_MAX_GL');
    expect(molassesHigh?.args.g_per_L).toBe(0.2);

    const lowDo = planFromIntent(parseIntentLocal('dose 0.1 g/L molasses in pond A'), pond('A', 2.4, 0.4));
    expect(lowDo?.status).toBe('blocked');
    expect(lowDo?.safety.rule).toBe('MOLASSES_LOW_DO');

    const allowed = planFromIntent(parseIntentLocal('dose 0.1 g/L molasses in pond B'), pond('B', 5.27, 1));
    expect(allowed?.status).toBe('proposed');
    expect(allowed?.args.g_per_L).toBe(0.1);

    const aerator = planFromIntent(parseIntentLocal('nyalakan aerator kolam A 2 jam'), pond('A', 2.4, 0.4));
    expect(aerator?.status).toBe('proposed');
    expect(aerator?.args.duration_min).toBe(120);

    const longRun = planFromIntent(parseIntentLocal('run aerator pond A for 600 minutes'), pond('A', 2.4, 0.4));
    expect(longRun?.status).toBe('blocked');
    expect(longRun?.args.duration_min).toBe(600);

    const feeder = planFromIntent(parseIntentLocal('set feeder pond A to 5 kg pagi'), pond('A', 3.1, 0.4));
    expect(feeder?.status).toBe('blocked');
    expect(feeder?.args.kg).toBe(5);

    expect(planFromIntent(parseIntentLocal('berapa DO kolam A sekarang?'), pond('A', 3.1, 0.4))).toBeNull();
  });
});

describe('briefing actions', () => {
  const pondA = parseTelemetryCsv(readFileSync(telemetryFile('pond_A_do_drop.csv'), 'utf8'));
  const pondB = parseTelemetryCsv(readFileSync(telemetryFile('pond_B_tan_rise.csv'), 'utf8'));

  it('proposes aeration for pond A and the Node molasses dose for pond B', () => {
    const statsA = stats(withinHours(pondA, 24));
    const actionsA = planBriefingActions(
      { id: 'A', volume_m3: 30, max_feed_kg: 3, latest_do: statsA.do.last, latest_tan: statsA.tan.last },
      statsA,
    );
    expect(actionsA.map((call) => call.tool_name)).toEqual(['start_aerator']);
    expect(actionsA[0]?.args.duration_min).toBe(120);
    expect(actionsA[0]?.status).toBe('proposed');

    const statsB = stats(withinHours(pondB, 24));
    const actionsB = planBriefingActions(
      { id: 'B', volume_m3: 30, max_feed_kg: 3, latest_do: statsB.do.last, latest_tan: statsB.tan.last },
      statsB,
    );
    expect(actionsB.map((call) => call.tool_name)).toEqual(['dose_molasses_gL']);
    expect(actionsB[0]?.args.g_per_L).toBe(0.045);
    expect(actionsB[0]?.args.kg_total).toBe(1.36);
    expect(actionsB[0]?.status).toBe('proposed');
  });
});
