import React, { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import PageNotFound from '@/lib/PageNotFound';
import { RaisedCard, SecondaryButton, Eyebrow } from '@/components/pathways/ui';
import { Switch } from '@/components/ui/switch';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { US_STATES, PROGRAM_BASELINE } from '@/config/pilot';
import {
  pilotMetrics, formatCount, formatShare, toCsv, ACTIVATION_DAYS,
} from '../../../base44/shared/pilotReport.js';
import WeeklyChart from './WeeklyChart';

// /admin/pilot: the pilot dashboard. Admins only; everyone else sees "Page
// Not Found". The data comes from the pilot-report function as one summary
// per learner keyed by pilot_id; no emails or names reach this page.
// "Partner view" shows the same exact numbers without the CSV download.

const MILESTONE_LABELS = {
  filed: 'Filed the N-400',
  interviewed: 'Had the interview',
  passed_tests: 'Passed the tests',
  oath: 'Took the oath',
  registered_to_vote: 'Registered to vote',
};
const WINDOW_LABELS = { month_3: '3 months', month_6: '6 months', month_12: '12 months' };
const STAGE_LABELS = { not_filed: 'Not filed yet', filed_waiting: 'Filed, waiting', interview_scheduled: 'Interview scheduled', prefer_not: "Rather not say", not_answered: 'Not answered' };
const STATE_NAMES = Object.fromEntries(US_STATES);
const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES.map((l) => [l.value, l.label]));
const pct = (x) => `${Math.round(x * 100)}%`;

function Stat({ title, value, definition, children }) {
  return (
    <RaisedCard className="space-y-2">
      <h2 className="text-base font-semibold text-pw-muted">{title}</h2>
      <p className="font-display text-[32px] leading-tight text-pw-navy">{value}</p>
      {children}
      <p className="text-sm text-pw-muted">{definition}</p>
    </RaisedCard>
  );
}

function CountList({ counts, names = {} }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <p className="text-base text-pw-muted">No answers yet.</p>;
  return (
    <ul className="divide-y divide-pw-line">
      {entries.map(([key, count]) => (
        <li key={key} className="flex justify-between gap-3 py-1.5 text-base">
          <span className="min-w-0">{names[key] || STAGE_LABELS[key] || key}</span>
          <span className="font-semibold shrink-0">{formatCount(count)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PilotDashboard() {
  const [me, setMe] = useState(undefined);
  const [summaries, setSummaries] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState('all');
  const [partner, setPartner] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('pilot-report', {});
      setSummaries(res.data.summaries || []);
      setGeneratedAt(res.data.generated_at);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load the pilot data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me?.role === 'admin') load();
  }, [me]);

  const programs = useMemo(() => [...new Set((summaries || []).map((s) => s.program_code).filter(Boolean))].sort(), [summaries]);
  const filtered = useMemo(() => {
    const all = summaries || [];
    if (program === 'all') return all;
    if (program === 'none') return all.filter((s) => !s.program_code);
    return all.filter((s) => s.program_code === program);
  }, [summaries, program]);
  const m = useMemo(() => pilotMetrics(filtered), [filtered]);

  if (me === undefined) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-pw-navy" aria-label="Loading" /></div>;
  }
  if (!me || me.role !== 'admin') return <PageNotFound />;

  const share = (c, of) => formatShare(c, of);
  const count = (c) => formatCount(c);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pathways-pilot-${program}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 text-pw-navy">
      <PageHeader tag="Admin" title="Pilot dashboard" subtitle="One row per learner, by a random pilot ID. No emails or names are on this page or in the CSV." />

      <RaisedCard className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4">
        <div className="space-y-1">
          <label htmlFor="pilot-program" className="text-base font-bold block">Program code</label>
          <select
            id="pilot-program"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="w-full sm:w-56 min-h-11 rounded-xl border-2 border-pw-line bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
          >
            <option value="all">All learners</option>
            {programs.map((p) => <option key={p} value={p}>{p}</option>)}
            <option value="none">No program code</option>
          </select>
        </div>
        <div className="flex items-center gap-3 min-h-11">
          <Switch id="pilot-partner" checked={partner} onCheckedChange={setPartner} />
          <label htmlFor="pilot-partner" className="text-base font-bold">Partner view</label>
        </div>
        {/* The CSV is never for partners: it has one row per learner. */}
        {!partner && (
          <SecondaryButton onClick={downloadCsv} disabled={!summaries || filtered.length === 0}>
            <Download className="w-4 h-4" aria-hidden="true" /> Download CSV
          </SecondaryButton>
        )}
        <SecondaryButton onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-4 h-4" aria-hidden="true" />} Refresh
        </SecondaryButton>
      </RaisedCard>

      {partner && (
        <p role="status" className="rounded-[14px] bg-pw-soft px-4 py-3 text-base">
          Partner view: exact numbers, no CSV download. Report counts ("11 of 30"), not only percentages.
        </p>
      )}
      {error && <p role="alert" className="text-base font-semibold text-pw-red-ink">{error}</p>}
      {!summaries && !error && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pw-navy" aria-label="Loading" /></div>}

      {summaries && (
        <>
          {generatedAt && <p className="text-sm text-pw-muted">Data as of {new Date(generatedAt).toLocaleString()}.</p>}

          <section aria-labelledby="pilot-use" className="space-y-3">
            <h2 id="pilot-use" className="font-display text-[28px]">Sign-ups and use</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat title="Sign-ups" value={count(m.signups.count)} definition="Learners with a student profile (tutors and admins left out).">
                <p className="text-base">{count(m.signups.withCode)} with a program code</p>
              </Stat>
              <Stat title="Activation" value={share(m.activation.count, m.activation.of)} definition={`Finished at least 1 Mock Interview within ${ACTIVATION_DAYS} days of sign-up, of learners who signed up at least ${ACTIVATION_DAYS} days ago. Interview Day saves nothing, so it doesn't count.`} />
              <Stat title="Still active in week 4" value={share(m.retention.week_4.count, m.retention.week_4.of)} definition="Opened the app on days 22–28 after sign-up, of learners who have reached week 4." />
              <Stat title="Still active in week 8" value={share(m.retention.week_8.count, m.retention.week_8.of)} definition="Opened the app on days 50–56 after sign-up, of learners who have reached week 8.">
                <p className="text-base">{PROGRAM_BASELINE.label}: about {pct(PROGRAM_BASELINE.retention)} stay (the program's own measure).</p>
              </Stat>
            </div>
            <RaisedCard className="space-y-3">
              <h3 className="text-lg font-bold">Weekly active learners</h3>
              <WeeklyChart weeks={m.weekly} />
              <p className="text-sm text-pw-muted">Learners who opened the app at least once that week (ISO weeks, Monday to Sunday).</p>
            </RaisedCard>
          </section>

          <section aria-labelledby="pilot-practice" className="space-y-3">
            <h2 id="pilot-practice" className="font-display text-[28px]">Practice and readiness</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat title="Mock interviews completed" value={count(m.practice.mocks)} definition="Saved Mock Interviews (Practice), all learners.">
                <p className="text-base">{count(m.practice.learnersWithMocks)} learners did at least one</p>
              </Stat>
              <Stat
                title="Mock interview score, first → latest"
                value={m.practice.scoreN === 0 ? '—' : `${m.practice.firstScore} → ${m.practice.latestScore}`}
                definition={`Average overall score (0–100), learners with 2 or more mock interviews (n = ${count(m.practice.scoreN)}).`}
              />
              <Stat title="Civics questions mastered" value={count(m.practice.civicsMastered)} definition="Questions marked mastered in practice, 2025 test, all learners together." />
              <Stat
                title="Readiness, sign-up → latest"
                value={m.readiness.n === 0 ? '—' : `${m.readiness.signup} → ${m.readiness.latest}`}
                definition={`Average of "How ready do you feel?" (1–5), learners who answered at sign-up and again later (n = ${count(m.readiness.n)}).`}
              />
            </div>
          </section>

          <section aria-labelledby="pilot-outcomes" className="space-y-3">
            <h2 id="pilot-outcomes" className="font-display text-[28px]">Check-ins and milestones</h2>
            <p className="text-base text-pw-muted">Self-reported and optional. People who passed are more likely to answer, and "when" is only as exact as the check-in window.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(m.responses).map(([kind, r]) => (
                <Stat key={kind} title={`${WINDOW_LABELS[kind]} check-in answered`} value={share(r.count, r.of)} definition={`Answered, of learners whose ${WINDOW_LABELS[kind]} check-in has opened.`} />
              ))}
            </div>
            <RaisedCard className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-base">
                <caption className="text-left text-lg font-bold pb-2">Milestones: first said Yes</caption>
                <thead>
                  <tr className="text-pw-muted">
                    <th className="font-semibold py-1.5">Milestone</th>
                    <th className="font-semibold py-1.5">Said Yes</th>
                    {Object.values(WINDOW_LABELS).map((w) => <th key={w} className="font-semibold py-1.5">At {w}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(m.milestones).map(([key, row]) => (
                    <tr key={key} className="border-t border-pw-line">
                      <td className="py-1.5">{MILESTONE_LABELS[key]}</td>
                      <td className="py-1.5 font-semibold">{share(row.count, row.of)}</td>
                      {Object.keys(WINDOW_LABELS).map((w) => <td key={w} className="py-1.5">{count(row.byWindow[w] || 0)}</td>)}
                    </tr>
                  ))}
                  <tr className="border-t border-pw-line">
                    <td className="py-1.5">Passed on the first try</td>
                    <td className="py-1.5 font-semibold" colSpan={4}>{share(m.passedFirstTry.count, m.passedFirstTry.of)} · {PROGRAM_BASELINE.label}: {pct(PROGRAM_BASELINE.firstTryPass)}</td>
                  </tr>
                  <tr className="border-t border-pw-line">
                    <td className="py-1.5">Needed a retest</td>
                    <td className="py-1.5 font-semibold" colSpan={4}>{share(m.neededRetest.count, m.neededRetest.of)}</td>
                  </tr>
                </tbody>
              </table>
            </RaisedCard>
            <RaisedCard className="space-y-2">
              <h3 className="text-lg font-bold">"Would you have done this as soon without Pathways?"</h3>
              <CountList counts={m.wouldHave} names={{ yes: 'Yes', maybe: 'Maybe', no: 'No', prefer_not: 'Rather not say' }} />
              <p className="text-sm text-pw-muted">Latest answer per learner, asked only after a new Yes.</p>
            </RaisedCard>
          </section>

          <section aria-labelledby="pilot-reach" className="space-y-3">
            <h2 id="pilot-reach" className="font-display text-[28px]">Reach</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <RaisedCard className="space-y-2"><Eyebrow>By state</Eyebrow><CountList counts={m.reach.state} names={{ ...STATE_NAMES, prefer_not: 'Rather not say' }} /></RaisedCard>
              <RaisedCard className="space-y-2"><Eyebrow>By app language</Eyebrow><CountList counts={m.reach.language} names={LANGUAGE_NAMES} /></RaisedCard>
              <RaisedCard className="space-y-2"><Eyebrow>By stage at sign-up</Eyebrow><CountList counts={m.reach.stage} /></RaisedCard>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
