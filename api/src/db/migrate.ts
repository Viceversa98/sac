import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { loadEnv } from '../env.js';
import { getDb } from './client.js';

loadEnv();

const folder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle');

migrate(getDb(), { migrationsFolder: folder })
  .then(() => {
    console.log('migrations applied');
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
