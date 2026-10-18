import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';
import { sopDir } from './paths.js';
import path from 'node:path';
import { chunkSopMarkdown, rankChunks } from './sop/text.js';

describe('http', () => {
  it('answers healthz without MySQL or GCP', async () => {
    const response = await app.request('/healthz');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('answers /api/health without MySQL or GCP', async () => {
    const response = await app.request('/api/health');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('answers /api/healthz without MySQL or GCP', async () => {
    const response = await app.request('/api/healthz');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('rejects a telemetry body before it touches MySQL', async () => {
    const response = await app.request('/api/telemetry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pond_id: 'A' }),
    });
    expect(response.status).toBe(400);
  });

  it('returns a clear diag error when the GCP project is missing', async () => {
    const previousDemo = process.env.DEMO_MODE;
    const previousProject = process.env.GOOGLE_CLOUD_PROJECT;
    process.env.DEMO_MODE = '1';
    delete process.env.GOOGLE_CLOUD_PROJECT;
    const response = await app.request('/api/diag');
    if (previousDemo == null) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemo;
    if (previousProject == null) delete process.env.GOOGLE_CLOUD_PROJECT;
    else process.env.GOOGLE_CLOUD_PROJECT = previousProject;
    expect(response.status).toBe(503);
    const body = await response.json() as { error: string; message: string };
    expect(body.error).toBe('gcp_unavailable');
    expect(body.message).toContain('GOOGLE_CLOUD_PROJECT');
  });
});

describe('sop keywords', () => {
  it('chunks the molasses SOP and finds it by the word molase', () => {
    const raw = readFileSync(path.join(sopDir(), 'SOP-01-cn-molasses.md'), 'utf8');
    const chunks = chunkSopMarkdown(raw);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some((chunk) => chunk.content.includes('0.12'))).toBe(true);
    expect(JSON.stringify(chunks)).not.toContain('embedding');
    const ranked = rankChunks(chunks, 'tambah molase kolam');
    expect(ranked[0]?.doc_key).toBe('SOP-01-cn-molasses');
  });
});

describe('gemini client source', () => {
  it('uses enterprise mode and does not mention an API key or vertexai', () => {
    const source = readFileSync(new URL('./gemini.ts', import.meta.url), 'utf8');
    expect(source).toContain('enterprise: true');
    expect(source).not.toContain('apiKey');
    expect(source).not.toContain('vertexai');
    expect(source).not.toContain('GEMINI_API_KEY');
  });
});
