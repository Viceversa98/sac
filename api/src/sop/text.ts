export type SopChunk = {
  doc_key: string;
  chunk_no: number;
  title: string;
  citation: string;
  content: string;
};

const tokensOf = (value: string): string[] =>
  value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 1);

export const chunkSopMarkdown = (raw: string): SopChunk[] => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('SOP file is missing frontmatter');
  const frontmatter = match[1];
  const body = match[2];
  const docKey = /^doc_key:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim() ?? 'unknown';
  const docTitle = /^title:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim() ?? docKey;
  const tags = /^tags:\s*\[([^\]]*)\]/m.exec(frontmatter)?.[1]?.replaceAll(',', ' ') ?? '';
  const citation = /^\s*-\s+(.+)$/m.exec(frontmatter)?.[1]?.trim() ?? docTitle;
  const parts = body.split(/^## /m);
  const chunks: SopChunk[] = [];
  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;
    const newline = text.indexOf('\n');
    const heading = newline === -1 ? text : text.slice(0, newline);
    const section = newline === -1 ? '' : text.slice(newline + 1).trim();
    chunks.push({
      doc_key: docKey,
      chunk_no: chunks.length + 1,
      title: heading.replace(/^#+\s*/, '').trim() || docTitle,
      citation,
      content: `tags: ${tags}\n${section || text}`,
    });
  }
  return chunks;
};

// WHY: keyword/tag overlap only. Embeddings stay out until the demo path is green.
export const rankChunks = <T extends SopChunk>(chunks: T[], query: string, limit = 6): T[] => {
  const queryTokens = new Set(tokensOf(query));
  const scored = chunks.map((chunk) => {
    const chunkTokens = tokensOf(`${chunk.title} ${chunk.citation} ${chunk.content}`);
    let score = 0;
    for (const token of chunkTokens) {
      if (queryTokens.has(token)) score += 1;
    }
    return { chunk, score };
  });
  const matched = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  const chosen = (matched.length > 0 ? matched : scored).slice(0, limit);
  return chosen.map((item) => item.chunk);
};
