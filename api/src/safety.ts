import {
  AERATOR_DURATION_MAX,
  AERATOR_DURATION_MIN,
  DO_TARGET_MIN_MGL,
  MOLASSES_BLOCK_IF_DO_BELOW_MGL,
  MOLASSES_MAX_GL,
  NH3_GROWTH_DEPRESS_MGL,
  NH3_OPT_MGL,
  PH_MAX,
  PH_MIN,
  SOURCE_AERATOR_POLICY,
  SOURCE_DO,
  SOURCE_FEEDER_POLICY,
  SOURCE_MOLASSES_MAX,
  SOURCE_NH3,
  TEMP_MAX_C,
  TEMP_MIN_C,
} from './thresholds.js';

export type SafetyResult = {
  ok: boolean;
  rule: string;
  detail: string;
  citation: string;
};

export type FlagStatus = 'OK' | 'PERHATIAN' | 'BAHAYA';

export type ToolName = 'start_aerator' | 'set_feeder_kg' | 'dose_molasses_gL';

const pass = (rule: string, detail: string, citation: string): SafetyResult => ({
  ok: true,
  rule,
  detail,
  citation,
});

const block = (rule: string, detail: string, citation: string): SafetyResult => ({
  ok: false,
  rule,
  detail,
  citation,
});

// WHY: g/L is checked before DO so a 0.2 g/L request is MOLASSES_MAX_GL even when DO is also low.
export const checkMolasses = (gPerL: number, latestDoMgL: number | null): SafetyResult => {
  if (!(gPerL > 0) || Number.isNaN(gPerL)) {
    return block('MOLASSES_MAX_GL', 'The dose must be a number greater than 0', SOURCE_MOLASSES_MAX);
  }
  if (gPerL > MOLASSES_MAX_GL) {
    return block(
      'MOLASSES_MAX_GL',
      `${gPerL} g/L is above ${MOLASSES_MAX_GL} g/L`,
      SOURCE_MOLASSES_MAX,
    );
  }
  if (latestDoMgL == null || latestDoMgL <= MOLASSES_BLOCK_IF_DO_BELOW_MGL) {
    return block(
      'MOLASSES_LOW_DO',
      `latest DO ${latestDoMgL ?? 'missing'} mg/L is at or below ${MOLASSES_BLOCK_IF_DO_BELOW_MGL} mg/L`,
      `${SOURCE_MOLASSES_MAX}; ${SOURCE_DO}`,
    );
  }
  return pass('MOLASSES_MAX_GL', `${gPerL} g/L is within ${MOLASSES_MAX_GL} g/L and DO is above 3 mg/L`, SOURCE_MOLASSES_MAX);
};

export const checkAerator = (durationMin: number): SafetyResult => {
  if (!Number.isInteger(durationMin) || durationMin < AERATOR_DURATION_MIN || durationMin > AERATOR_DURATION_MAX) {
    return block(
      'AERATOR_DURATION',
      `duration_min ${durationMin} is outside ${AERATOR_DURATION_MIN}–${AERATOR_DURATION_MAX}`,
      SOURCE_AERATOR_POLICY,
    );
  }
  return pass('AERATOR_DURATION', `duration_min ${durationMin} is inside 15–240`, SOURCE_AERATOR_POLICY);
};

export const checkFeeder = (kg: number, maxFeedKg: number | null): SafetyResult => {
  if (!(kg >= 0) || Number.isNaN(kg)) {
    return block('FEEDER_KG', `kg ${kg} is below 0`, SOURCE_FEEDER_POLICY);
  }
  if (maxFeedKg != null && kg > maxFeedKg) {
    return block('FEEDER_KG', `kg ${kg} is above ponds.max_feed_kg ${maxFeedKg}`, SOURCE_FEEDER_POLICY);
  }
  return pass('FEEDER_KG', `kg ${kg} is within the pond cap`, SOURCE_FEEDER_POLICY);
};

export const checkTool = (
  tool: ToolName,
  args: { g_per_L?: number; duration_min?: number; kg?: number },
  ctx: { latestDoMgL: number | null; maxFeedKg: number | null },
): SafetyResult => {
  if (tool === 'dose_molasses_gL') return checkMolasses(args.g_per_L ?? Number.NaN, ctx.latestDoMgL);
  if (tool === 'start_aerator') return checkAerator(args.duration_min ?? Number.NaN);
  return checkFeeder(args.kg ?? Number.NaN, ctx.maxFeedKg);
};

export const flagPh = (ph: number): FlagStatus => (ph < PH_MIN || ph > PH_MAX ? 'PERHATIAN' : 'OK');

export const flagTemp = (tempC: number): FlagStatus =>
  tempC < TEMP_MIN_C || tempC > TEMP_MAX_C ? 'PERHATIAN' : 'OK';

export const flagNh3 = (nh3MgL: number): FlagStatus => {
  if (nh3MgL >= NH3_GROWTH_DEPRESS_MGL) return 'BAHAYA';
  if (nh3MgL >= NH3_OPT_MGL) return 'PERHATIAN';
  return 'OK';
};

export const flagDo = (doMgL: number): FlagStatus => (doMgL <= DO_TARGET_MIN_MGL ? 'BAHAYA' : 'OK');
