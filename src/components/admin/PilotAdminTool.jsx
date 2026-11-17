import React, { useState } from 'react';
import { Loader2, Mail, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { pilotApi } from '@/api/pilot';
import { auth } from '@/api/auth';
import { Eyebrow, RaisedCard, SecondaryButton } from '@/components/pathways/ui';

// Admin-only pilot tools.
// - "Send due reminders": an admin presses this weekly (src/api/pilot.js:
//   Base44's function, or the Supabase Edge Function on the switch). The pilot-reminders function emails learners
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
      setResult(await pilotApi.sendReminders(window.location.origin));
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Could not send reminders.');
    } finally {
      setSending(false);
    }
  };

  const saveMonths = async (value) => {
    setMonths(value);
    try {
      await auth.updateMe({ pilot_test_months_ago: value === '' ? null : Number(value) });
      toast.success(value === '' ? 'Using your real sign-up date.' : `Pretending you signed up ${value} months ago. Reload Today to see it.`);
    } catch (err) {
      toast.error('Could not save.');
    }
  };

  return (
    <RaisedCard className="space-y-6">
      <div className="space-y-2">
        <Eyebrow>Pilot</Eyebrow>
        <h2 className="font-display text-[28px] leading-tight text-navy">Check-in reminders</h2>
        <p className="text-base text-muted">
          Emails learners who turned reminders on and have a 3-, 6- or 12-month check-in open now (30 days from when it opens). Each learner gets one email per check-in.
          Press this once a week. Only counts are shown.
        </p>
      </div>
      <Link to="/admin/pilot" className="inline-flex items-center gap-2 min-h-11 rounded-xl border-2 border-navy bg-white px-4 text-base font-semibold text-navy hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
        <BarChart3 className="w-4 h-4" aria-hidden="true" /> Open the pilot dashboard
      </Link>
      <div className="space-y-3">
        <SecondaryButton onClick={send} disabled={sending}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Mail className="w-4 h-4" aria-hidden="true" />}
          Send due reminders
        </SecondaryButton>
        {result && (
          <p role="status" className="text-base text-navy">
            Sent {result.sent}. Nothing due for {result.skipped}.{result.failed ? ` Failed: ${result.failed}.` : ''}
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-line pt-5">
        <label htmlFor="pilot-test-months" className="text-lg font-bold text-navy block">Testing: pretend I signed up…</label>
        <p className="text-base text-muted">Only changes your own admin account. 3, 6 or 12 opens that check-in today.</p>
        <select
          id="pilot-test-months"
          value={months}
          onChange={(e) => saveMonths(e.target.value)}
          className="w-full sm:w-64 min-h-11 rounded-xl border-2 border-line bg-white px-3 text-base text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          <option value="">My real sign-up date</option>
          {MONTH_CHOICES.map((n) => <option key={n} value={String(n)}>{n} months ago</option>)}
        </select>
      </div>
    </RaisedCard>
  );
}
