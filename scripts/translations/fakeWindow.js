// A bare stand-in for the browser's `window`, so the translation source list
// can import screen files to read their fixed English lines. Nothing is drawn.
export function installFakeWindow() {
  if (typeof globalThis.window !== 'undefined') return;
  const noop = () => {};
  const storage = { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 };
  globalThis.window = {
    self: {}, top: {}, location: { href: 'http://localhost/', origin: 'http://localhost', pathname: '/', search: '', hash: '' },
    history: { replaceState: noop }, localStorage: storage, sessionStorage: storage,
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop,
    matchMedia: () => ({ matches: false, addListener: noop, removeListener: noop, addEventListener: noop, removeEventListener: noop }),
    navigator: { userAgent: 'node', language: 'en' },
  };
  globalThis.localStorage = storage;
  globalThis.document = { title: '', documentElement: { lang: 'en', dir: 'ltr', style: {} }, addEventListener: noop, removeEventListener: noop, querySelector: () => null, getElementById: () => null, createElement: () => ({ style: {}, setAttribute: noop, appendChild: noop }), head: { appendChild: noop }, body: { appendChild: noop } };
}
