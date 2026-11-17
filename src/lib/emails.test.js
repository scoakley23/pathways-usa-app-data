// Step 5: the emails on Supabase ("Talk to a person" and the pilot check-in
// reminders). Fake people, fake addresses, a fake email service.
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { redactIdentifiers } from './redact';
import * as supportConfig from '../config/support';
import { readSupportMessage, supportEmail, SUPPORT_EMAIL, SUPPORT_SUBJECT, SUPPORT_MAX_LENGTH } from '../../supabase/functions/_shared/supportMessage.js';
import { EMAIL_FROM, resendBody, sendEmail } from '../../supabase/functions/_shared/email.js';
import { appOrigin, duePlan, reminderTextFor } from '../../supabase/functions/_shared/reminderJob.js';
import { REMINDER_BODY, REMINDER_SUBJECT } from '../../supabase/functions/_shared/pilotCheckIns.js';
import { OUT_FILE as TEXTS_FILE, reminderTextsModule } from '../../scripts/supabase/build-reminder-texts.mjs';

const ROOT = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

describe('shared copies stay the same', () => {
  it('the server\'s identifier filter is an exact copy of src/lib/redact.js', () => {
    expect(read('supabase/functions/_shared/redact.js')).toBe(read('src/lib/redact.js'));
  });
  it('the server\'s support settings match src/config/support.js', () => {
    expect({ SUPPORT_EMAIL, SUPPORT_SUBJECT, SUPPORT_MAX_LENGTH }).toEqual({
      SUPPORT_EMAIL: supportConfig.SUPPORT_EMAIL, SUPPORT_SUBJECT: supportConfig.SUPPORT_SUBJECT, SUPPORT_MAX_LENGTH: supportConfig.SUPPORT_MAX_LENGTH,
    });
  });
  it('the reminder texts are up to date with the translation pack (run `npm run email:texts`)', () => {
    expect(fs.readFileSync(TEXTS_FILE, 'utf8')).toBe(reminderTextsModule());
  });
});

describe('Talk to a person', () => {
  it('removes identifiers, keeps the message short, refuses an empty one', () => {
    const r = readSupportMessage({ message: '  Help with the app. My A-number is A123456789, call 617 555 0199, mail test@example.com  ' });
    expect(r.ok).toBe(true);
    for (const bit of ['A123456789', '617 555 0199', 'test@example.com']) expect(r.text).not.toContain(bit);
    expect(readSupportMessage({ message: 'x'.repeat(5000) }).text).toHaveLength(SUPPORT_MAX_LENGTH);
    expect(readSupportMessage({ message: '   ' }).ok).toBe(false);
    expect(readSupportMessage({ to: 'someone@example.com' }).ok).toBe(false);
  });

  it('goes only to the team inbox, with the learner\'s login email as Reply-To', () => {
    const e = supportEmail({ text: 'Fake question', replyTo: 'learner@example.test' });
    expect(e).toMatchObject({ to: SUPPORT_EMAIL, subject: SUPPORT_SUBJECT, replyTo: 'learner@example.test' });
    expect(e.text).toContain('Reply to: learner@example.test');
  });

  it('the function reads the email from the login and counts the daily limit before sending', () => {
    const src = read('supabase/functions/support-message/index.ts');
    expect(src).toMatch(/auth\.getUser\(\)/);
    expect(src).toMatch(/replyTo = \(user\?\.email/);
    expect(src.indexOf("rpc('take_ai_request', { p_kind: 'support' })")).toBeGreaterThan(-1);
    expect(src.indexOf('take_ai_request')).toBeLessThan(src.indexOf('await sendEmail('));
    expect(src).not.toMatch(/console\.\w+\([^)]*(read\.text|replyTo)/);
  });
});

describe('sending through Resend', () => {
  it('sends plain text from Pathways, with the key only in the header', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    await sendEmail({ key: 'test-key', fetchImpl, to: 'a@example.test', subject: 'Hi', text: 'Body', replyTo: 'b@example.test' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer test-key');
    expect(JSON.parse(init.body)).toEqual({ from: EMAIL_FROM, to: ['a@example.test'], subject: 'Hi', text: 'Body', reply_to: 'b@example.test' });
    expect(init.body).not.toContain('test-key');
  });
  it('fails loudly when Resend says no or no key is set', async () => {
    await expect(sendEmail({ key: 'k', fetchImpl: async () => ({ ok: false, status: 422 }), to: 'a@example.test', subject: 's', text: 't' })).rejects.toThrow('422');
    await expect(sendEmail({ key: '', to: 'a@example.test', subject: 's', text: 't' })).rejects.toThrow(/not set up/);
    expect(resendBody({ to: 'a@example.test', subject: 's', text: 't' })).not.toHaveProperty('reply_to');
  });
});

describe('pilot reminder emails', () => {
  const now = new Date('2026-11-17T12:00:00Z');
  const monthsAgo = (n, extraDays = 0) => new Date(Date.UTC(2026, 10 - n, 17 - extraDays)).toISOString();
  const authUsers = [
    { id: 'u1', email: 'One@Example.test', created_at: monthsAgo(3, 2), app_metadata: {} },
    { id: 'u2', email: 'two@example.test', created_at: monthsAgo(3, 2), app_metadata: {} },
    { id: 'u3', email: 'three@example.test', created_at: monthsAgo(3, 2), app_metadata: {} },
    { id: 'u4', email: 'four@example.test', created_at: monthsAgo(1), app_metadata: {} },
  ];
  const profiles = [
    { user_id: 'u1', checkin_email_reminders: true, reminder_language: 'es' },
    { user_id: 'u2', checkin_email_reminders: true, reminder_language: null },
    { user_id: 'u3', checkin_email_reminders: false },
    { user_id: 'u4', checkin_email_reminders: true },
  ];

  it('emails only learners with reminders on and a check-in open, once per check-in', () => {
    const plan = duePlan({ authUsers, profiles, now });
    expect(plan.map((p) => p.user_id).sort()).toEqual(['u1', 'u2']);
    expect(plan.find((p) => p.user_id === 'u1')).toMatchObject({ email: 'one@example.test', kind: expect.any(String), language: 'es' });
    expect(plan.find((p) => p.user_id === 'u2').language).toBe('en');
    const kind = plan[0].kind;
    const again = duePlan({ authUsers, profiles, reminders: [{ user_id: 'u1', kind }, { user_id: 'u2', kind }], now });
    expect(again).toEqual([]);
  });

  it('uses the pack\'s text only when it keeps the link and none of the forbidden words', () => {
    expect(reminderTextFor('es', { es: { subject: 'Una pregunta', body: 'Abra Pathways: {link}' } })).toEqual({ subject: 'Una pregunta', body: 'Abra Pathways: {link}' });
    expect(reminderTextFor('es', { es: { subject: 'Your USCIS interview', body: '{link}' } })).toEqual({ subject: REMINDER_SUBJECT, body: REMINDER_BODY });
    expect(reminderTextFor('es', { es: { subject: 'Hola', body: 'sin enlace' } }).body).toBe(REMINDER_BODY);
    expect(reminderTextFor('xx', {}).subject).toBe(REMINDER_SUBJECT);
  });

  it('links only to an https app address', () => {
    expect(appOrigin('https://app.example.test/admin?x=1')).toBe('https://app.example.test');
    expect(appOrigin('http://app.example.test')).toBe('');
    expect(appOrigin('javascript:alert(1)')).toBe('');
  });

  it('the function is admins only, checks before reading anything, and returns counts only', () => {
    const src = read('supabase/functions/pilot-reminders/index.ts');
    const adminCheck = src.indexOf("user.app_metadata?.role !== 'admin'");
    expect(adminCheck).toBeGreaterThan(-1);
    expect(adminCheck).toBeLessThan(src.indexOf('SUPABASE_SERVICE_ROLE_KEY'));
    expect(src).toMatch(/return json\(\{ sent, skipped: profiles\.length - plan\.length, failed \}\)/);
    expect(src).not.toMatch(/console\.\w+\([^)]*item\./);
  });
});

describe('the app', () => {
  it('sends email only through src/api', () => {
    const src = path.join(ROOT, 'src');
    const offenders = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(jsx?|tsx?)$/.test(e.name) && !/\.test\.js$/.test(e.name) && !p.startsWith(path.join(src, 'api') + path.sep)) {
          const text = fs.readFileSync(p, 'utf8');
          if (/SendEmail|functions\.invoke\(\s*['"](pilot-reminders|support-message)/.test(text)) offenders.push(path.relative(src, p));
        }
      }
    };
    walk(src);
    expect(offenders).toEqual([]);
  });
});

it('redactIdentifiers still comes from one place (fake data)', () => {
  expect(redactIdentifiers('SSN 123-45-6789')).toBe('SSN [removed]');
});
