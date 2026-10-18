import type { SafetyResult, ToolName } from './safety.js';
import { checkAerator, checkFeeder, checkMolasses, flagDo, flagNh3, flagPh, flagTemp } from './safety.js';
import { suggestMolasses } from './molasses.js';
import { DO_TARGET_MIN_MGL, NH3_OPT_MGL } from './thresholds.js';
import type { PondStats } from './stats.js';
import { aeratorArgsSchema, feederArgsSchema, intentSchema, molassesArgsSchema, type Intent } from './schemas.js';

export type PlannedCall = {
  pond_id: string;
  tool_name: ToolName;
  args: Record<string, unknown>;
  safety: SafetyResult;
  status: 'proposed' | 'blocked';
  prompt_id: 'A' | 'C' | 'D';
};

export type PondContext = {
  id: string;
  volume_m3: number;
  max_feed_kg: number | null;
  latest_do: number | null;
  latest_tan: number | null;
  latest_nh3?: number | null;
};

const DEFAULT_AERATOR_MINUTES = 120;

export const isRepairRequest = (message: string): boolean =>
  /\bfix\b|\brepair\b|perbaiki|\bbaiki\b|\bhelp\b|tolong|apa masalah|\bcheck\b/i.test(message);

const isStatusQuestion = (message: string): boolean =>
  /berapa|how(?:'s| is)|what(?:'s| is).*\b(?:do|oxygen|ammonia|tan|status)\b|do sekarang|kondisi|apa kabar/i.test(message);

export const parseIntentLocal = (message: string, langHint?: 'id' | 'en'): Intent => {
  const pondMatch = message.match(/kolam\s*([ab])|pond\s*([ab])/i);
  const pond_id = ((pondMatch?.[1] || pondMatch?.[2] || 'A').toUpperCase()) as 'A' | 'B';
  const lang = langHint ?? (/kolam|molase|berapa|nyalakan|pakan|tambah/i.test(message) ? 'id' : 'en');
  const base = { pond_id, lang, meal: null as Intent['meal'] };

  if (isStatusQuestion(message) && !isRepairRequest(message)) {
    return intentSchema.parse({ ...base, intent: 'status_query', tool: null, amount: null, unit: null });
  }
  if (/molase|molasses/i.test(message)) {
    const match = message.match(/(\d+(?:[.,]\d+)?)\s*g\s*\/\s*l/i) ?? message.match(/(\d+[.,]\d+)/);
    const amount = match ? Number(match[1].replace(',', '.')) : null;
    return intentSchema.parse({
      ...base,
      intent: 'propose_action',
      tool: 'dose_molasses_gL',
      amount,
      unit: 'g/L',
    });
  }
  if (/aerator|aerasi|kincir/i.test(message)) {
    const hours = message.match(/(\d+(?:[.,]\d+)?)\s*(?:jam|hours?)/i);
    const mins = message.match(/(\d+(?:[.,]\d+)?)\s*(?:menit|minutes?|min)\b/i);
    const amount = hours
      ? Math.round(Number(hours[1].replace(',', '.')) * 60)
      : mins
        ? Math.round(Number(mins[1].replace(',', '.')))
        : null;
    return intentSchema.parse({ ...base, intent: 'propose_action', tool: 'start_aerator', amount, unit: 'min' });
  }
  if (/feeder|pakan/i.test(message)) {
    const kg = message.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
    const amount = kg ? Number(kg[1].replace(',', '.')) : null;
    const meal = /siang/i.test(message) ? 'siang' : /sore/i.test(message) ? 'sore' : 'pagi';
    return intentSchema.parse({
      ...base,
      intent: 'propose_action',
      tool: 'set_feeder_kg',
      amount,
      unit: 'kg',
      meal,
    });
  }
  if (isRepairRequest(message)) {
    return intentSchema.parse({ ...base, intent: 'propose_action', tool: null, amount: null, unit: null });
  }
  return intentSchema.parse({ ...base, intent: 'other', tool: null, amount: null, unit: null });
};

export const planFromIntent = (intent: Intent, pond: PondContext): PlannedCall | null => {
  if (intent.intent !== 'propose_action' || !intent.tool) return null;
  const pondId = pond.id;
  if (intent.tool === 'start_aerator') {
    const duration = intent.amount == null ? DEFAULT_AERATOR_MINUTES : Math.round(intent.amount);
    const safety = checkAerator(duration);
    return {
      pond_id: pondId,
      tool_name: 'start_aerator',
      args: aeratorArgsSchema.parse({
        pond_id: pondId,
        duration_min: duration,
        reason: `Aerator request for ${duration} minutes`,
      }),
      safety,
      status: safety.ok ? 'proposed' : 'blocked',
      prompt_id: safety.ok ? 'C' : 'D',
    };
  }
  if (intent.tool === 'set_feeder_kg') {
    if (intent.amount == null) return null;
    const safety = checkFeeder(intent.amount, pond.max_feed_kg);
    const meal = intent.meal ?? 'pagi';
    return {
      pond_id: pondId,
      tool_name: 'set_feeder_kg',
      args: feederArgsSchema.parse({ pond_id: pondId, kg: intent.amount, meal, reason: `Feeder request ${intent.amount} kg (${meal})` }),
      safety,
      status: safety.ok ? 'proposed' : 'blocked',
      prompt_id: safety.ok ? 'C' : 'D',
    };
  }
  const dose = intent.amount == null && pond.latest_tan != null
    ? suggestMolasses(pond.latest_tan, pond.volume_m3)
    : null;
  const gPerL = intent.amount ?? dose?.g_per_L;
  if (gPerL == null) return null;
  const safety = checkMolasses(gPerL, pond.latest_do);
  const kg = dose && intent.amount == null ? dose.kg : Math.round(gPerL * pond.volume_m3 * 100) / 100;
  return {
    pond_id: pondId,
    tool_name: 'dose_molasses_gL',
    args: {
      ...molassesArgsSchema.parse({
        pond_id: pondId,
        g_per_L: gPerL,
        tan_mgL_basis: pond.latest_tan ?? 0,
        reason: dose ? `Node dose for ammonia (TAN) ${pond.latest_tan} mg/L` : `Supervisor requested ${gPerL} g/L`,
      }),
      kg_total: kg,
    },
    safety,
    status: safety.ok ? 'proposed' : 'blocked',
    prompt_id: safety.ok ? 'C' : 'D',
  };
};

export const planRepair = (pond: PondContext): PlannedCall[] => {
  const calls: PlannedCall[] = [];
  if (pond.latest_do != null && pond.latest_do <= DO_TARGET_MIN_MGL) {
    const safety = checkAerator(DEFAULT_AERATOR_MINUTES);
    calls.push({
      pond_id: pond.id,
      tool_name: 'start_aerator',
      args: aeratorArgsSchema.parse({
        pond_id: pond.id,
        duration_min: DEFAULT_AERATOR_MINUTES,
        reason: `Oxygen ${pond.latest_do} mg/L is at or below the 3 mg/L SOP line`,
      }),
      safety,
      status: safety.ok ? 'proposed' : 'blocked',
      prompt_id: safety.ok ? 'C' : 'D',
    });
  }
  if (pond.latest_tan != null && pond.latest_tan > NH3_OPT_MGL) {
    const dose = suggestMolasses(pond.latest_tan, pond.volume_m3);
    const gPerL = dose.capped ? dose.unrounded_g_per_L : dose.g_per_L;
    const safety = checkMolasses(gPerL, pond.latest_do);
    calls.push({
      pond_id: pond.id,
      tool_name: 'dose_molasses_gL',
      args: {
        ...molassesArgsSchema.parse({
          pond_id: pond.id,
          g_per_L: gPerL,
          tan_mgL_basis: pond.latest_tan,
          reason: dose.capped
            ? `Refused: ${dose.unrounded_g_per_L.toFixed(3)} g/L is above 0.12 g/L for ammonia (TAN) ${pond.latest_tan} mg/L`
            : `Node dose for ammonia (TAN) ${pond.latest_tan} mg/L in ${pond.volume_m3} m3`,
        }),
        kg_total: dose.kg,
      },
      safety,
      status: safety.ok ? 'proposed' : 'blocked',
      prompt_id: safety.ok ? 'C' : 'D',
    });
  }
  return calls;
};

export const pendingKolamProposal = (pond: PondContext): PlannedCall => {
  const ammoniaHigh = pond.latest_nh3 != null && pond.latest_nh3 >= NH3_OPT_MGL;
  if (ammoniaHigh && pond.latest_tan != null && pond.latest_tan > 0) {
    const dose = suggestMolasses(pond.latest_tan, pond.volume_m3);
    if (!dose.capped) {
      const safety = checkMolasses(dose.g_per_L, pond.latest_do);
      if (safety.ok) {
        return {
          pond_id: pond.id,
          tool_name: 'dose_molasses_gL',
          args: {
            ...molassesArgsSchema.parse({
              pond_id: pond.id,
              g_per_L: dose.g_per_L,
              tan_mgL_basis: pond.latest_tan,
              reason: `Node dose for ammonia (TAN) ${pond.latest_tan} mg/L in ${pond.volume_m3} m3`,
            }),
            kg_total: dose.kg,
          },
          safety,
          status: 'proposed',
          prompt_id: 'C',
        };
      }
    }
  }
  const safety = checkAerator(DEFAULT_AERATOR_MINUTES);
  return {
    pond_id: pond.id,
    tool_name: 'start_aerator',
    args: aeratorArgsSchema.parse({
      pond_id: pond.id,
      duration_min: DEFAULT_AERATOR_MINUTES,
      reason: 'Seeded so the approval queue is not empty',
    }),
    safety,
    status: safety.ok ? 'proposed' : 'blocked',
    prompt_id: 'C',
  };
};

export const blockedMolassesProposal = (pondId: string, latestDo: number | null): PlannedCall => {
  const gPerL = 0.2;
  const safety = checkMolasses(gPerL, latestDo);
  return {
    pond_id: pondId,
    tool_name: 'dose_molasses_gL',
    args: {
      ...molassesArgsSchema.parse({
        pond_id: pondId,
        g_per_L: gPerL,
        tan_mgL_basis: 0,
        reason: 'Seeded 0.20 g/L refusal',
      }),
      kg_total: Math.round(gPerL * 30 * 100) / 100,
    },
    safety,
    status: 'blocked',
    prompt_id: 'D',
  };
};

// WHY 120 minutes: SOP-02's demo default, inside the 15–240 minute block.
export const planBriefingActions = (
  pond: PondContext,
  pondStats: PondStats,
): PlannedCall[] => {
  const calls: PlannedCall[] = [];
  if (pondStats.do.min != null && pondStats.do.min <= 3) {
    const safety = checkAerator(DEFAULT_AERATOR_MINUTES);
    calls.push({
      pond_id: pond.id,
      tool_name: 'start_aerator',
      args: aeratorArgsSchema.parse({
        pond_id: pond.id,
        duration_min: DEFAULT_AERATOR_MINUTES,
        reason: `DO minimum ${pondStats.do.min} mg/L at ${pondStats.do.min_at_wib} WIB`,
      }),
      safety,
      status: safety.ok ? 'proposed' : 'blocked',
      prompt_id: 'A',
    });
  }
  const nh3 = pondStats.nh3.last;
  const tan = pondStats.tan.last;
  if (nh3 != null && nh3 >= NH3_OPT_MGL && tan != null && tan > 0) {
    const dose = suggestMolasses(tan, pond.volume_m3);
    const safety = dose.capped
      ? checkMolasses(dose.unrounded_g_per_L, pondStats.do.last)
      : checkMolasses(dose.g_per_L, pondStats.do.last);
    calls.push({
      pond_id: pond.id,
      tool_name: 'dose_molasses_gL',
      args: {
        ...molassesArgsSchema.parse({
          pond_id: pond.id,
          g_per_L: dose.capped ? dose.unrounded_g_per_L : dose.g_per_L,
          tan_mgL_basis: tan,
          reason: dose.capped
            ? `Refused: ${(dose.unrounded_g_per_L).toFixed(3)} g/L is above 0.12 g/L for ammonia (TAN) ${tan} mg/L`
            : `Node dose for ammonia (TAN) ${tan} mg/L in ${pond.volume_m3} m3`,
        }),
        kg_total: dose.kg,
      },
      safety,
      status: safety.ok ? 'proposed' : 'blocked',
      prompt_id: safety.ok ? 'A' : 'D',
    });
  }
  return calls;
};

export type Fact = {
  pond_id: string;
  param: string;
  value: number | string;
  limit: string;
  status: 'OK' | 'PERHATIAN' | 'BAHAYA';
  citation: string;
  time_wib?: string | null;
};

export const factsForPond = (pondId: string, pondStats: PondStats): Fact[] => {
  const facts: Fact[] = [];
  if (pondStats.do.min != null) {
    facts.push({
      pond_id: pondId,
      param: 'do_mgL_min',
      value: pondStats.do.min,
      time_wib: pondStats.do.min_at_wib,
      limit: 'DO > 3 mg/L',
      status: flagDo(pondStats.do.min),
      citation: 'SDSU FS963-02 (Mjoun et al. 2010)',
    });
  }
  if (pondStats.do.last != null) {
    facts.push({
      pond_id: pondId,
      param: 'do_mgL_last',
      value: pondStats.do.last,
      limit: 'DO > 3 mg/L',
      status: flagDo(pondStats.do.last),
      citation: 'SDSU FS963-02 (Mjoun et al. 2010)',
    });
  }
  if (pondStats.ph.min != null && pondStats.ph.max != null) {
    const status = flagPh(pondStats.ph.min) === 'OK' && flagPh(pondStats.ph.max) === 'OK' ? 'OK' : 'PERHATIAN';
    facts.push({
      pond_id: pondId,
      param: 'ph_range',
      value: `${pondStats.ph.min}-${pondStats.ph.max}`,
      limit: 'pH 7–9',
      status,
      citation: 'SDSU FS963-02 (Mjoun et al. 2010)',
    });
  }
  if (pondStats.temp.min != null && pondStats.temp.max != null) {
    const status = flagTemp(pondStats.temp.min) === 'OK' && flagTemp(pondStats.temp.max) === 'OK' ? 'OK' : 'PERHATIAN';
    facts.push({
      pond_id: pondId,
      param: 'temp_c_range',
      value: `${pondStats.temp.min}-${pondStats.temp.max}`,
      limit: '22–29 °C',
      status,
      citation: 'SDSU FS963-02 (Mjoun et al. 2010)',
    });
  }
  if (pondStats.tan.last != null) {
    const rising = pondStats.tan.first != null && pondStats.tan.last > pondStats.tan.first;
    facts.push({
      pond_id: pondId,
      param: 'tan_mgL_last',
      value: pondStats.tan.last,
      limit: 'TAN is not a hard block; state TAN, not NH3',
      status: rising ? 'PERHATIAN' : 'OK',
      citation: 'SDSU FS963-02 (Mjoun et al. 2010)',
    });
  }
  if (pondStats.nh3.last != null) {
    facts.push({
      pond_id: pondId,
      param: 'nh3_mgL_last',
      value: pondStats.nh3.last,
      limit: 'un-ionised NH3 < 0.05 mg/L optimum; growth depressed from 0.1',
      status: flagNh3(pondStats.nh3.last),
      citation: 'SDSU FS963-02 (Mjoun et al. 2010)',
    });
  }
  return facts;
};

const CAPTION_LABEL: Record<string, string> = {
  do_mgL_min: 'lowest DO',
  do_mgL_last: 'latest DO',
  ph_range: 'pH',
  temp_c_range: 'temperature',
  tan_mgL_last: 'TAN',
  nh3_mgL_last: 'NH3',
};

const captionUnit = (param: string): string => {
  if (param.startsWith('do_') || param.startsWith('tan_') || param.startsWith('nh3_')) return ' mg/L';
  if (param === 'temp_c_range') return ' °C';
  return '';
};

export const englishCaption = (facts: Fact[]): string => {
  const parts = ['Simulated data.'];
  for (const pondId of ['A', 'B']) {
    const pondFacts = facts.filter((fact) => fact.pond_id === pondId);
    if (pondFacts.length === 0) continue;
    const bits = pondFacts.map((fact) => {
      const label = CAPTION_LABEL[fact.param] ?? fact.param;
      const when = fact.time_wib ? ` at ${fact.time_wib} WIB` : '';
      return `${label} ${fact.value}${captionUnit(fact.param)}${when} (${fact.status})`;
    });
    parts.push(`Pond ${pondId}: ${bits.join('; ')}.`);
  }
  return parts.join('\n');
};
