import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, '..');
const repoRoot = path.resolve(apiRoot, '..');

const kitSamples = path.join(repoRoot, 'sampay-aquaculture-build-kit', 'build-kit', 'samples');
const bundledSamples = path.join(apiRoot, 'data');

// WHY: prefer the kit files in this repo. The data/ copies exist so the Cloud Run image still replays.
export const samplesDir = (): string => {
  const kitCsv = path.join(kitSamples, 'telemetry', 'pond_A_do_drop.csv');
  if (existsSync(kitCsv)) return kitSamples;
  return bundledSamples;
};

export const telemetryFile = (name: 'pond_A_do_drop.csv' | 'pond_B_tan_rise.csv'): string =>
  path.join(samplesDir(), 'telemetry', name);

export const pondsFile = (): string => path.join(samplesDir(), 'ponds.json');

export const sopDir = (): string => path.join(samplesDir(), 'sop');
