// Guest mode: try Amio without an account. Welcome's Start sets a flag on
// this device only (never the database, never a URL); while it is on and
// nobody is signed in, Home shows Today instead of Welcome. Nothing a guest
// does is saved to an account. Signing in ends it; Delete my data clears it
// (every `pathways_` key).

export const GUEST_KEY = 'pathways_guest';

export function startGuest() {
  try { localStorage.setItem(GUEST_KEY, '1'); } catch { /* storage blocked: guest for this page only */ }
}

export function isGuest() {
  try { return localStorage.getItem(GUEST_KEY) === '1'; } catch { return false; }
}

export function endGuest() {
  try { localStorage.removeItem(GUEST_KEY); } catch { /* nothing to clear */ }
}
