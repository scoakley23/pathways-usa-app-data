// "Talk to a person" on the server (`support-message` Edge Function): the
// learner's message to the team inbox. The settings are an exact copy of
// src/config/support.js (a test checks they match). Identifiers are removed
// from the message (redact.js); the learner's own login email goes in
// Reply-To so the team can answer. Nothing is saved.
import { redactIdentifiers } from './redact.js';

export const SUPPORT_EMAIL = 'pathwaysusacitizenship@gmail.com';
export const SUPPORT_SUBJECT = 'Pathways USA question';
export const SUPPORT_MAX_LENGTH = 1000;

// body = { message } from the phone → { ok, text } or { ok: false, error }.
export function readSupportMessage(body) {
  const raw = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!raw) return { ok: false, error: 'Please write a message.' };
  const text = redactIdentifiers(raw.slice(0, SUPPORT_MAX_LENGTH));
  return text ? { ok: true, text } : { ok: false, error: 'Please write a message.' };
}

// The email to the team. `replyTo` is the learner's login email (from the
// server, never from the phone).
export function supportEmail({ text, replyTo }) {
  return {
    to: SUPPORT_EMAIL,
    subject: SUPPORT_SUBJECT,
    replyTo,
    text: `${text}\n\n---\nReply to: ${replyTo}\nSent from the "Talk to a person" form in the Pathways USA app. This message is not stored in the app.`,
  };
}
