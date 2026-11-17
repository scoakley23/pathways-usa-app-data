// "Talk to a person" (Step 5): the learner's message to the Pathways team.
// Nothing is saved in the app; the message lives only in the team's inbox.
// Emails, phone numbers, A-numbers and Social Security numbers are removed
// from the message first (src/lib/redact.js).
//
// Switch on (Supabase): the Edge Function `support-message`, which reads the
// learner's email from their login (Reply-To), removes identifiers again,
// counts the daily limit (SUPPORT_DAILY_LIMIT) and sends through Resend.
// Over the limit → SupportLimitError. Switch off (Base44): Base44's
// SendEmail, as before, with the account email in the message.
import { PROVIDER } from '@/api/provider';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { redactIdentifiers } from '@/lib/redact';
import { SUPPORT_EMAIL, SUPPORT_MAX_LENGTH, SUPPORT_SUBJECT } from '@/config/support';

export class SupportLimitError extends Error {
  constructor() {
    super('limit');
    this.name = 'SupportLimitError';
    this.limit = true;
  }
}

export function createSupportApi({ provider = PROVIDER, base44: b44 = base44, supabase = getSupabase } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  return {
    // message: what the learner typed. replyTo: their account email (Base44
    // only; on Supabase the server reads it from the login).
    async send({ message, replyTo }) {
      const text = redactIdentifiers(String(message || '').slice(0, SUPPORT_MAX_LENGTH));
      if (!text) throw new Error('empty message');
      if (provider === 'supabase') {
        const { error } = await sb().functions.invoke('support-message', { body: { message: text } });
        if (error) {
          if (error.context?.status === 429) throw new SupportLimitError();
          throw new Error('The message was not sent.');
        }
        return;
      }
      const me = String(replyTo || '').toLowerCase().trim();
      await b44.integrations.Core.SendEmail({
        to: SUPPORT_EMAIL,
        subject: SUPPORT_SUBJECT,
        from_name: 'Pathways USA',
        body: `${text}\n\n---\nReply to: ${me}\nSent from the "Talk to a person" form in the Pathways USA app. This message is not stored in the app.`,
      });
    },
  };
}

export const support = createSupportApi();
