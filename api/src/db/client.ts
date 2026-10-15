import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql, { type Pool } from 'mysql2/promise';
import * as schema from './schema.js';

export type Database = MySql2Database<typeof schema>;

let pool: Pool | undefined;
let database: Database | undefined;

export const getDb = (): Database => {
  if (database && pool) return database;
  const socket = process.env.DB_SOCKET || (process.env.INSTANCE_CONNECTION_NAME
    ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
    : '');
  // WHY timezone Z and dateStrings: DATETIME is stored as UTC text. mysql2 must not shift it to local time.
  pool = mysql.createPool({
    host: socket ? undefined : (process.env.DB_HOST ?? '127.0.0.1'),
    port: socket ? undefined : Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'sampay',
    password: process.env.DB_PASSWORD ?? 'sampay_local',
    database: process.env.DB_NAME ?? 'sampay',
    socketPath: socket || undefined,
    timezone: 'Z',
    dateStrings: true,
    connectionLimit: 5,
  });
  database = drizzle(pool, { schema, mode: 'default' });
  return database;
};

export const dbErrorStatus = (err: unknown): { status: 503 | 409; body: { error: string; message: string } } | null => {
  const code = errorCode(err);
  if (code === 'ER_DUP_ENTRY') {
    return { status: 409, body: { error: 'conflict', message: 'This proposal already has a decision.' } };
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    code === 'ER_BAD_DB_ERROR' ||
    code === 'ER_NO_SUCH_TABLE' ||
    code === 'PROTOCOL_CONNECTION_LOST'
  ) {
    return {
      status: 503,
      body: {
        error: 'database_unavailable',
        message: 'MySQL is not reachable. Start docker compose in api/ and run db:migrate and db:seed.',
      },
    };
  }
  return null;
};

const errorCode = (err: unknown): string => {
  if (!err || typeof err !== 'object') return '';
  const record = err as { code?: string; cause?: { code?: string }; errno?: number };
  return record.code || record.cause?.code || '';
};

export const insertIdOf = (result: unknown): number => {
  const header = Array.isArray(result) ? result[0] : result;
  if (header && typeof header === 'object' && 'insertId' in header) {
    return Number((header as { insertId: number }).insertId);
  }
  throw new Error('MySQL insert did not return an id');
};
