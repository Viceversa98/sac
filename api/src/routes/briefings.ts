import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { appendAudit } from '../audit.js';
import { citationsFor } from '../citations.js';
import { dbErrorStatus, insertToolCall, listPonds, listToolCalls, telemetryWindow } from '../db/repo.js';
import { demoRateLimit } from '../rate-limit.js';
import { englishCaption, factsForPond, planBriefingActions, type Fact } from '../proposals.js';
import { fallbackBriefing } from '../prompts.js';
import { briefingBodySchema } from '../schemas.js';
import { ingestSopFiles, listChunks } from '../sop/store.js';
import { textChunks } from '../text-chunks.js';

export const briefingRoutes = new Hono();

type BriefingDraft = {
  lang: 'id' | 'en';
  facts: Fact[];
  proposals: Array<Record<string, unknown>>;
  pondPayload: unknown[];
  doses: unknown[];
  chunks: Awaited<ReturnType<typeof listChunks>>;
  auditSync: 'ok' | 'pending';
};

const prepareBriefing = async (
  lang: 'id' | 'en',
  requested: string[] | undefined,
): Promise<BriefingDraft> => {
  const ponds = await listPonds();
  const chosen = ponds.filter((pond) => !requested || requested.includes(pond.id));
  let chunks = await listChunks();
  if (chunks.length === 0) {
    await ingestSopFiles();
    chunks = await listChunks();
  }
  const pondPayload = [];
  const proposals = [];
  const facts: Fact[] = [];
  let auditSync: 'ok' | 'pending' = 'ok';
  const waiting = await listToolCalls('proposed');
  for (const pond of chosen) {
    const window = await telemetryWindow(pond.id, 24);
    const pondStats = window?.stats;
    if (!pondStats) continue;
    const pondFacts = factsForPond(pond.id, pondStats);
    facts.push(...pondFacts);
    const calls = planBriefingActions(
      {
        id: pond.id,
        volume_m3: pond.volume_m3,
        max_feed_kg: pond.max_feed_kg,
        latest_do: pondStats.do.last,
        latest_tan: pondStats.tan.last,
      },
      pondStats,
    );
    pondPayload.push({ pond_id: pond.id, stats: pondStats, actions: calls.map((call) => call.args) });
    for (const call of calls) {
      const alreadyWaiting = waiting.some((row) => row.pond_id === call.pond_id && row.tool_name === call.tool_name && row.status === 'proposed');
      if (alreadyWaiting) continue;
      const citations = citationsFor(call.tool_name, chunks);
      const id = await insertToolCall({
        pond_id: call.pond_id,
        tool_name: call.tool_name,
        args: call.args,
        rationale: String(call.args.reason ?? ''),
        citations,
        safety_result: call.safety,
        status: call.status,
        model: null,
        prompt_id: call.prompt_id,
      });
      const audit = await appendAudit({
        tool_call_id: id,
        pond_id: call.pond_id,
        event: call.status === 'blocked' ? 'blocked' : 'proposed',
        tool_name: call.tool_name,
        args: call.args,
        safety_result: call.safety,
        citations,
        actor: { agent: 'sampay', model: null, prompt_id: call.prompt_id },
      });
      if (audit.audit_sync === 'pending') auditSync = 'pending';
      proposals.push({ id, ...call, citations, audit_sync: audit.audit_sync });
    }
  }
  const doses = proposals
    .filter((item) => item.tool_name === 'dose_molasses_gL')
    .map((item) => item.args);
  return { lang, facts, proposals, pondPayload, doses, chunks, auditSync };
};

const briefingPayload = (
  draft: BriefingDraft,
  briefing: string,
  model: string | null,
  cached: boolean,
) => ({
  simulated: true as const,
  lang: draft.lang,
  briefing,
  english_caption: englishCaption(draft.facts),
  facts: draft.facts,
  proposals: draft.proposals,
  model,
  cached,
  audit_sync: draft.auditSync,
});

async function* briefingChunks(draft: BriefingDraft): AsyncGenerator<{ text: string; model: string | null; cached: boolean }> {
  const fallback = fallbackBriefing('en', draft.facts);
  for (const piece of textChunks(fallback)) yield { text: piece, model: null, cached: false };
}

briefingRoutes.post('/api/briefings', demoRateLimit, zValidator('json', briefingBodySchema), async (c) => {
  const lang = 'en' as const;
  const requested = c.req.valid('json').pond_ids;
  try {
    const draft = await prepareBriefing(lang, requested);
    const briefing = fallbackBriefing(lang, draft.facts);
    return c.json(briefingPayload(draft, briefing, null, false));
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});

briefingRoutes.post('/api/briefings/stream', demoRateLimit, zValidator('json', briefingBodySchema), async (c) => {
  const lang = 'en' as const;
  const requested = c.req.valid('json').pond_ids;
  try {
    const draft = await prepareBriefing(lang, requested);
    return streamSSE(c, async (stream) => {
      let briefing = '';
      let model: string | null = null;
      let cached = false;
      let paced = false;
      try {
        for await (const piece of briefingChunks(draft)) {
          briefing += piece.text;
          model = piece.model ?? model;
          cached = piece.cached;
          paced = piece.model == null;
          await stream.writeSSE({ event: 'token', data: JSON.stringify({ text: piece.text }) });
          if (paced) await stream.sleep(18);
        }
        if (!briefing.trim()) briefing = fallbackBriefing(lang, draft.facts);
        await stream.writeSSE({
          event: 'done',
          data: JSON.stringify(briefingPayload(draft, briefing.trim(), model, cached)),
        });
      } catch (err) {
        const mapped = dbErrorStatus(err);
        const message = mapped?.body.message || 'The co-pilot could not finish that briefing.';
        await stream.writeSSE({ event: 'error', data: JSON.stringify({ message }) });
      }
    });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
