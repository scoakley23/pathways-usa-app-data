// Read it tips chosen on the device (no AI).
import { describe, it, expect } from 'vitest';
import TIPS from '../../content/vocab/reading-tips.json';
import READING from '../../content/vocab/reading-vocabulary.json';
import { readingTip, reviewedTips, tipKey, READING_TIP_LINES } from './readingTips';
import { wordDiff } from '@/components/utils/wordDiff';

const LIST_WORDS = new Set(READING.categories.flatMap((c) => c.entries).flatMap((e) => e.split(/[\s/]+/)).map(tipKey));

describe('reading-tips.json', () => {
  it('tips are for words on the official reading list, draft or reviewed, and short', () => {
    for (const [word, t] of Object.entries(TIPS.tips)) {
      expect(LIST_WORDS.has(tipKey(word)), word).toBe(true);
      expect(['draft', 'reviewed']).toContain(t.status);
      expect(t.tip.length).toBeLessThanOrEqual(120);
    }
  });
});

describe('readingTip', () => {
  const tips = { washington: 'Say it in three parts: WASH-ing-ton.' };
  const tip = (target, said, opts = { tips }) => readingTip(wordDiff(target, said), opts);

  it('a reviewed tip for the first missed word that has one', () => {
    expect(tip('Who lives in Washington?', 'who lives in')).toBe(tips.washington);
  });

  it('fixed lines otherwise', () => {
    expect(tip('Who can vote?', 'who can vote')).toBe(READING_TIP_LINES.allRight);
    expect(tip('Who can vote?', 'hello there')).toBe(READING_TIP_LINES.noneMatched);
    expect(tip('Who can vote?', 'who vote')).toBe('Almost there. Say "can" slowly and clearly.');
    expect(tip('Who can vote today?', 'who')).toContain('"can", "vote", "today"');
    expect(tip('Who can vote?', 'who can can vote now')).toBe(READING_TIP_LINES.extraWords);
  });

  it('draft tips are never shown', () => {
    expect(reviewedTips({ tips: { can: { tip: 'x', status: 'draft' }, vote: { tip: 'Say "vote".', status: 'reviewed' } } })).toEqual({ vote: 'Say "vote".' });
  });
});
