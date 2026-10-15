import { Hono } from 'hono';
import { appendAudit } from '../audit.js';
import { dbErrorStatus, resetDemoRows, replayFile } from '../db/repo.js';
import { demoRateLimit } from '../rate-limit.js';

export const demoRoutes = new Hono();

const files = ['pond_A_do_drop.csv', 'pond_B_tan_rise.csv'] as const;

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
    return c.json({ simulated: true, replay, audit_sync: audit.audit_sync, audit_id: audit.id });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
