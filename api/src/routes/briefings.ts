import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { appendAudit } from '../audit.js';
import { citationsFor } from '../citations.js';
import { dbErrorStatus, insertToolCall, listPonds, telemetryWindow } from '../db/repo.js';
import { writeBriefing } from '../gemini.js';
import { demoRateLimit } from '../rate-limit.js';
import { englishCaption, factsForPond, planBriefingActions } from '../proposals.js';
import { fallbackBriefing } from '../prompts.js';
import { briefingBodySchema } from '../schemas.js';
import { ingestSopFiles, listChunks } from '../sop/store.js';

export const briefingRoutes = new Hono();

const cache = new Map<string, string>();

briefingRoutes.post('/api/briefings', demoRateLimit, zValidator('json', briefingBodySchema), async (c) => {
  const lang = c.req.valid('json').lang ?? 'id';
  const requested = c.req.valid('json').pond_ids;
  try {
    const ponds = await listPonds();
    const chosen = ponds.filter((pond) => !requested || requested.includes(pond.id));
    let chunks = await listChunks();
    if (chunks.length === 0) {
      await ingestSopFiles();
      chunks = await listChunks();
    }
    const pondPayload = [];
    const proposals = [];
    const facts = [];
    let auditSync: 'ok' | 'pending' = 'ok';
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
    let briefing = '';
    let model: string | null = null;
    let cached = false;
    try {
      const written = await writeBriefing(lang, pondPayload, chunks.slice(0, 6), doses);
      briefing = written.text;
      model = written.model;
      if (briefing) cache.set(lang, briefing);
    } catch (err) {
      const saved = cache.get(lang);
      if (saved) {
        briefing = saved;
        cached = true;
      } else {
        briefing = fallbackBriefing(lang, facts);
      }
      console.error('briefing model unavailable', err instanceof Error ? err.message : err);
    }
    if (!briefing) briefing = fallbackBriefing(lang, facts);
    return c.json({
      simulated: true,
      lang,
      briefing,
      english_caption: englishCaption(facts),
      facts,
      proposals,
      model,
      cached,
      audit_sync: auditSync,
    });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
