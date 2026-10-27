import React, { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Eyebrow, RaisedCard, SecondaryButton } from '@/components/pathways/ui';

// Admin-only pilot tools.
// - "Send due reminders": Base44 can't run a daily job from this repo, so an
//   admin presses this weekly. The pilot-reminders function emails learners
//   who asked for reminders and have a check-in due, once per window, and
//   returns counts only (never who).
// - Testing: "Pretend I signed up N months ago" on the admin's own account
//   (User.pilot_test_months_ago, ignored for non-admins), so Today shows the
//   check-in card and the reminder can be sent to yourself.
const MONTH_CHOICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function PilotAdminTool({ currentUser }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [months, setMonths] = useState(
    Number.isInteger(currentUser?.pilot_test_months_ago) ? String(currentUser.pilot_test_months_ago) : '',
  );

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('pilot-reminders', { action: 'send', appUrl: window.location.origin });
      setResult(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Could not send reminders.');
    } finally {
      setSending(false);
    }
  };

  const saveMonths = async (value) => {
    setMonths(value);
    try {
      await base44.auth.updateMe({ pilot_test_months_ago: value === '' ? null : Number(value) });
      toast.success(value === '' ? 'Using your real sign-up date.' : `Pretending you signed up ${value} months ago. Reload Today to see it.`);
    } catch (err) {
      toast.error('Could not save.');
    }
  };

  return (
    <RaisedCard className="space-y-6">
      <div className="space-y-2">
        <Eyebrow>Pilot</Eyebrow>
        <h2 className="font-display text-[28px] leading-tight text-pw-navy">Check-in reminders</h2>
        <p className="text-base text-pw-muted">
          Emails learners who turned reminders on and have a 3-, 6- or 12-month check-in open now (30 days from when it opens). Each learner gets one email per check-in.
          Press this once a week. Only counts are shown.
        </p>
      </div>
      <div className="space-y-3">
        <SecondaryButton onClick={send} disabled={sending}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Mail className="w-4 h-4" aria-hidden="true" />}
          Send due reminders
        </SecondaryButton>
        {result && (
          <p role="status" className="text-base text-pw-navy">
            Sent {result.sent}. Nothing due for {result.skipped}.{result.failed ? ` Failed: ${result.failed}.` : ''}
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-pw-line pt-5">
        <label htmlFor="pilot-test-months" className="text-lg font-bold text-pw-navy block">Testing: pretend I signed up…</label>
        <p className="text-base text-pw-muted">Only changes your own admin account. 3, 6 or 12 opens that check-in today.</p>
        <select
          id="pilot-test-months"
          value={months}
          onChange={(e) => saveMonths(e.target.value)}
          className="w-full sm:w-64 min-h-11 rounded-xl border-2 border-pw-line bg-white px-3 text-base text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
        >
          <option value="">My real sign-up date</option>
          {MONTH_CHOICES.map((n) => <option key={n} value={String(n)}>{n} months ago</option>)}
        </select>
      </div>
    </RaisedCard>
  );
}
