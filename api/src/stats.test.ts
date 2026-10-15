import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTelemetryCsv } from './csv.js';
import { telemetryFile } from './paths.js';
import { formatWib, stats, withinHours } from './stats.js';

describe('replay stats', () => {
  const pondA = parseTelemetryCsv(readFileSync(telemetryFile('pond_A_do_drop.csv'), 'utf8'));
  const pondB = parseTelemetryCsv(readFileSync(telemetryFile('pond_B_tan_rise.csv'), 'utf8'));

  it('keeps the 04:00 WIB instant when the offset is converted', () => {
    const minRow = pondA.find((row) => row.do_mgL === 2.4);
    expect(minRow).toBeTruthy();
    expect(formatWib(minRow!.ts)).toBe('2026-10-15 04:00');
  });

  it('reports pond A DO min 2.4 at 2026-10-15 04:00 WIB inside a 24 h window', () => {
    const window = withinHours(pondA, 24);
    const summary = stats(window);
    expect(window.length).toBe(pondA.length);
    expect(summary.do.min).toBe(2.4);
    expect(summary.do.min_at_wib).toBe('2026-10-15 04:00');
    expect(summary.do.last).toBe(3.1);
  });

  it('reports pond B TAN 1.0, NH3 0.06, and DO min 5', () => {
    const summary = stats(withinHours(pondB, 24));
    expect(summary.do.min).toBe(5);
    expect(summary.tan.last).toBe(1);
    expect(summary.nh3.last).toBe(0.06);
  });
});
