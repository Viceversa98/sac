import { z } from 'zod';

export const toolNameSchema = z.enum(['start_aerator', 'set_feeder_kg', 'dose_molasses_gL']);

export const aeratorArgsSchema = z.object({
  pond_id: z.string().min(1).max(16),
  duration_min: z.number().int(),
  reason: z.string().min(1),
});

export const feederArgsSchema = z.object({
  pond_id: z.string().min(1).max(16),
  kg: z.number(),
  meal: z.enum(['pagi', 'siang', 'sore']),
  reason: z.string().min(1),
});

export const molassesArgsSchema = z.object({
  pond_id: z.string().min(1).max(16),
  g_per_L: z.number().positive(),
  tan_mgL_basis: z.number(),
  reason: z.string().min(1),
});

export const intentSchema = z.object({
  intent: z.enum(['status_query', 'propose_action', 'explain_sop', 'other']),
  pond_id: z.enum(['A', 'B']).nullable(),
  tool: toolNameSchema.nullable(),
  amount: z.number().nullable(),
  unit: z.enum(['g/L', 'kg', 'min']).nullable(),
  meal: z.enum(['pagi', 'siang', 'sore']).nullable(),
  lang: z.enum(['id', 'en']),
});

export type Intent = z.infer<typeof intentSchema>;

export const readingBodySchema = z.object({
  ts: z.string().min(1),
  pond_id: z.string().min(1).max(16),
  do_mgL: z.number().nullable().optional(),
  temp_c: z.number().nullable().optional(),
  ph: z.number().nullable().optional(),
  tan_mgL: z.number().nullable().optional(),
  nh3_mgL: z.number().nullable().optional(),
  tds_ppm: z.number().int().nullable().optional(),
  source: z.enum(['simulated', 'device']).optional(),
});

export const telemetryBodySchema = z.union([readingBodySchema, z.array(readingBodySchema).min(1)]);

export const replayBodySchema = z.object({
  file: z.enum(['pond_A_do_drop.csv', 'pond_B_tan_rise.csv']).optional(),
  speed: z.literal('instant').optional(),
});

export const briefingBodySchema = z.object({
  lang: z.enum(['id', 'en']).optional(),
  pond_ids: z.array(z.string().min(1).max(16)).optional(),
});

export const chatBodySchema = z.object({
  message: z.string().min(1).max(2000),
  lang: z.enum(['id', 'en']).optional(),
  screen: z.object({
    pond_id: z.enum(['A', 'B']),
    do_mgL: z.number(),
    tan_mgL: z.number(),
  }).optional(),
});

export const noteBodySchema = z.object({
  note: z.string().max(500).optional(),
});
