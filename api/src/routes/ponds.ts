import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { dbErrorStatus, listPonds, telemetryWindow } from '../db/repo.js';

export const pondRoutes = new Hono();

const hoursSchema = z.object({
  hours: z.string().optional(),
});

pondRoutes.get('/api/ponds', async (c) => {
  try {
    const ponds = await listPonds();
    const withStats = [];
    for (const pond of ponds) {
      const window = await telemetryWindow(pond.id, 24);
      withStats.push({ ...pond, stats: window?.stats ?? null });
    }
    return c.json({ simulated: true, ponds: withStats });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});

pondRoutes.get('/api/ponds/:id/telemetry', zValidator('query', hoursSchema), async (c) => {
  const raw = c.req.valid('query').hours;
  const hours = raw == null || raw === '' ? 24 : Number(raw);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 720) {
    return c.json({ error: 'bad_request', message: 'hours must be a number from 0 to 720' }, 400);
  }
  try {
    const window = await telemetryWindow(c.req.param('id'), hours);
    if (!window) return c.json({ error: 'not_found', message: 'Unknown pond' }, 404);
    return c.json({ simulated: true, hours, ...window });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
