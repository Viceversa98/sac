import type { Context, Next } from 'hono';

type Bucket = number[];

const buckets = new Map<string, Bucket>();

// WHY: in-memory is enough for one Cloud Run instance during the demo. This is not express-rate-limit.
export const rateLimit = (limit = 10, windowMs = 60_000) => {
  return async (c: Context, next: Next) => {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    const ip = forwarded || 'local';
    const now = Date.now();
    const recent = (buckets.get(ip) ?? []).filter((hit) => now - hit < windowMs);
    if (recent.length >= limit) {
      return c.json(
        { error: 'slow_down', message: 'Too many requests. Please wait a minute.' },
        429,
      );
    }
    recent.push(now);
    buckets.set(ip, recent);
    await next();
  };
};

export const demoRateLimit = rateLimit(10, 60_000);
