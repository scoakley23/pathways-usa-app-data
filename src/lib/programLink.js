import { normalizeCode } from './partnerFields';

// A partner's share link: /?program=CODE. The code waits on this device
// (through the sign-in) so the program question can start with it picked.
export const PENDING_PROGRAM_KEY = 'pathways_program';
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
const remove = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };

// A code typed on Welcome ("I have a code from my tutor", Prompt 9) waits the
// same way. Returns the cleaned code, or null when it can't be a code.
export function rememberProgramCode(raw) {
  const code = normalizeCode(raw);
  if (!/^[A-Z0-9-]{2,40}$/.test(code)) return null;
  set(PENDING_PROGRAM_KEY, code);
  return code;
}

export function rememberProgramFromUrl(search) {
  return rememberProgramCode(new URLSearchParams(search || '').get('program'));
}
export const loadPendingProgram = () => get(PENDING_PROGRAM_KEY) || '';
export const clearPendingProgram = () => remove(PENDING_PROGRAM_KEY);

export const shareLink = (code, origin = window.location.origin) => `${origin}/?program=${encodeURIComponent(normalizeCode(code))}`;