import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { sopDocuments } from '../db/schema.js';
import { sopDir } from '../paths.js';
import { chunkSopMarkdown, rankChunks, type SopChunk } from './text.js';

export type StoredChunk = SopChunk & { id: number };

export const ingestSopFiles = async (): Promise<{ documents: number; chunks: number }> => {
  const dir = sopDir();
  const files = readdirSync(dir).filter((name) => name.endsWith('.md'));
  const db = getDb();
  let chunks = 0;
  for (const file of files) {
    const parsed = chunkSopMarkdown(readFileSync(path.join(dir, file), 'utf8'));
    if (parsed.length === 0) continue;
    await db.delete(sopDocuments).where(eq(sopDocuments.docKey, parsed[0].doc_key));
    await db.insert(sopDocuments).values(
      parsed.map((chunk) => ({
        docKey: chunk.doc_key,
        chunkNo: chunk.chunk_no,
        title: chunk.title.slice(0, 200),
        citation: chunk.citation.slice(0, 400),
        content: chunk.content,
        embedding: null,
      })),
    );
    chunks += parsed.length;
  }
  return { documents: files.length, chunks };
};

export const listChunks = async (): Promise<StoredChunk[]> => {
  const rows = await getDb().select().from(sopDocuments);
  return rows.map((row) => ({
    id: row.id,
    doc_key: row.docKey,
    chunk_no: row.chunkNo,
    title: row.title,
    citation: row.citation,
    content: row.content,
  }));
};

export const retrieveSop = async (query: string, limit = 6): Promise<StoredChunk[]> => {
  const chunks = await listChunks();
  return rankChunks(chunks, query, limit);
};
