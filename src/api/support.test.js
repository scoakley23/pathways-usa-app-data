// src/api/support.js: "Talk to a person". Fake addresses and a fake backend.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { integrations: { Core: {} } } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null, supabaseConfigured: () => false }));

const { createSupportApi, SupportLimitError } = await import('./support');

const MESSAGE = 'Fake question about the app. Call me at 617 555 0199.';

describe('switch on (Supabase)', () => {
  it('sends only the message, with identifiers removed (the server reads the email itself)', async () => {
    const invoke = vi.fn(async () => ({ data: { ok: true }, error: null }));
    await createSupportApi({ provider: 'supabase', supabase: { functions: { invoke } } }).send({ message: MESSAGE, replyTo: 'me@example.test' });
    expect(invoke).toHaveBeenCalledWith('support-message', { body: { message: 'Fake question about the app. Call me at [removed].' } });
  });
  it('a 429 is the daily limit', async () => {
    const invoke = vi.fn(async () => ({ data: null, error: { context: { status: 429 } } }));
    await expect(createSupportApi({ provider: 'supabase', supabase: { functions: { invoke } } }).send({ message: 'Hi' })).rejects.toBeInstanceOf(SupportLimitError);
  });
});

describe('switch off (Base44)', () => {
  it('emails the team inbox as before, with identifiers removed', async () => {
    const SendEmail = vi.fn(async () => ({}));
    await createSupportApi({ provider: 'base44', base44: { integrations: { Core: { SendEmail } } } }).send({ message: MESSAGE, replyTo: 'Me@Example.test' });
    const [email] = SendEmail.mock.calls[0];
    expect(email.to).toBe('pathwaysusacitizenship@gmail.com');
    expect(email.body).not.toContain('617 555 0199');
    expect(email.body).toContain('Reply to: me@example.test');
  });
  it('sends nothing for an empty message', async () => {
    const SendEmail = vi.fn();
    await expect(createSupportApi({ provider: 'base44', base44: { integrations: { Core: { SendEmail } } } }).send({ message: '  ' })).rejects.toThrow();
    expect(SendEmail).not.toHaveBeenCalled();
  });
});
