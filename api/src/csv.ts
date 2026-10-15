export type TelemetryRow = {
  ts: Date;
  pond_id: string;
  do_mgL: number | null;
  temp_c: number | null;
  ph: number | null;
  tan_mgL: number | null;
  nh3_mgL: number | null;
  tds_ppm: number | null;
  source: 'simulated' | 'device';
};

const num = (raw: string | undefined): number | null => {
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const parseTelemetryCsv = (text: string): TelemetryRow[] => {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0]?.split(',') ?? [];
  const at = (name: string) => header.indexOf(name);
  return lines.slice(1).filter((line) => line.trim() !== '').map((line) => {
    const cols = line.split(',');
    const source = cols[at('source')] === 'device' ? 'device' : 'simulated';
    return {
      ts: new Date(cols[at('ts')]),
      pond_id: cols[at('pond_id')],
      do_mgL: num(cols[at('do_mgL')]),
      temp_c: num(cols[at('temp_c')]),
      ph: num(cols[at('ph')]),
      tan_mgL: num(cols[at('tan_mgL')]),
      nh3_mgL: num(cols[at('nh3_mgL')]),
      tds_ppm: num(cols[at('tds_ppm')]),
      source,
    };
  });
};
