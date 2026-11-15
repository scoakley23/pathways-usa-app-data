import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, PrimaryButton, SecondaryButton, QuietButton, PillButton } from './ui.jsx';

// The built CSS lists `.min-h-tap` after `.min-h-main`, so a button with both
// would be 44px. Main buttons must carry only `min-h-main` (56px, style guide);
// every other button keeps `min-h-tap` (44px tap target).
function classesOf(element) {
  const html = renderToStaticMarkup(element);
  const match = html.match(/class="([^"]*)"/);
  return match ? match[1].split(/\s+/).filter(Boolean) : [];
}

describe('button heights', () => {
  it.each([false, true])('main buttons are 56px only (onNavy=%s)', (onNavy) => {
    const classes = classesOf(React.createElement(Button, { variant: 'main', onNavy }, 'Start'));
    expect(classes).toContain('min-h-main');
    expect(classes).not.toContain('min-h-tap');
  });

  it.each(['next', 'second', 'link', 'text-link', 'unknown'])('%s buttons keep the 44px tap height', (variant) => {
    for (const onNavy of [false, true]) {
      const classes = classesOf(React.createElement(Button, { variant, onNavy }, 'Go'));
      expect(classes).toContain('min-h-tap');
      expect(classes).not.toContain('min-h-main');
    }
  });

  it('older button names keep the 44px tap height', () => {
    for (const Component of [PrimaryButton, SecondaryButton, QuietButton, PillButton]) {
      const classes = classesOf(React.createElement(Component, null, 'Go'));
      expect(classes).toContain('min-h-tap');
      expect(classes).not.toContain('min-h-main');
    }
  });
});
