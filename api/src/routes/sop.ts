import { Hono } from 'hono';
import { dbErrorStatus } from '../db/repo.js';
import { ingestSopFiles } from '../sop/store.js';

export const sopRoutes = new Hono();

sopRoutes.post('/api/sop/ingest', async (c) => {
  try {
    const result = await ingestSopFiles();
    return c.json({ ...result, embeddings: false });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});
