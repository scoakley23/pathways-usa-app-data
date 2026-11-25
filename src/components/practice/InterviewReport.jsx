import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { interviewSessions as interviewSessionsApi } from '@/api/interview';
import { progress as progressApi } from '@/api/progress';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { Button, Card } from '@/components/pathways/ui';
import usePracticeText from '@/components/practice/usePracticeText';
import { Amio } from '@/components/pathways/Amio';
import { isBestSoFar, reportParts, workOnNext } from '@/lib/interviewReadiness';

// The practice interview report (Amio v2: on paper, a Back button and the
// title, then the score ("n/12", "Your
// best so far"), one row per part of this interview, then Reading, Writing
// and Civics from the learner's other practice (labeled so; this interview
// doesn't test them), "Work on next", and "Only your scores are saved".
// The question-by-question detail (kept in memory only) is folded below.
// Saving happens in InterviewPractice, as before; this screen saves nothing.
// Wording in practiceStrings.js (usePracticeText).

function Status({ ready, text, readyLabel }) {
  return ready
    ? <span className="inline-flex items-center gap-1 font-bold text-correct" dir="auto">{readyLabel} <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /></span>
    : <span className="font-bold text-not-yet" dir="auto">{text}</span>;
}

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-line last:border-b-0 min-h-tap">
      <div className="min-w-0">
        <p className="text-base text-navy" dir="auto">{label}</p>
        {sub && <p className="text-small text-muted" dir="auto">{sub}</p>}
      </div>
      <div className="shrink-0 text-base">{children}</div>
    </div>
  );
}

export default function InterviewReport({ results, onRestart, onClose, onBack }) {
  const { t, rtl } = usePracticeText();
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
        const [progress, sessions, civics2025] = await Promise.all([
          progressApi.list({ contentType: 'civics_question', sort: '-last_practiced', limit: 500 }).catch(() => []),
          interviewSessionsApi.list({ sort: '-created_date', limit: 50 }).catch(() => []),
          content.civicsQuestions({ version: '2025', limit: 300 }).catch(() => []),
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
  const levelText = (part) => (other?.levels?.[part] ? t(`level_${other.levels[part]}`) : t('not_checked'));
  const fromPractice = t('from_practice');
  const partLabel = (id) => t(`ipart_${id}`);
  const leave = onBack || onClose;

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">
        <div className="flex items-start gap-2">
          {leave && (
            <button type="button" onClick={leave} aria-label={t('back')} className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
              <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0 pt-1">
            <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('report_title')}</h1>
            <p className="text-base text-muted" dir="auto">{t('report_today')}</p>
          </div>
        </div>

        <Card className="flex items-center justify-between gap-3">
          <div>
            <p className="font-extrabold leading-none tabular-nums">
              <span className="text-[3.5rem]">{passed}</span><span className="text-[1.75rem] text-muted">/{total}</span>
            </p>
            {best && <p className="mt-2 text-base font-semibold text-correct" dir="auto">{t('best_so_far')}</p>}
            <span className="sr-only">{t('passed_of', { n: passed, total })}</span>
          </div>
          <Amio mood={passed >= total * 0.7 ? 'proud' : 'kind'} size={88} />
        </Card>

        <Card padding="px-5 py-1">
          {parts.map((p) => (
            <Row key={p.id} label={partLabel(p.id)}>
              <Status ready={p.ready} readyLabel={t('status_ready')} text={t('n_of_right', { n: p.passed, total: p.total })} />
            </Row>
          ))}
          <Row label={t('part_reading')} sub={fromPractice}>
            <Status ready={other?.levels?.reading === 'strong'} readyLabel={t('status_ready')} text={levelText('reading')} />
          </Row>
          <Row label={t('part_writing')} sub={fromPractice}>
            <Status ready={other?.levels?.writing === 'strong'} readyLabel={t('status_ready')} text={levelText('writing')} />
          </Row>
          <Row label={t('part_civics')} sub={`${fromPractice} · ${t('answers_ready')}`}>
            <span className="font-bold text-navy tabular-nums">{other ? t('n_of', { n: other.civicsMastered, total: other.civicsTotal }) : '–'}</span>
          </Row>
        </Card>

        {next && (
          <Card>
            <h2 className="text-lg font-bold" dir="auto">{t('work_on')}</h2>
            <p className="mt-2 text-base leading-relaxed" dir="auto"><strong>{partLabel(next.id)}.</strong> {t(`work_${next.id}`)}</p>
            <Link to={next.link} className="mt-2 inline-flex min-h-tap items-center text-base font-semibold text-denim underline underline-offset-4" dir="auto">
              {t(`work_${next.id}_link`)}
            </Link>
          </Card>
        )}

        <p className="text-small text-muted text-center" dir="auto">{t('scores_only')}</p>

        <details className="rounded-card bg-white border border-line">
          <summary className="min-h-[52px] px-5 flex items-center cursor-pointer text-base font-semibold" dir="auto">{t('q_by_q')}</summary>
          <div className="px-3 pb-3 space-y-2">
            {results.map((r, i) => (
              <div key={i} className="rounded-card border border-line overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  aria-expanded={expandedIdx === i}
                  className="w-full min-h-[56px] flex items-center gap-3 p-3 bg-white hover:bg-tint text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-denim"
                >
                  {r.is_acceptable
                    ? <CheckCircle className="w-6 h-6 shrink-0 text-correct" aria-label={t('passed')} />
                    : <XCircle className="w-6 h-6 shrink-0 text-not-yet" aria-label={t('not_yet')} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-small font-semibold text-muted">{partLabel(r.section)}</p>
                    <p className="font-semibold" lang="en" dir="ltr">{r.question}</p>
                  </div>
                  <span className="text-base font-bold tabular-nums">{r.overall_score}</span>
                  {expandedIdx === i ? <ChevronUp className="w-5 h-5 text-muted" aria-hidden="true" /> : <ChevronDown className="w-5 h-5 text-muted" aria-hidden="true" />}
                </button>
                {expandedIdx === i && (
                  <div className="bg-tint p-4 space-y-3 text-base">
                    {r.section !== 'civics' && <p className="text-small text-muted" dir="auto">{t('scores_line', { c: r.content_score, g: r.grammar_score, f: r.fluency_score })}</p>}
                    {r.response !== '(skipped)' && <p><span className="font-semibold" dir="auto">{t('you_said')}:</span> <span lang="en" dir="ltr">“{r.response}”</span></p>}
                    {r.corrected_version && <p><span className="font-semibold" dir="auto">{r.section === 'civics' ? t('accepts') : r.understanding ? t('what_asking') : t('better_way')}:</span> <span lang="en" dir="ltr">“{r.corrected_version}”</span></p>}
                    {r.content_feedback && <p>{r.content_feedback}</p>}
                    {r.grammar_feedback && <p>{r.grammar_feedback}</p>}
                    {r.improvement_tips && <p>{r.improvement_tips}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>

        <Button variant="main" className="w-full" onClick={leave || onRestart}>{t('done')}</Button>
        {onRestart && <Button variant="second" className="w-full" onClick={onRestart}>{t('practice_again')}</Button>}
      </div>
    </div>
  );
}
