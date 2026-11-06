// Program fields the app's screens need. The app may not import
// base44/shared/, so these mirror base44/shared/partners.js (used by the
// partner function). Change both files together.
// Kept free of imports so tests and programLink can use it without the SDK.

export const MAX_NAME_LENGTH = 60;
export const SKILLS = ['civics', 'reading', 'writing', 'speaking'];
export const LEVELS = ['start_here', 'getting_there', 'strong'];
export const normalizeEmail = (email) => String(email || '').toLowerCase().trim();
export const normalizeCode = (code) => String(code || '').trim().toUpperCase().replace(/\s+/g, '-').slice(0, 40);