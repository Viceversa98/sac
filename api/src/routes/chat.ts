import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { appendAudit } from '../audit.js';
import { citationsFor } from '../citations.js';
import { dbErrorStatus, getPond, insertToolCall, latestPoint } from '../db/repo.js';
import { geminiModel, parseIntentText, streamGenerate } from '../gemini.js';
import { parseIntentLocal, planFromIntent } from '../proposals.js';
import { fallbackProposal, fallbackRefusal, promptC, promptD } from '../prompts.js';
import { demoRateLimit } from '../rate-limit.js';
import { chatBodySchema, intentSchema } from '../schemas.js';
import { ingestSopFiles, listChunks, retrieveSop } from '../sop/store.js';
import { textChunks } from '../text-chunks.js';

export const chatRoutes = new Hono();

type ChatBody = { message: string; lang?: 'id' | 'en' };

type ChatPayload = {
  simulated: true;
  intent: unknown;
  reply: string;
  tool_call: Record<string, unknown> | null;
  model: string | null;
  sop?: unknown;
  audit_sync?: 'ok' | 'pending';
};

type ChatTurn = {
  pace: boolean;
  chunks: AsyncIterable<string> | Iterable<string>;
  finish: (reply: string) => Promise<ChatPayload>;
};

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

const fixedTurn = (
  intent: unknown,
  model: string | null,
  reply: string,
  extra: Partial<ChatPayload> = {},
): ChatTurn => ({
  pace: true,
  chunks: textChunks(reply),
  finish: async (text) => ({
    simulated: true,
    intent,
    reply: text || reply,
    tool_call: null,
    model,
    ...extra,
  }),
});

const modelChunks = async function* (prompt: string, tools: boolean, fallback: string): AsyncGenerator<string> {
  let sent = false;
  try {
    for await (const piece of streamGenerate({
      model: geminiModel(),
      prompt,
      temperature: 0,
      tools,
    })) {
      sent = true;
      yield piece;
    }
  } catch (err) {
    console.error('wording stream failed', err instanceof Error ? err.message : err);
    if (!sent) yield fallback;
    return;
  }
  if (!sent) yield fallback;
};

const openChat = async (body: ChatBody): Promise<ChatTurn | { error: { status: number; body: Record<string, unknown> } }> => {
  const { intent, model: intentModel } = await readIntent(body.message, body.lang);
  const lang = body.lang ?? intent.lang;
  const pondId = intent.pond_id ?? 'A';
  const pond = await getPond(pondId);
  if (!pond) return { error: { status: 404, body: { error: 'not_found', message: `Unknown pond ${pondId}` } } };
  const latest = await latestPoint(pondId);
  if (intent.intent === 'status_query') {
    const value = latest?.do_mgL ?? null;
    const reply = lang === 'id'
      ? `DO kolam ${pondId} sekarang ${value ?? 'tidak ada'} mg/L. Data SIMULATED.`
      : `Pond ${pondId} DO is ${value ?? 'unavailable'} mg/L. Data is SIMULATED.`;
    return fixedTurn(intent, intentModel, reply);
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
    return fixedTurn(intent, intentModel, reply, { sop: found });
  }
  const call = planFromIntent(intent, {
    id: pond.id,
    volume_m3: pond.volume_m3,
    max_feed_kg: pond.max_feed_kg,
    latest_do: latest?.do_mgL ?? null,
    latest_tan: latest?.tan_mgL ?? null,
  });
  if (!call) {
    const reply = lang === 'id' ? 'Jumlah perintah belum jelas. Data SIMULATED.' : 'The command amount was not clear. Data is SIMULATED.';
    return fixedTurn(intent, intentModel, reply);
  }
  let chunks = await listChunks();
  if (chunks.length === 0) {
    await ingestSopFiles();
    chunks = await listChunks();
  }
  const citations = citationsFor(call.tool_name, chunks);
  const blocked = call.status === 'blocked';
  const fallback = blocked ? fallbackRefusal(lang, call.safety) : fallbackProposal(call.safety);
  const prompt = blocked
    ? promptD(lang, call.safety)
    : promptC(intent, latest, chunks.slice(0, 6), call.args);
  return {
    pace: false,
    chunks: modelChunks(prompt, !blocked, fallback),
    finish: async (reply) => {
      const text = reply.trim() || fallback;
      const wordedModel = reply.trim() ? geminiModel() : null;
      const id = await insertToolCall({
        pond_id: call.pond_id,
        tool_name: call.tool_name,
        args: call.args,
        rationale: text,
        citations,
        safety_result: call.safety,
        status: call.status,
        model: wordedModel,
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
        actor: { agent: 'sampay', model: wordedModel, prompt_id: call.prompt_id },
      });
      return {
        simulated: true,
        intent,
        reply: text,
        tool_call: { id, ...call, citations },
        model: wordedModel ?? intentModel,
        audit_sync: audit.audit_sync,
      };
    },
  };
};

const collect = async (chunks: AsyncIterable<string> | Iterable<string>): Promise<string> => {
  let text = '';
  for await (const piece of chunks) text += piece;
  return text;
};

chatRoutes.post('/api/chat', demoRateLimit, zValidator('json', chatBodySchema), async (c) => {
  try {
    const turn = await openChat(c.req.valid('json'));
    if ('error' in turn) return c.json(turn.error.body, turn.error.status as 404);
    const reply = await collect(turn.chunks);
    return c.json(await turn.finish(reply));
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});

chatRoutes.post('/api/chat/stream', demoRateLimit, zValidator('json', chatBodySchema), async (c) => {
  try {
    const turn = await openChat(c.req.valid('json'));
    if ('error' in turn) return c.json(turn.error.body, turn.error.status as 404);
    return streamSSE(c, async (stream) => {
      let reply = '';
      try {
        for await (const piece of turn.chunks) {
          reply += piece;
          await stream.writeSSE({ event: 'token', data: JSON.stringify({ text: piece }) });
          if (turn.pace) await stream.sleep(18);
        }
        const payload = await turn.finish(reply);
        await stream.writeSSE({ event: 'done', data: JSON.stringify(payload) });
      } catch (err) {
        const mapped = dbErrorStatus(err);
        const message = mapped?.body.message || 'The co-pilot could not finish that reply.';
        await stream.writeSSE({ event: 'error', data: JSON.stringify({ message }) });
      }
    });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
