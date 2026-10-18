import type { Fact } from './proposals.js';
import type { SafetyResult } from './safety.js';

export const promptA = (_lang: 'id' | 'en', statsJson: unknown, sopJson: unknown, dosesJson: unknown): string => `You are Sampay, a biofloc Nile tilapia co-pilot for a pond supervisor.
Write a morning briefing in English. Max 120 words.
Use ONLY the numbers in TELEMETRY_STATS and the limits in SOP_CONTEXT. Do not compute new chemistry.
Molasses grams are already computed in PRECOMPUTED_DOSES. If you call dose_molasses_gL, copy g_per_L and tan_mgL_basis from PRECOMPUTED_DOSES. Never multiply, divide, or round a dose yourself.
For each pond: one line status (OK / PERHATIAN / BAHAYA), the out-of-range parameters with value and time (WIB), and the SOP limit with its citation in [brackets].
If an action is warranted, call the matching function (do not describe a dose without calling the function).
Say that data is SIMULATED.
Return JSON: {briefing: string, facts: [{pond_id, param, value, limit, status, citation}]}

TELEMETRY_STATS:
${JSON.stringify(statsJson)}

SOP_CONTEXT:
${JSON.stringify(sopJson)}

PRECOMPUTED_DOSES:
${JSON.stringify(dosesJson)}`;

export const promptB = (message: string): string => `Classify the supervisor message into one intent and extract slots. Message may be Bahasa Indonesia, English or mixed.
Intents: status_query | propose_action | explain_sop | other.
Slots: pond_id ('A','B'), tool ('start_aerator'|'set_feeder_kg'|'dose_molasses_gL'|null), amount (number|null), unit ('g/L'|'kg'|'min'|null), meal ('pagi'|'siang'|'sore'|null), lang ('id'|'en').
A named device wins: aerator/kincir → start_aerator, molase/molasses → dose_molasses_gL, pakan/feeder → set_feeder_kg.
If they ask to fix, repair, help, check, or perbaiki a pond without naming a device, return propose_action with tool null. The server chooses the tool from the latest reading.
If they only ask how the pond is, return status_query and tool null.
Decimal comma "0,2" means 0.2. Do not calculate a molasses dose. Return JSON only.
Message: ${message}`;

export const promptC = (intentJson: unknown, telemetryJson: unknown, sopJson: unknown, nodeArgs: unknown): string => `Reply in English. Given INTENT, latest TELEMETRY for the pond, and SOP_CONTEXT chunks (each with doc_key and citation),
call exactly one function if an action is justified, else none.
The numeric arguments are already decided in NODE_ARGS. Copy them. Do not do dose arithmetic.
Your reason must quote the SOP limit and cite the chunk (doc_key + paper title/year).
Before calling, check: molasses g_per_L ≤ 0.12 and DO > 3 mg/L; aerator if DO ≤ 3 mg/L.
If your own check fails, do NOT call the function; reply with refuse=true and the rule.
Return JSON: {refuse: bool, rule?: string, explanation: string, citations: [...]}

INTENT:
${JSON.stringify(intentJson)}

TELEMETRY:
${JSON.stringify(telemetryJson)}

SOP_CONTEXT:
${JSON.stringify(sopJson)}

NODE_ARGS:
${JSON.stringify(nodeArgs)}`;

export const promptD = (_lang: 'id' | 'en', safety: SafetyResult): string => `The requested action was BLOCKED by a hard safety rule: ${safety.rule} (${safety.detail}). Source: ${safety.citation}.
In English, in 60 words or fewer, tell the supervisor it was blocked, why (quote the number and source),
and the safe alternative (e.g. run the aerator first; dose ≤ 0.12 g/L only after DO > 3 mg/L).
Never offer a way to bypass the rule.`;

const overviewWord = (fact: Fact): string => {
  const value = Number(fact.value);
  if (fact.param.startsWith('do_')) return value < 4.5 ? 'Low' : 'In range';
  if (fact.param.startsWith('tan_') || fact.param.startsWith('nh3_')) return value > 0.05 ? 'High' : 'In range';
  return fact.status === 'OK' ? 'In range' : 'Check';
};

const briefingLabel = (param: string): string => {
  if (param.startsWith('do_')) return 'oxygen';
  if (param.startsWith('tan_')) return 'ammonia';
  if (param.startsWith('nh3_')) return 'ammonia (NH3)';
  if (param === 'ph_range') return 'pH';
  if (param === 'temp_c_range') return 'temperature';
  return param;
};

export const fallbackBriefing = (_lang: 'id' | 'en', facts: Fact[]): string => {
  const lines = ['Morning briefing. These simulated readings use the same bands as the Overview.'];
  for (const pondId of ['A', 'B']) {
    const pondFacts = facts.filter((fact) => fact.pond_id === pondId);
    if (pondFacts.length === 0) continue;
    const bits = pondFacts.map((fact) => {
      const when = fact.time_wib ? ` at ${fact.time_wib} WIB` : '';
      const unit = fact.param.startsWith('do_') || fact.param.startsWith('tan_') || fact.param.startsWith('nh3_')
        ? ' mg/L'
        : fact.param === 'temp_c_range'
          ? ' °C'
          : '';
      return `${briefingLabel(fact.param)} ${fact.value}${unit}${when}, ${overviewWord(fact)}`;
    });
    lines.push(`Pond ${pondId}: ${bits.join('; ')}.`);
  }
  lines.push('Oxygen below 4.5 mg/L is the Overview watch band, not an SOP limit. The sourced aerator line is 3 mg/L. Critical is 1.0 mg/L.');
  lines.push('Source: SOP-01 (Avnimelech 1999).');
  return lines.join('\n');
};

export const fallbackRefusal = (_lang: 'id' | 'en', safety: SafetyResult): string => {
  const detail = safety.detail.replaceAll('≤', 'at or below').replaceAll('≥', 'at or above');
  return `Refused. ${detail}. Source: ${safety.citation}. Molasses stays at or below 0.12 g/L, and only after oxygen is above 3 mg/L. This rule cannot be bypassed. Data is simulated.`;
};

export const fallbackProposal = (safety: SafetyResult): string =>
  `Proposed under ${safety.rule}. ${safety.detail}. Source: ${safety.citation}. Nothing is sent to hardware; a supervisor must approve. Data is simulated.`;
