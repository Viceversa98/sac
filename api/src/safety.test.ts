import { describe, expect, it } from 'vitest';
import { checkAerator, checkFeeder, checkMolasses, checkTool, flagNh3, flagPh, flagTemp } from './safety.js';

const pond = { latestDoMgL: 5.27, maxFeedKg: 3 };

describe('safety blocks', () => {
  it('blocks molasses above 0.12 g/L before it checks DO', () => {
    const result = checkMolasses(0.2, 2.4);
    expect(result.ok).toBe(false);
    expect(result.rule).toBe('MOLASSES_MAX_GL');
  });

  it('blocks molasses at or below 0.12 g/L when latest DO is at or below 3', () => {
    expect(checkMolasses(0.1, 3).rule).toBe('MOLASSES_LOW_DO');
    expect(checkMolasses(0.12, 3).ok).toBe(false);
    expect(checkMolasses(0.1, null).rule).toBe('MOLASSES_LOW_DO');
  });

  it('allows 0.12 g/L when DO is above 3', () => {
    expect(checkMolasses(0.12, 3.1).ok).toBe(true);
    expect(checkMolasses(0.1, 5.27).ok).toBe(true);
  });

  it('blocks aerator durations outside 15–240 minutes', () => {
    expect(checkAerator(14).ok).toBe(false);
    expect(checkAerator(241).ok).toBe(false);
    expect(checkAerator(600).rule).toBe('AERATOR_DURATION');
    expect(checkAerator(15).ok).toBe(true);
    expect(checkAerator(120).ok).toBe(true);
    expect(checkAerator(240).ok).toBe(true);
  });

  it('blocks feeder kg above the pond cap and allows the cap itself', () => {
    expect(checkFeeder(5, 3).rule).toBe('FEEDER_KG');
    expect(checkFeeder(5, 3).ok).toBe(false);
    expect(checkFeeder(3, 3).ok).toBe(true);
    expect(checkFeeder(-1, 3).ok).toBe(false);
    expect(checkFeeder(1, null).ok).toBe(true);
  });

  it('treats pH, temperature, and NH3 as flags', () => {
    expect(flagPh(6.4)).toBe('PERHATIAN');
    expect(flagPh(7.5)).toBe('OK');
    expect(flagTemp(15)).toBe('PERHATIAN');
    expect(flagTemp(28)).toBe('OK');
    expect(flagNh3(0.02)).toBe('OK');
    expect(flagNh3(0.06)).toBe('PERHATIAN');
    expect(flagNh3(0.1)).toBe('BAHAYA');
    expect(checkTool('dose_molasses_gL', { g_per_L: 0.05 }, pond).ok).toBe(true);
  });
});
