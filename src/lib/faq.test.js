import { describe, expect, it } from 'vitest';
import { FAQ_ITEMS, faqProblems, reviewedFaq } from './faq';
import OFFICEHOLDERS from '../data/officeholders.json';

describe('FAQ', () => {
  it('is well formed', () => {
    expect(faqProblems()).toEqual([]);
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(6);
  });

  it('shows learners reviewed entries only', () => {
    const items = [{ id: 'a', status: 'draft', q: 'Q', a: 'A' }, { id: 'b', status: 'reviewed', q: 'Q', a: 'A' }];
    expect(reviewedFaq(items).map((x) => x.id)).toEqual(['b']);
  });

  it('never names a current officeholder', () => {
    const names = [];
    JSON.stringify(OFFICEHOLDERS).replace(/"name"\s*:\s*"([^"]+)"/g, (_, n) => { names.push(n); return ''; });
    const text = JSON.stringify(FAQ_ITEMS);
    for (const n of names) expect(text.includes(n)).toBe(false);
  });
});
