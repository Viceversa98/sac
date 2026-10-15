import { defineConfig } from 'drizzle-kit';

// Generate reads the TypeScript schema only. A live MySQL is required for migrate, not for generate.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'sampay',
    password: process.env.DB_PASSWORD ?? 'sampay_local',
    database: process.env.DB_NAME ?? 'sampay',
  },
});
