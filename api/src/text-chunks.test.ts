import { describe, expect, it } from 'vitest';
import { textChunks } from './text-chunks.js';

describe('textChunks', () => {
  it('keeps the full sentence and splits on spaces', () => {
    const text = 'Kolam A dissolved oxygen is low. Run the aerator.';
    const parts = textChunks(text, 24);
    expect(parts.join('')).toBe(text);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => part.length > 0)).toBe(true);
  });
});
