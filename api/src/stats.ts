const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export type ReadingPoint = {
  ts: Date;
  do_mgL: number | null;
  temp_c: number | null;
  ph: number | null;
  tan_mgL: number | null;
  nh3_mgL: number | null;
};

export type SeriesStats = {
  min: number | null;
  max: number | null;
  first: number | null;
  last: number | null;
  min_at_wib: string | null;
  max_at_wib: string | null;
};

export type PondStats = {
  count: number;
  from_wib: string | null;
  to_wib: string | null;
  do: SeriesStats;
  temp: SeriesStats;
  ph: SeriesStats;
  tan: SeriesStats;
  nh3: SeriesStats;
};

export const formatWib = (ts: Date): string => {
  const shifted = new Date(ts.getTime() + WIB_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

export const formatUtcSql = (ts: Date): string => ts.toISOString().slice(0, 19).replace('T', ' ');

export const parseUtcSql = (value: string): Date => new Date(`${value.slice(0, 19).replace(' ', 'T')}Z`);

// WHY: the replay is a fixed 24 h file. The window ends at the newest stored sample, not the wall clock.
export const withinHours = <T extends ReadingPoint>(rows: T[], hours: number): T[] => {
  if (rows.length === 0) return [];
  const latest = rows.reduce((best, row) => (row.ts > best.ts ? row : best)).ts.getTime();
  const cutoff = latest - hours * 60 * 60 * 1000;
  return rows.filter((row) => row.ts.getTime() >= cutoff);
};

const series = (rows: ReadingPoint[], pick: (row: ReadingPoint) => number | null): SeriesStats => {
  const points = rows
    .map((row) => ({ ts: row.ts, value: pick(row) }))
    .filter((point): point is { ts: Date; value: number } => point.value != null && Number.isFinite(point.value))
    .sort((a, b) => a.ts.getTime() - b.ts.getTime());
  if (points.length === 0) {
    return { min: null, max: null, first: null, last: null, min_at_wib: null, max_at_wib: null };
  }
  let minPoint = points[0];
  let maxPoint = points[0];
  for (const point of points) {
    if (point.value < minPoint.value) minPoint = point;
    if (point.value > maxPoint.value) maxPoint = point;
  }
  return {
    min: minPoint.value,
    max: maxPoint.value,
    first: points[0].value,
    last: points[points.length - 1].value,
    min_at_wib: formatWib(minPoint.ts),
    max_at_wib: formatWib(maxPoint.ts),
  };
};

export const stats = (rows: ReadingPoint[]): PondStats => {
  const ordered = [...rows].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  return {
    count: ordered.length,
    from_wib: ordered[0] ? formatWib(ordered[0].ts) : null,
    to_wib: ordered.at(-1) ? formatWib(ordered.at(-1)!.ts) : null,
    do: series(ordered, (row) => row.do_mgL),
    temp: series(ordered, (row) => row.temp_c),
    ph: series(ordered, (row) => row.ph),
    tan: series(ordered, (row) => row.tan_mgL),
    nh3: series(ordered, (row) => row.nh3_mgL),
  };
};
