import type { ToolName } from './safety.js';
import { SOURCE_AERATOR_POLICY, SOURCE_DO, SOURCE_FEEDER_POLICY, SOURCE_MOLASSES_MAX } from './thresholds.js';
import type { SopChunk } from './sop/text.js';
import { rankChunks } from './sop/text.js';

const fallback = {
  dose_molasses_gL: { doc_key: 'SOP-01-cn-molasses', citation: SOURCE_MOLASSES_MAX },
  start_aerator: { doc_key: 'SOP-02-do-aeration', citation: `${SOURCE_DO}. ${SOURCE_AERATOR_POLICY}` },
  set_feeder_kg: { doc_key: 'SOP-04-feeding', citation: SOURCE_FEEDER_POLICY },
} as const;

export const citationsFor = (tool: ToolName, chunks: SopChunk[]) => {
  const query = tool === 'dose_molasses_gL' ? 'molasses molase TAN 0.12' : tool === 'start_aerator' ? 'aerator DO oksigen' : 'feeder pakan feed';
  const [best] = rankChunks(chunks, query, 1);
  if (best) return [{ doc_key: best.doc_key, chunk_no: best.chunk_no, citation: best.citation }];
  return [{ ...fallback[tool], chunk_no: 1 }];
};
