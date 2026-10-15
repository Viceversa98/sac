import { describe, expect, it } from 'vitest';
import { suggestMolasses } from './molasses.js';

describe('suggestMolasses', () => {
  it('displays 0.045 g/L and 1.36 kg for 1 mg/L TAN in 30 m3', () => {
    const dose = suggestMolasses(1, 30);
    expect(dose.g_per_L).toBe(0.045);
    expect(dose.kg).toBe(1.36);
    expect(dose.unrounded_grams).toBeCloseTo((20 / 0.44) * 30, 6);
    expect(dose.capped).toBe(false);
    // Display kg is rounded from the unrounded gram total. 0.045 * 30 is a different number.
    expect(dose.g_per_L * dose.volume_m3).not.toBe(dose.kg);
  });

  it('caps the displayed dose at 0.12 g/L', () => {
    const dose = suggestMolasses(3, 30);
    expect(dose.capped).toBe(true);
    expect(dose.g_per_L).toBe(0.12);
    expect(dose.kg).toBe(3.6);
  });
});
