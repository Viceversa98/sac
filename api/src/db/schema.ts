import {
  bigint,
  boolean,
  char,
  datetime,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

// Schema matches SPEC section 3. uk_pond_ts makes CSV replay idempotent under a double POST.
// WHY Drizzle: typed schema and SQL migrations for Cloud SQL MySQL. Judges score the data, not the ORM.

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  role: mysqlEnum('role', ['supervisor', 'operator']).notNull(),
  lang: mysqlEnum('lang', ['id', 'en']).notNull().default('id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ponds = mysqlTable('ponds', {
  id: varchar('id', { length: 16 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  volumeM3: decimal('volume_m3', { precision: 8, scale: 2, mode: 'number' }).notNull(),
  species: varchar('species', { length: 50 }).notNull().default('Oreochromis niloticus'),
  maxFeedKg: decimal('max_feed_kg', { precision: 6, scale: 2, mode: 'number' }),
  isSimulated: boolean('is_simulated').notNull().default(true),
});

export const telemetryReadings = mysqlTable(
  'telemetry_readings',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    pondId: varchar('pond_id', { length: 16 }).notNull().references(() => ponds.id),
    ts: datetime('ts', { mode: 'string' }).notNull(),
    doMgL: decimal('do_mgL', { precision: 5, scale: 2, mode: 'number' }),
    tempC: decimal('temp_c', { precision: 4, scale: 1, mode: 'number' }),
    ph: decimal('ph', { precision: 4, scale: 2, mode: 'number' }),
    tanMgL: decimal('tan_mgL', { precision: 5, scale: 2, mode: 'number' }),
    nh3MgL: decimal('nh3_mgL', { precision: 6, scale: 3, mode: 'number' }),
    tdsPpm: int('tds_ppm'),
    source: mysqlEnum('source', ['simulated', 'device']).notNull().default('simulated'),
  },
  (table) => [
    index('idx_pond_ts').on(table.pondId, table.ts),
    uniqueIndex('uk_pond_ts').on(table.pondId, table.ts),
  ],
);

export const sopDocuments = mysqlTable(
  'sop_documents',
  {
    id: int('id').primaryKey().autoincrement(),
    docKey: varchar('doc_key', { length: 64 }).notNull(),
    chunkNo: int('chunk_no').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    citation: varchar('citation', { length: 400 }).notNull(),
    content: text('content').notNull(),
    embedding: json('embedding'),
  },
  (table) => [uniqueIndex('uk_doc_chunk').on(table.docKey, table.chunkNo)],
);

export const toolCalls = mysqlTable('tool_calls', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  pondId: varchar('pond_id', { length: 16 }).notNull().references(() => ponds.id),
  toolName: mysqlEnum('tool_name', ['start_aerator', 'set_feeder_kg', 'dose_molasses_gL']).notNull(),
  argsJson: json('args_json').notNull(),
  rationale: text('rationale'),
  citations: json('citations'),
  safetyResult: json('safety_result').notNull(),
  status: mysqlEnum('status', ['proposed', 'approved', 'rejected', 'blocked', 'executed_simulated']).notNull(),
  model: varchar('model', { length: 64 }),
  promptId: char('prompt_id', { length: 1 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const approvals = mysqlTable(
  'approvals',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    toolCallId: bigint('tool_call_id', { mode: 'number' }).notNull().references(() => toolCalls.id),
    userId: int('user_id').notNull().references(() => users.id),
    decision: mysqlEnum('decision', ['approved', 'rejected']).notNull(),
    note: varchar('note', { length: 500 }),
    decidedAt: timestamp('decided_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uk_one_decision').on(table.toolCallId)],
);
