import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { appendAudit, listAuditEvents } from '../audit.js';
import { dbErrorStatus, decideToolCall, listToolCalls, recordApprovedReading } from '../db/repo.js';
import { demoRateLimit } from '../rate-limit.js';
import { noteBodySchema } from '../schemas.js';

export const toolCallRoutes = new Hono();

const DEMO_ACTOR = { user_id: 1, role: 'demo_supervisor' };

toolCallRoutes.get('/api/tool-calls', async (c) => {
  const status = c.req.query('status');
  const allowed = ['proposed', 'approved', 'rejected', 'blocked', 'executed_simulated'];
  if (status && !allowed.includes(status)) {
    return c.json({ error: 'bad_request', message: 'Unknown status filter' }, 400);
  }
  try {
    const rows = await listToolCalls(status);
    return c.json({ source: 'mysql', tool_calls: rows });
  } catch (err) {
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
});

toolCallRoutes.get('/api/audit-events', async (c) => {
  const parsed = z.coerce.number().int().positive().max(200).safeParse(c.req.query('limit') ?? 50);
  if (!parsed.success) return c.json({ error: 'bad_request', message: 'limit must be 1–200' }, 400);
  try {
    const events = await listAuditEvents(parsed.data);
    return c.json({ source: 'firestore', events });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Firestore is unavailable';
    return c.json({
      error: 'audit_unavailable',
      message: `${message} The approval log is Firestore. Check GOOGLE_CLOUD_PROJECT and Application Default Credentials.`,
    }, 503);
  }
});

const readNote = async (c: Context): Promise<{ note?: string } | Response> => {
  const raw = await c.req.text();
  if (!raw.trim()) return {};
  try {
    const parsed = noteBodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return c.json({ error: 'bad_request', message: 'note must be a string of at most 500 characters' }, 400);
    return parsed.data;
  } catch {
    return c.json({ error: 'bad_request', message: 'Body must be JSON' }, 400);
  }
};

const decide = (decision: 'approved' | 'rejected') => async (c: Context) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'bad_request', message: 'Invalid tool call id' }, 400);
  const noteResult = await readNote(c);
  if (noteResult instanceof Response) return noteResult;
  const note = noteResult.note;
  try {
    const result = await decideToolCall(id, decision, note);
    if (result.error === 'not_found') return c.json({ error: 'not_found' }, 404);
    if (result.error === 'conflict' || !result.row) {
      return c.json({ error: 'conflict', message: 'Only a proposed tool call can be decided.' }, 409);
    }
    if (decision === 'approved') {
      await recordApprovedReading(result.row.pond_id, result.row.tool_name);
    }
    const event = decision === 'approved' ? 'executed_simulated' : 'rejected';
    const audit = await appendAudit({
      tool_call_id: id,
      pond_id: result.row.pond_id,
      event,
      tool_name: result.row.tool_name,
      args: result.row.args,
      safety_result: result.row.safety_result,
      citations: result.row.citations,
      actor: DEMO_ACTOR,
      note,
    });
    return c.json({
      simulated: true,
      actor: DEMO_ACTOR,
      tool_call: result.row,
      audit_sync: audit.audit_sync,
      audit_id: audit.id,
    });
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
    if (code === 'NOT_PROPOSED') {
      return c.json({ error: 'conflict', message: 'Only a proposed tool call can be decided.' }, 409);
    }
    const mapped = dbErrorStatus(err);
    if (mapped) return c.json(mapped.body, mapped.status);
    throw err;
  }
};

toolCallRoutes.post('/api/tool-calls/:id/approve', demoRateLimit, decide('approved'));
toolCallRoutes.post('/api/tool-calls/:id/reject', demoRateLimit, decide('rejected'));
