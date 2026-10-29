import { normalizeCode } from '../../base44/shared/partners.js';

// A partner's share link: /?program=CODE. The code waits on this device
// (through the sign-in) so the program question can start with it picked.
export const PENDING_PROGRAM_KEY = 'pathways_program';
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
const remove = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };

export function rememberProgramFromUrl(search) {
  const code = normalizeCode(new URLSearchParams(search || '').get('program'));
  if (!/^[A-Z0-9-]{2,40}$/.test(code)) return null;
  set(PENDING_PROGRAM_KEY, code);
  return code;
}
export const loadPendingProgram = () => get(PENDING_PROGRAM_KEY) || '';
export const clearPendingProgram = () => remove(PENDING_PROGRAM_KEY);

export const shareLink = (code, origin = window.location.origin) => `${origin}/?program=${encodeURIComponent(normalizeCode(code))}`;
