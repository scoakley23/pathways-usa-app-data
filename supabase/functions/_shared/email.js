// Sending one email through Resend (https://resend.com), the same service
// that sends the sign-in codes. Used by the `support-message` and
// `pilot-reminders` Edge Functions; the key stays on the server
// (RESEND_API_KEY). Plain text only. Never logs the message or the address.

export const EMAIL_FROM = 'Pathways <hello@pathwaysusa.org>';
const RESEND_URL = 'https://api.resend.com/emails';

// → the Resend request body.
export function resendBody({ to, subject, text, replyTo, from = EMAIL_FROM }) {
  return {
    from,
    to: [to],
    subject: String(subject).slice(0, 200),
    text: String(text),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };
}

// Sends one email; throws Error('email failed (status)') when Resend says no.
export async function sendEmail({ key, fetchImpl = fetch, ...email }) {
  if (!key) throw new Error('email not set up');
  const res = await fetchImpl(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(resendBody(email)),
  });
  if (!res.ok) throw new Error(`email failed (${res.status})`);
}
