import { describe, expect, it } from 'vitest';
import { shortcutFor } from './keyShortcuts';

const on = (tagName, extra = {}) => ({ tagName, getAttribute: () => null, ...extra });

describe('shortcutFor', () => {
  it('knows Space, R, H and Esc', () => {
    expect(shortcutFor({ key: ' ', target: on('BODY') })).toBe('space');
    expect(shortcutFor({ key: 'r', target: on('BODY') })).toBe('r');
    expect(shortcutFor({ key: 'H', target: on('DIV') })).toBe('h');
    expect(shortcutFor({ key: 'Escape', target: on('BODY') })).toBe('escape');
    expect(shortcutFor({ key: 'n', target: on('BODY') })).toBe('n');
    expect(shortcutFor({ key: 'A', target: on('BODY') })).toBe('a');
    expect(shortcutFor({ key: 'x', target: on('BODY') })).toBe(null);
  });

  it('never fires while the learner types', () => {
    for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(shortcutFor({ key: 'r', target: on(tag) })).toBe(null);
      expect(shortcutFor({ key: ' ', target: on(tag) })).toBe(null);
    }
    expect(shortcutFor({ key: 'h', target: on('DIV', { isContentEditable: true }) })).toBe(null);
  });

  it('leaves Space to a focused button or link', () => {
    expect(shortcutFor({ key: ' ', target: on('BUTTON') })).toBe(null);
    expect(shortcutFor({ key: ' ', target: on('A') })).toBe(null);
    expect(shortcutFor({ key: ' ', target: on('DIV', { getAttribute: (n) => (n === 'role' ? 'button' : null) }) })).toBe(null);
    // Letters still work from a focused button.
    expect(shortcutFor({ key: 'r', target: on('BUTTON') })).toBe('r');
  });

  it('ignores browser shortcuts, held keys and open dialogs', () => {
    expect(shortcutFor({ key: 'r', ctrlKey: true, target: on('BODY') })).toBe(null);
    expect(shortcutFor({ key: 'r', metaKey: true, target: on('BODY') })).toBe(null);
    expect(shortcutFor({ key: 'h', altKey: true, target: on('BODY') })).toBe(null);
    expect(shortcutFor({ key: ' ', repeat: true, target: on('BODY') })).toBe(null);
    expect(shortcutFor({ key: 'Escape', target: on('BODY') }, { dialogOpen: true })).toBe(null);
  });
});
