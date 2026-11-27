// Keyboard shortcuts on speaking screens (desktop vision C, "the stage").
// Space = the mic (start or stop, like tapping it), R = hear the question
// again, H = hint, Esc = close the screen. Pure, so it can be tested.
//
// A key press is ignored when:
// - the learner is typing (an input, a text area, a select or editable text),
// - Ctrl, Cmd or Alt is held (browser shortcuts stay the browser's),
// - the key is held down (auto-repeat),
// - a dialog or sheet is open (its own keys win, e.g. Esc closes the sheet),
// - for Space: a button or link has focus (Space already presses it).

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const PRESSABLE = new Set(['BUTTON', 'A', 'SUMMARY']);

// A and N are the Class screen's (show the answer, next question).
export const SHORTCUT_KEYS = { ' ': 'space', Spacebar: 'space', r: 'r', R: 'r', h: 'h', H: 'h', a: 'a', A: 'a', n: 'n', N: 'n', Escape: 'escape', Esc: 'escape' };

export function shortcutFor(event = {}, { dialogOpen = false } = {}) {
  const name = SHORTCUT_KEYS[event.key];
  if (!name) return null;
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return null;
  if (dialogOpen) return null;
  const target = event.target || {};
  const tag = String(target.tagName || '').toUpperCase();
  if (TYPING.has(tag) || target.isContentEditable) return null;
  if (name === 'space') {
    const role = typeof target.getAttribute === 'function' ? target.getAttribute('role') : null;
    if (PRESSABLE.has(tag) || role === 'button') return null;
  }
  return name;
}
