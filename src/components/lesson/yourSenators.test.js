import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import officeholders from '../../data/officeholders.json';

// The "Your senators" story screen with a saved state, and without one.
let fakeLocation = { location: { state: 'California' }, loaded: true };
vi.mock('@/components/civics/useLearnerLocation', () => ({ default: () => fakeLocation }));
const { YourSenators } = await import('./StoryListen.jsx');
const t = (k, v = {}) => (k === 'story_portrait_of' ? `Official portrait of ${v.name}` : k);

describe('Your senators (story player)', () => {
  it('shows the saved state\'s two senators: names from the official list, with photos', () => {
    const html = renderToStaticMarkup(React.createElement(YourSenators, { t }));
    for (const s of officeholders.places.California.senators) expect(html).toContain(s.name);
    expect((html.match(/src="\/senator-photos\//g) || []).length).toBe(2);
    expect(html).toContain('Public domain');
  });

  it('without a saved state: points to Who Represents Me?', () => {
    fakeLocation = { location: null, loaded: true };
    const html = renderToStaticMarkup(React.createElement(YourSenators, { t }));
    expect(html).toContain('story_pick_state');
    expect(html).toContain('/learn#find-representative');
  });
});
