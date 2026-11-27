import { useEffect, useRef } from 'react';
import { shortcutFor } from '@/lib/keyShortcuts';

// Keyboard shortcuts on speaking screens (desktop vision C). `handlers` maps
// 'space' | 'r' | 'h' | 'escape' to a function; leave one out to ignore that
// key. The rules for when a key counts are in src/lib/keyShortcuts.js.
// Several screens can listen at once (the mic and its screen): each only
// handles its own keys.
export default function useShortcuts(handlers, enabled = true) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;
    const onKey = (event) => {
      const dialogOpen = !!document.querySelector('[role="dialog"], [role="alertdialog"]');
      const name = shortcutFor(event, { dialogOpen });
      const run = name && ref.current?.[name];
      if (!run) return;
      event.preventDefault();
      run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
