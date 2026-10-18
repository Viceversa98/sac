export const textChunks = (text: string, size = 24): string[] => {
  if (!text) return [];
  const parts: string[] = [];
  let batch = '';
  for (const piece of text.split(/(\s+)/)) {
    batch += piece;
    if (batch.length >= size) {
      parts.push(batch);
      batch = '';
    }
  }
  if (batch) parts.push(batch);
  return parts;
};
