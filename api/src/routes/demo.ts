import { Hono } from 'hono';
import { appendAudit } from '../audit.js';
import { citationsFor } from '../citations.js';
import { dbErrorStatus, getPond, insertToolCall, latestPoint, resetDemoRows, replayFile } from '../db/repo.js';
import { blockedMolassesProposal, pendingKolamProposal, type PlannedCall } from '../proposals.js';
import { demoRateLimit } from '../rate-limit.js';
import { listChunks } from '../sop/store.js';

export const demoRoutes = new Hono();

const files = ['pond_A_do_drop.csv', 'pond_B_tan_rise.csv'] as const;

const saveSeed = async (call: PlannedCall, event: 'proposed' | 'refused') => {
  const chunks = await listChunks();
  const citations = citationsFor(call.tool_name, chunks);
  const id = await insertToolCall({
    pond_id: call.pond_id,
    tool_name: call.tool_name,
    args: call.args,
    rationale: event === 'refused' ? 'REFUSED before any hardware command.' : 'Waiting for approval. No hardware command has been sent.',
    citations,
    safety_result: call.safety,
    status: call.status,
    model: null,
    prompt_id: call.prompt_id,
  });
  const audit = await appendAudit({
    tool_call_id: id,
    pond_id: call.pond_id,
    event,
    tool_name: call.tool_name,
    args: call.args,
    safety_result: call.safety,
    citations,
    actor: { agent: 'sampay', model: null, prompt_id: call.prompt_id },
    note: event === 'refused' ? 'REFUSED' : 'Waiting for approval',
  });
  return { id, status: call.status, audit_sync: audit.audit_sync };
};

const seedJudgeQueue = async () => {
  const pond = await getPond('B');
  const latestB = await latestPoint('B');
  const latestA = await latestPoint('A');
  const pending = pendingKolamProposal({
    id: 'B',
    volume_m3: pond?.volume_m3 ?? 30,
    max_feed_kg: pond?.max_feed_kg ?? null,
    latest_do: latestB?.do_mgL ?? null,
    latest_tan: latestB?.tan_mgL ?? null,
  });
  const refused = blockedMolassesProposal('A', latestA?.do_mgL ?? null);
  return {
    pending: await saveSeed(pending, 'proposed'),
    refused: await saveSeed(refused, 'refused'),
  };
};

demoRoutes.post('/api/demo/reset', demoRateLimit, async (c) => {
  if (process.env.DEMO_MODE !== '1') {
    return c.json({ error: 'demo_disabled', message: 'Reset is only available when DEMO_MODE=1.' }, 404);
  }
  try {
    await resetDemoRows();
    const replay = [];
    for (const file of files) replay.push(await replayFile(file));
    const audit = await appendAudit({
      event: 'demo_reset',
      actor: { agent: 'sampay', model: null, prompt_id: null },
      note: 'Demo rows cleared and both telemetry files replayed. Firestore stays append-only.',
    });
    const seeded = await seedJudgeQueue();
    return c.json({ simulated: true, replay, seeded, audit_sync: audit.audit_sync, audit_id: audit.id });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
