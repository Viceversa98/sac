import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadEnv } from './env.js';
import { briefingRoutes } from './routes/briefings.js';
import { chatRoutes } from './routes/chat.js';
import { demoRoutes } from './routes/demo.js';
import { diagRoutes } from './routes/diag.js';
import { pondRoutes } from './routes/ponds.js';
import { sopRoutes } from './routes/sop.js';
import { telemetryRoutes } from './routes/telemetry.js';
import { toolCallRoutes } from './routes/tool-calls.js';

loadEnv();

const allowOrigin = (origin: string): string => {
  const configured = process.env.WEB_ORIGIN || 'http://localhost:5173';
  if (configured === '*') return origin || '*';
  const allowed = configured.split(',').map((item) => item.trim()).filter(Boolean);
  if (!origin) return allowed[0];
  if (allowed.includes(origin) || origin === 'http://localhost:5173') return origin;
  try {
    if (new URL(origin).hostname.endsWith('.run.app')) return origin;
  } catch {
    return allowed[0];
  }
  return allowed[0];
};

// WHY Hono: one small router for the Cloud Run service. Zod validates bodies before they touch MySQL or Gemini.
export const app = new Hono();

app.use('/api/*', cors({
  origin: allowOrigin,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Accept', 'Content-Type'],
}));

app.get('/healthz', (c) => c.text('ok'));

app.route('/', telemetryRoutes);
app.route('/', pondRoutes);
app.route('/', sopRoutes);
app.route('/', briefingRoutes);
app.route('/', chatRoutes);
app.route('/', toolCallRoutes);
app.route('/', demoRoutes);
app.route('/', diagRoutes);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'internal_error', message: err.message }, 500);
});
