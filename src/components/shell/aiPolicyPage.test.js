import { describe, it, expect } from 'vitest';
import { publicPolicy } from './AiPolicyPage';

describe('publicPolicy', () => {
  it('keeps the title and the Updated line, and leaves out anything else before the first section', () => {
    const md = '# AI Policy\n\n**Status: draft** note for the owner\n\n*Updated November 27, 2026. On Supabase.*\n\n## Purpose\nText.';
    const out = publicPolicy(md);
    expect(out).toBe('# AI Policy\n\n*Updated November 27, 2026. On Supabase.*\n\n## Purpose\nText.');
  });

  it('works without an Updated line', () => {
    expect(publicPolicy('# AI Policy\n\nreview box\n\n## Purpose\nText.')).toBe('# AI Policy\n\n## Purpose\nText.');
  });
});
