import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { auth } from '@/api/auth';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button, Card, Eyebrow } from '@/components/pathways/ui';
import { Amio } from '@/components/pathways/Amio';
import { LEVELS } from '@/lib/pretest';
import { INTERVIEW_PARTS, isBestSoFar, reportParts, workOnNext } from '@/lib/interviewReadiness';

// The practice interview report (frame R30Report): the score ("n/12", "Your
// best so far"), one row per part of this interview, then Reading, Writing
// and Civics from the learner's other practice (labeled so; this interview
// doesn't test them), "Work on next", and "Only your scores are saved".
// The question-by-question detail (kept in memory only) is folded below.
// Saving happens in InterviewPractice, as before; this screen saves nothing.

const LEVEL_WORDS = Object.fromEntries(Object.entries(LEVELS).map(([k, v]) => [k, v.label]));

function Status({ ready, text }) {
  return ready
    ? <span className="inline-flex items-center gap-1 font-bold text-correct">Ready <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /></span>
    : <span className="font-bold text-not-yet">{text}</span>;
}

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-line last:border-b-0 min-h-tap">
      <div className="min-w-0">
        <p className="text-base text-navy">{label}</p>
        {sub && <p className="text-small text-muted">{sub}</p>}
      </div>
      <div className="shrink-0 text-base">{children}</div>
    </div>
  );
}

export default function InterviewReport({ results, onRestart, onClose, onBack }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [other, setOther] = useState(null); // { levels, civicsMastered, civicsTotal, sessions }

  const passed = results.filter((r) => r.is_acceptable).length;
  const total = results.length;
  const parts = reportParts(results);
  const next = workOnNext(parts);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await auth.me();
        const email = user.email.toLowerCase().trim();
        const [progress, sessions, civics2025] = await Promise.all([
          base44.entities.UserProgress.filter({ user_email: email, content_type: 'civics_question' }, '-last_practiced', 500).catch(() => []),
          base44.entities.InterviewSession.filter({ user_email: email }, '-created_date', 50).catch(() => []),
          base44.entities.CivicsQuestion.filter({ version: '2025' }, null, 300).catch(() => []),
        ]);
        if (!active) return;
        const ids = new Set(civics2025.map((q) => q.id));
        setOther({
          levels: user.skill_levels || {},
          civicsMastered: progress.filter((p) => p.status === 'mastered' && ids.has(p.content_id)).length,
          civicsTotal: civics2025.length || 128,
          sessions,
        });
      } catch (e) {
        if (active) setOther({ levels: {}, civicsMastered: 0, civicsTotal: 128, sessions: [] });
      }
    })();
    return () => { active = false; };
  }, []);

  const best = other && isBestSoFar(passed, total, other.sessions);
  const levelText = (part) => (other?.levels?.[part] ? LEVEL_WORDS[other.levels[part]] : 'Not checked yet');
  const fromPractice = 'From your practice, not this interview';
  const leave = onBack || onClose;

  return (
    <div className="min-h-screen bg-page text-navy">
      <NavyBanner
        title="Practice interview report"
        subtitle="Today"
        left={leave && (
          <button type="button" onClick={leave} aria-label="Back" className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
        )}
      />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <Card className="flex items-center justify-between gap-3">
          <div>
            <p className="font-extrabold leading-none tabular-nums">
              <span className="text-[56px]">{passed}</span><span className="text-[28px] text-muted">/{total}</span>
            </p>
            {best && <p className="mt-2 text-base font-semibold text-correct">Your best so far</p>}
            <span className="sr-only">{passed} of {total} answers passed.</span>
          </div>
          <Amio mood={passed >= total * 0.7 ? 'proud' : 'kind'} size={88} />
        </Card>

        <Card padding="px-5 py-1">
          {parts.map((p) => (
            <Row key={p.id} label={p.label}>
              <Status ready={p.ready} text={`${p.passed} of ${p.total}`} />
            </Row>
          ))}
          <Row label="Reading" sub={fromPractice}>
            <Status ready={other?.levels?.reading === 'strong'} text={levelText('reading')} />
          </Row>
          <Row label="Writing" sub={fromPractice}>
            <Status ready={other?.levels?.writing === 'strong'} text={levelText('writing')} />
          </Row>
          <Row label="Civics" sub={`${fromPractice} · answers ready`}>
            <span className="font-bold text-navy tabular-nums">{other ? `${other.civicsMastered} of ${other.civicsTotal}` : '–'}</span>
          </Row>
        </Card>

        {next && (
          <Card>
            <Eyebrow>Work on next</Eyebrow>
            <p className="mt-2 text-base leading-relaxed"><strong>{next.label}.</strong> {next.tip}</p>
            <Link to={next.link} className="mt-2 inline-flex min-h-tap items-center text-base font-semibold text-denim underline underline-offset-4">
              {next.linkLabel}
            </Link>
          </Card>
        )}

        <p className="text-small text-muted text-center">Only your scores are saved. Nothing you said is kept.</p>

        <details className="rounded-card bg-white border border-line">
          <summary className="min-h-[52px] px-5 flex items-center cursor-pointer text-base font-semibold">Question by question</summary>
          <div className="px-3 pb-3 space-y-2">
            {results.map((r, i) => (
              <div key={i} className="rounded-2xl border border-line overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  aria-expanded={expandedIdx === i}
                  className="w-full min-h-[56px] flex items-center gap-3 p-3 bg-white hover:bg-tint text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-denim"
                >
                  {r.is_acceptable
                    ? <CheckCircle className="w-6 h-6 shrink-0 text-correct" aria-label="Passed" />
                    : <XCircle className="w-6 h-6 shrink-0 text-not-yet" aria-label="Not yet" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-small font-semibold text-muted">{INTERVIEW_PARTS.find((p) => p.id === r.section)?.label || r.section}</p>
                    <p className="font-semibold">{r.question}</p>
                  </div>
                  <span className="text-base font-bold tabular-nums">{r.overall_score}</span>
                  {expandedIdx === i ? <ChevronUp className="w-5 h-5 text-muted" aria-hidden="true" /> : <ChevronDown className="w-5 h-5 text-muted" aria-hidden="true" />}
                </button>
                {expandedIdx === i && (
                  <div className="bg-tint p-4 space-y-3 text-base">
                    <p className="text-small text-muted">Content {r.content_score} · Grammar {r.grammar_score} · Fluency {r.fluency_score}</p>
                    {r.response !== '(skipped)' && <p><span className="font-semibold">You said:</span> “{r.response}”</p>}
                    {r.corrected_version && <p><span className="font-semibold">{r.understanding ? 'What the question is asking:' : 'A better way to say it:'}</span> “{r.corrected_version}”</p>}
                    {r.content_feedback && <p>{r.content_feedback}</p>}
                    {r.grammar_feedback && <p>{r.grammar_feedback}</p>}
                    {r.improvement_tips && <p>{r.improvement_tips}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>

        <Button variant="main" className="w-full" onClick={leave || onRestart}>Done</Button>
        {onRestart && <Button variant="second" className="w-full" onClick={onRestart}>Practice again</Button>}
      </div>
    </div>
  );
}
