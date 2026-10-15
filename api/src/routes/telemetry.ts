import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { dbErrorStatus, ingestReadings, replayFile } from '../db/repo.js';
import { replayBodySchema, telemetryBodySchema } from '../schemas.js';

export const telemetryRoutes = new Hono();

const requireDemo = (demo: string | undefined): boolean => demo === '1';

telemetryRoutes.post('/api/telemetry', zValidator('json', telemetryBodySchema), async (c) => {
  const body = c.req.valid('json');
  const items = Array.isArray(body) ? body : [body];
  try {
    const rows = items.map((item) => ({
      ts: new Date(item.ts),
      pond_id: item.pond_id,
      do_mgL: item.do_mgL ?? null,
      temp_c: item.temp_c ?? null,
      ph: item.ph ?? null,
      tan_mgL: item.tan_mgL ?? null,
      nh3_mgL: item.nh3_mgL ?? null,
      tds_ppm: item.tds_ppm ?? null,
      source: item.source ?? 'simulated' as const,
    }));
    if (rows.some((row) => Number.isNaN(row.ts.getTime()))) {
      return c.json({ error: 'bad_request', message: 'ts must be an ISO timestamp' }, 400);
    }
    const result = await ingestReadings(rows);
    return c.json({ simulated: true, ...result });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});

telemetryRoutes.post('/api/telemetry/replay', zValidator('json', replayBodySchema), async (c) => {
  if (!requireDemo(process.env.DEMO_MODE)) {
    return c.json({ error: 'demo_disabled', message: 'Replay is only available when DEMO_MODE=1.' }, 404);
  }
  const body = c.req.valid('json');
  if (body.speed && body.speed !== 'instant') {
    return c.json({ error: 'bad_request', message: 'Only speed instant is supported.' }, 400);
  }
  const files = body.file ? [body.file] : (['pond_A_do_drop.csv', 'pond_B_tan_rise.csv'] as const);
  try {
    const results = [];
    for (const file of files) results.push(await replayFile(file));
    return c.json({ simulated: true, speed: 'instant', results });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
