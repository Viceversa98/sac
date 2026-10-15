import { Hono } from 'hono';
import { appendAudit } from '../audit.js';
import { diagPing } from '../gemini.js';

export const diagRoutes = new Hono();

diagRoutes.get('/api/diag', async (c) => {
  if (process.env.DEMO_MODE !== '1') {
    return c.json({ error: 'demo_disabled', message: 'Diagnostics are only available when DEMO_MODE=1.' }, 404);
  }
  try {
    const ping = await diagPing();
    const audit = await appendAudit({
      event: 'diag',
      note: ping.text || 'reply OK',
      actor: { agent: 'sampay', model: ping.model, prompt_id: null },
    });
    return c.json({
      ok: audit.audit_sync === 'ok',
      model: ping.model,
      reply: ping.text,
      firestore_id: audit.id,
      audit_sync: audit.audit_sync,
      enterprise: true,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini or Firestore is unavailable';
    console.error('diag failed', message);
    return c.json({
      ok: false,
      error: 'gcp_unavailable',
      message,
    }, 503);
  }
});
