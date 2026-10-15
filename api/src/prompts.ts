import type { Fact } from './proposals.js';
import type { SafetyResult } from './safety.js';

export const promptA = (lang: 'id' | 'en', statsJson: unknown, sopJson: unknown, dosesJson: unknown): string => `You are Sampay, a biofloc Nile tilapia co-pilot for a pond supervisor.
Write a morning briefing in ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}. Max 120 words.
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
Decimal comma "0,2" means 0.2. Do not calculate a molasses dose. Return JSON only.
Message: ${message}`;

export const promptC = (intentJson: unknown, telemetryJson: unknown, sopJson: unknown, nodeArgs: unknown): string => `Given INTENT, latest TELEMETRY for the pond, and SOP_CONTEXT chunks (each with doc_key and citation),
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

export const promptD = (lang: 'id' | 'en', safety: SafetyResult): string => `The requested action was BLOCKED by a hard safety rule: ${safety.rule} (${safety.detail}). Source: ${safety.citation}.
In ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}, in ≤ 60 words, tell the supervisor it was blocked, why (quote the number and source),
and the safe alternative (e.g. run the aerator first; dose ≤ 0.12 g/L only after DO > 3 mg/L).
Never offer a way to bypass the rule.`;

export const fallbackBriefing = (lang: 'id' | 'en', facts: Fact[]): string => {
  const lines = facts.map((fact) => {
    const when = fact.time_wib ? ` at ${fact.time_wib} WIB` : '';
    return `${fact.pond_id} ${fact.param} ${fact.value}${when} ${fact.status} [${fact.citation}]`;
  });
  const lead = lang === 'id'
    ? 'Data SIMULATED. Ringkasan dari angka yang dihitung di Node, bukan oleh model.'
    : 'SIMULATED data. Summary uses numbers computed in Node, not by the model.';
  return [lead, ...lines].join(' ').slice(0, 900);
};

export const fallbackRefusal = (lang: 'id' | 'en', safety: SafetyResult): string => {
  if (lang === 'id') {
    return `Permintaan diblokir (${safety.rule}): ${safety.detail}. Sumber: ${safety.citation}. Nyalakan aerator dulu; molase hanya ≤ 0.12 g/L setelah DO > 3 mg/L. Aturan ini tidak bisa dilewati. Data SIMULATED.`;
  }
  return `Blocked (${safety.rule}): ${safety.detail}. Source: ${safety.citation}. Run the aerator first; dose molasses at or below 0.12 g/L only after DO is above 3 mg/L. This rule cannot be bypassed. Data is SIMULATED.`;
};

export const fallbackProposal = (safety: SafetyResult): string =>
  `Proposed under ${safety.rule}. ${safety.detail}. Source: ${safety.citation}. Nothing is sent to hardware; a supervisor must approve. Data is SIMULATED.`;
