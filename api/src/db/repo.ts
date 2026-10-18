import { readFileSync } from 'node:fs';
import { and, desc, eq } from 'drizzle-orm';
import { parseTelemetryCsv, type TelemetryRow } from '../csv.js';
import { telemetryFile } from '../paths.js';
import { formatUtcSql, formatWib, parseUtcSql, stats, withinHours } from '../stats.js';
import { dbErrorStatus, getDb, insertIdOf } from './client.js';
import { ensureSeed } from './seed.js';
import { approvals, ponds, telemetryReadings, toolCalls } from './schema.js';

export { dbErrorStatus };

const asNumber = (value: unknown): number | null => {
  if (value == null) return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

const asJson = (value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  return value;
};

export type PondDto = {
  id: string;
  name: string;
  volume_m3: number;
  species: string;
  max_feed_kg: number | null;
  is_simulated: boolean;
};

const mapPond = (row: typeof ponds.$inferSelect): PondDto => ({
  id: row.id,
  name: row.name,
  volume_m3: Number(row.volumeM3),
  species: row.species,
  max_feed_kg: asNumber(row.maxFeedKg),
  is_simulated: Boolean(row.isSimulated),
});

const mapReading = (row: typeof telemetryReadings.$inferSelect): TelemetryRow => ({
  ts: parseUtcSql(String(row.ts)),
  pond_id: row.pondId,
  do_mgL: asNumber(row.doMgL),
  temp_c: asNumber(row.tempC),
  ph: asNumber(row.ph),
  tan_mgL: asNumber(row.tanMgL),
  nh3_mgL: asNumber(row.nh3MgL),
  tds_ppm: asNumber(row.tdsPpm),
  source: row.source,
});

export const listPonds = async (): Promise<PondDto[]> => {
  await ensureSeed();
  const rows = await getDb().select().from(ponds);
  return rows.map(mapPond);
};

export const getPond = async (id: string): Promise<PondDto | null> => {
  await ensureSeed();
  const [row] = await getDb().select().from(ponds).where(eq(ponds.id, id)).limit(1);
  return row ? mapPond(row) : null;
};

export const ingestReadings = async (rows: TelemetryRow[]): Promise<{ inserted: number; skipped: number }> => {
  await ensureSeed();
  const db = getDb();
  const known = new Set((await listPonds()).map((pond) => pond.id));
  let inserted = 0;
  let skipped = 0;
  const groups = new Map<string, TelemetryRow[]>();
  for (const row of rows) {
    if (!known.has(row.pond_id) || Number.isNaN(row.ts.getTime())) {
      skipped += 1;
      continue;
    }
    const list = groups.get(row.pond_id) ?? [];
    list.push(row);
    groups.set(row.pond_id, list);
  }
  for (const [pondId, pondRows] of groups) {
    const existing = await db
      .select({ ts: telemetryReadings.ts })
      .from(telemetryReadings)
      .where(eq(telemetryReadings.pondId, pondId));
    const have = new Set(existing.map((row) => String(row.ts).slice(0, 19)));
    const fresh = pondRows.filter((row) => {
      const key = formatUtcSql(row.ts);
      if (have.has(key)) {
        skipped += 1;
        return false;
      }
      have.add(key);
      return true;
    });
    if (fresh.length === 0) continue;
    await db.insert(telemetryReadings).values(
      fresh.map((row) => ({
        pondId: row.pond_id,
        ts: formatUtcSql(row.ts),
        doMgL: row.do_mgL,
        tempC: row.temp_c,
        ph: row.ph,
        tanMgL: row.tan_mgL,
        nh3MgL: row.nh3_mgL,
        tdsPpm: row.tds_ppm,
        source: row.source,
      })),
    );
    inserted += fresh.length;
  }
  return { inserted, skipped };
};

export const replayFile = async (file: 'pond_A_do_drop.csv' | 'pond_B_tan_rise.csv') => {
  const rows = parseTelemetryCsv(readFileSync(telemetryFile(file), 'utf8'));
  const result = await ingestReadings(rows);
  return { file, pond_id: rows[0]?.pond_id ?? null, ...result };
};

export const telemetryWindow = async (pondId: string, hours: number) => {
  const pond = await getPond(pondId);
  if (!pond) return null;
  const rows = await getDb()
    .select()
    .from(telemetryReadings)
    .where(eq(telemetryReadings.pondId, pondId))
    .orderBy(desc(telemetryReadings.ts));
  const points = rows.map(mapReading);
  const window = withinHours(points, hours);
  return {
    pond,
    readings: window.map((row) => ({
      ts_utc: formatUtcSql(row.ts),
      ts_wib: formatWib(row.ts),
      do_mgL: row.do_mgL,
      temp_c: row.temp_c,
      ph: row.ph,
      tan_mgL: row.tan_mgL,
      nh3_mgL: row.nh3_mgL,
      tds_ppm: row.tds_ppm,
      source: row.source,
    })),
    stats: stats(window),
  };
};

export const latestPoint = async (pondId: string): Promise<TelemetryRow | null> => {
  const [row] = await getDb()
    .select()
    .from(telemetryReadings)
    .where(eq(telemetryReadings.pondId, pondId))
    .orderBy(desc(telemetryReadings.ts))
    .limit(1);
  if (!row) return null;
  const mapped = mapReading(row);
  return { ...mapped, pond_id: pondId };
};

export type ToolCallInput = {
  pond_id: string;
  tool_name: 'start_aerator' | 'set_feeder_kg' | 'dose_molasses_gL';
  args: unknown;
  rationale: string;
  citations: unknown;
  safety_result: unknown;
  status: 'proposed' | 'blocked' | 'executed_simulated' | 'rejected';
  model: string | null;
  prompt_id: string;
};

export const insertToolCall = async (input: ToolCallInput): Promise<number> => {
  const result = await getDb().insert(toolCalls).values({
    pondId: input.pond_id,
    toolName: input.tool_name,
    argsJson: input.args,
    rationale: input.rationale,
    citations: input.citations,
    safetyResult: input.safety_result,
    status: input.status,
    model: input.model,
    promptId: input.prompt_id,
  });
  return insertIdOf(result);
};

export const listToolCalls = async (status?: string) => {
  const db = getDb();
  const rows = status
    ? await db.select().from(toolCalls).where(eq(toolCalls.status, status as 'proposed')).orderBy(desc(toolCalls.id))
    : await db.select().from(toolCalls).orderBy(desc(toolCalls.id));
  return rows.map(mapToolCall);
};

const mapToolCall = (row: typeof toolCalls.$inferSelect) => ({
  id: row.id,
  pond_id: row.pondId,
  tool_name: row.toolName,
  args: asJson(row.argsJson),
  rationale: row.rationale,
  citations: asJson(row.citations),
  safety_result: asJson(row.safetyResult),
  status: row.status,
  model: row.model,
  prompt_id: row.promptId,
  created_at: row.createdAt,
});

export const recordApprovedReading = async (pondId: string, toolName: string): Promise<void> => {
  const latest = await latestPoint(pondId);
  if (!latest) return;
  const next: TelemetryRow = {
    ts: new Date(),
    pond_id: pondId,
    do_mgL: latest.do_mgL,
    temp_c: latest.temp_c,
    ph: latest.ph,
    tan_mgL: latest.tan_mgL,
    nh3_mgL: latest.nh3_mgL,
    tds_ppm: latest.tds_ppm,
    source: 'simulated',
  };
  if (toolName === 'dose_molasses_gL') {
    next.tan_mgL = 0.02;
    next.nh3_mgL = 0.02;
  } else if (toolName === 'start_aerator') {
    const raised = Math.max(latest.do_mgL ?? 0, 5.2);
    next.do_mgL = Math.round(Math.min(6.4, raised) * 100) / 100;
  } else {
    return;
  }
  await ingestReadings([next]);
};

export const decideToolCall = async (id: number, decision: 'approved' | 'rejected', note?: string) => {
  await ensureSeed();
  const db = getDb();
  const [existing] = await db.select().from(toolCalls).where(eq(toolCalls.id, id)).limit(1);
  if (!existing) return { error: 'not_found' as const };
  if (existing.status !== 'proposed') return { error: 'conflict' as const };
  const status = decision === 'approved' ? 'executed_simulated' : 'rejected';
  await db.transaction(async (tx) => {
    const [again] = await tx.select().from(toolCalls).where(eq(toolCalls.id, id)).limit(1);
    if (!again || again.status !== 'proposed') {
      throw Object.assign(new Error('not proposed'), { code: 'NOT_PROPOSED' });
    }
    await tx.insert(approvals).values({
      toolCallId: id,
      userId: 1,
      decision,
      note: note ?? null,
    });
    await tx.update(toolCalls).set({ status }).where(and(eq(toolCalls.id, id), eq(toolCalls.status, 'proposed')));
  });
  const [saved] = await db.select().from(toolCalls).where(eq(toolCalls.id, id)).limit(1);
  return { error: null, row: saved ? mapToolCall(saved) : null };
};

export const resetDemoRows = async (): Promise<void> => {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(approvals);
    await tx.delete(toolCalls);
  });
};
