import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { loadEnv } from '../env.js';
import { pondsFile } from '../paths.js';
import { getDb } from './client.js';
import { ponds, users } from './schema.js';

type SeedFile = {
  ponds: Array<{ id: string; name: string; volume_m3: number; max_feed_kg: number | null; is_simulated: boolean }>;
  users: Array<{ id: number; name: string; role: 'supervisor' | 'operator'; lang: 'id' | 'en' }>;
};

export const seedDatabase = async (): Promise<void> => {
  const file = readSeedFile();
  const db = getDb();
  for (const user of file.users) {
    await db
      .insert(users)
      .values({ id: user.id, name: user.name, role: user.role, lang: user.lang })
      .onDuplicateKeyUpdate({ set: { name: user.name, role: user.role, lang: user.lang } });
  }
  for (const pond of file.ponds) {
    await db
      .insert(ponds)
      .values({
        id: pond.id,
        name: pond.name,
        volumeM3: pond.volume_m3,
        maxFeedKg: pond.max_feed_kg,
        isSimulated: pond.is_simulated,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: pond.name,
          volumeM3: pond.volume_m3,
          maxFeedKg: pond.max_feed_kg,
          isSimulated: pond.is_simulated,
        },
      });
  }
};

const readSeedFile = (): SeedFile => JSON.parse(readFileSync(pondsFile(), 'utf8')) as SeedFile;

export const refreshPondNames = async (): Promise<void> => {
  const file = readSeedFile();
  const db = getDb();
  for (const pond of file.ponds) {
    await db.update(ponds).set({ name: pond.name }).where(eq(ponds.id, pond.id));
  }
};

export const ensureSeed = async (): Promise<void> => {
  const db = getDb();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, 1)).limit(1);
  if (existing.length === 0) {
    await seedDatabase();
    return;
  }
  await refreshPondNames();
};

const isDirectRun = process.argv[1]?.includes('seed');
if (isDirectRun) {
  loadEnv();
  seedDatabase()
    .then(() => {
      console.log('seeded ponds and users');
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error(err);
      process.exit(1);
    });
}
