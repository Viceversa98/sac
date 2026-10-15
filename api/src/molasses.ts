import { CARB_G_PER_G_TAN, MOLASSES_CARB_FRACTION, MOLASSES_MAX_GL } from './thresholds.js';

export type MolassesDose = {
  tan_mgL: number;
  volume_m3: number;
  /** Display g/L, 3 decimal places, after the 0.12 cap. */
  g_per_L: number;
  /** Display kg, 2 decimal places, rounded from the unrounded gram total. */
  kg: number;
  unrounded_g_per_L: number;
  unrounded_kg: number;
  unrounded_grams: number;
  capped: boolean;
};

const roundDisplay = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

// WHY: kg is rounded from (20/0.44)*tan*volume grams. Rounding g/L first (0.045*30) is 1.35, not 1.36.
export const suggestMolasses = (tanMgL: number, volumeM3: number): MolassesDose => {
  if (!(tanMgL >= 0) || !(volumeM3 > 0)) {
    throw new Error('suggestMolasses needs tanMgL >= 0 and volumeM3 > 0');
  }
  const unroundedGrams = (CARB_G_PER_G_TAN / MOLASSES_CARB_FRACTION) * tanMgL * volumeM3;
  const rawGPerL = unroundedGrams / volumeM3 / 1000;
  const capped = rawGPerL > MOLASSES_MAX_GL;
  const unroundedGPerL = capped ? MOLASSES_MAX_GL : rawGPerL;
  const grams = unroundedGPerL * volumeM3 * 1000;
  const unroundedKg = grams / 1000;
  return {
    tan_mgL: tanMgL,
    volume_m3: volumeM3,
    g_per_L: roundDisplay(unroundedGPerL, 3),
    kg: roundDisplay(unroundedKg, 2),
    unrounded_g_per_L: unroundedGPerL,
    unrounded_kg: unroundedKg,
    unrounded_grams: grams,
    capped,
  };
};
