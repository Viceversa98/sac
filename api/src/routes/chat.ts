import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { appendAudit } from '../audit.js';
import { citationsFor } from '../citations.js';
import { dbErrorStatus, getPond, insertToolCall, latestPoint } from '../db/repo.js';
import { parseIntentText, writeProposalReason, writeRefusal } from '../gemini.js';
import { parseIntentLocal, planFromIntent } from '../proposals.js';
import { demoRateLimit } from '../rate-limit.js';
import { chatBodySchema, intentSchema } from '../schemas.js';
import { ingestSopFiles, listChunks, retrieveSop } from '../sop/store.js';

export const chatRoutes = new Hono();

const readIntent = async (message: string, lang?: 'id' | 'en') => {
  try {
    const text = await parseIntentText(message);
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const parsed = intentSchema.safeParse(JSON.parse(text.slice(start, end + 1)));
      if (parsed.success) return { intent: parsed.data, model: process.env.GEMINI_MODEL_LITE || 'gemini-3.1-flash-lite' };
    }
  } catch (err) {
    console.error('intent model unavailable', err instanceof Error ? err.message : err);
  }
  return { intent: parseIntentLocal(message, lang), model: null as string | null };
};

chatRoutes.post('/api/chat', demoRateLimit, zValidator('json', chatBodySchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const { intent, model: intentModel } = await readIntent(body.message, body.lang);
    const lang = body.lang ?? intent.lang;
    const pondId = intent.pond_id ?? 'A';
    const pond = await getPond(pondId);
    if (!pond) return c.json({ error: 'not_found', message: `Unknown pond ${pondId}` }, 404);
    const latest = await latestPoint(pondId);
    if (intent.intent === 'status_query') {
      const value = latest?.do_mgL ?? null;
      const reply = lang === 'id'
        ? `DO kolam ${pondId} sekarang ${value ?? 'tidak ada'} mg/L. Data SIMULATED.`
        : `Pond ${pondId} DO is ${value ?? 'unavailable'} mg/L. Data is SIMULATED.`;
      return c.json({ simulated: true, intent, reply, tool_call: null, model: intentModel });
    }
    if (intent.intent === 'explain_sop' || intent.intent === 'other') {
      let chunks = await listChunks();
      if (chunks.length === 0) {
        await ingestSopFiles();
        chunks = await listChunks();
      }
      const found = intent.intent === 'explain_sop' ? await retrieveSop(body.message, 3) : [];
      const reply = found.length
        ? found.map((chunk) => `${chunk.doc_key}: ${chunk.citation}`).join(' ')
        : lang === 'id'
          ? 'Saya tidak mengubah kolam dari pesan itu. Data SIMULATED.'
          : 'That message did not change a pond. Data is SIMULATED.';
      return c.json({ simulated: true, intent, reply, tool_call: null, sop: found, model: intentModel });
    }
    const call = planFromIntent(intent, {
      id: pond.id,
      volume_m3: pond.volume_m3,
      max_feed_kg: pond.max_feed_kg,
      latest_do: latest?.do_mgL ?? null,
      latest_tan: latest?.tan_mgL ?? null,
    });
    if (!call) {
      return c.json({
        simulated: true,
        intent,
        reply: lang === 'id' ? 'Jumlah perintah belum jelas. Data SIMULATED.' : 'The command amount was not clear. Data is SIMULATED.',
        tool_call: null,
        model: intentModel,
      });
    }
    let chunks = await listChunks();
    if (chunks.length === 0) {
      await ingestSopFiles();
      chunks = await listChunks();
    }
    const citations = citationsFor(call.tool_name, chunks);
    const worded = call.status === 'blocked'
      ? await writeRefusal(lang, call.safety)
      : await writeProposalReason(intent, latest, chunks.slice(0, 6), call.args, call.safety);
    const id = await insertToolCall({
      pond_id: call.pond_id,
      tool_name: call.tool_name,
      args: call.args,
      rationale: worded.text,
      citations,
      safety_result: call.safety,
      status: call.status,
      model: worded.model,
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
      actor: { agent: 'sampay', model: worded.model, prompt_id: call.prompt_id },
    });
    return c.json({
      simulated: true,
      intent,
      reply: worded.text,
      tool_call: { id, ...call, citations },
      model: worded.model ?? intentModel,
      audit_sync: audit.audit_sync,
    });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
