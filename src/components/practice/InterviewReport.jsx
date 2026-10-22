import React, { useState } from 'react';
import { Eyebrow, RaisedCard, SecondaryButton } from '@/components/pathways/ui';
import { RotateCcw, CheckCircle, XCircle, ChevronDown, ChevronUp, Trophy, Target, BookOpen, MessageSquare } from 'lucide-react';

export default function InterviewReport({ results, questions, onRestart }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  const passed = results.filter(r => r.is_acceptable).length;
  const total = results.length;
  const passRate = Math.round((passed / total) * 100);

  const avgContent = Math.round(results.reduce((s, r) => s + (r.content_score || 0), 0) / total);
  const avgGrammar = Math.round(results.reduce((s, r) => s + (r.grammar_score || 0), 0) / total);
  const avgFluency = Math.round(results.reduce((s, r) => s + (r.fluency_score || 0), 0) / total);
  const avgOverall = Math.round(results.reduce((s, r) => s + (r.overall_score || 0), 0) / total);

  const isReady = passRate >= 70;

  const scoreColor = (s) => s >= 80 ? 'text-pw-green-ink' : s >= 60 ? 'text-pw-blue-ink' : 'text-pw-red-ink';
  const barColor = (s) => s >= 80 ? 'bg-pw-green-ink' : s >= 60 ? 'bg-pw-blue-ink' : 'bg-pw-red';

  const sectionNames = {
    small_talk: 'Small Talk',
    personal_info: 'Personal Info',
    morals_ethics: 'Morals & Ethics',
    oath_requirements: 'Oath Requirements'
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 text-pw-navy">
      {/* Header */}
      <div className={`rounded-3xl p-6 text-center space-y-5 ${isReady ? 'bg-pw-green-soft' : 'bg-pw-blue-soft'}`}>
        <div className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-raised ${isReady ? 'text-pw-green-ink' : 'text-pw-blue-ink'}`}>
          {isReady ? <Trophy className="w-8 h-8" aria-hidden="true" /> : <Target className="w-8 h-8" aria-hidden="true" />}
        </div>

        <div>
          <h2 className="text-[1.75rem] font-extrabold leading-tight mb-2">
            {isReady ? 'Interview Complete!' : 'Keep Practicing!'}
          </h2>
          <p className="text-base text-pw-muted leading-relaxed">
            {isReady
              ? 'You\'re performing well. Keep reviewing to stay sharp!'
              : 'Review the feedback below and practice your weaker areas.'}
          </p>
        </div>

        {/* Overall Score */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#FFFFFF" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none"
                className={isReady ? 'stroke-pw-green-ink' : 'stroke-pw-navy'}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - avgOverall / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold">{avgOverall}</span>
              <span className="text-sm text-pw-muted">Overall</span>
            </div>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white rounded-2xl p-4 max-w-xs mx-auto text-left">
          <p className="text-base font-bold mb-2">{passed} of {total} questions passed</p>
          <div className="h-2.5 rounded-full bg-pw-soft overflow-hidden">
            <div className={`h-full rounded-full ${isReady ? 'bg-pw-green-ink' : 'bg-pw-navy'}`} style={{ width: `${passRate}%` }} />
          </div>
          <p className={`text-sm font-bold mt-2 ${isReady ? 'text-pw-green-ink' : 'text-pw-muted'}`}>{passRate}% pass rate</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <RaisedCard>
        <h3 className="font-extrabold text-xl flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5" aria-hidden="true" /> Score Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Content Accuracy', score: avgContent, icon: CheckCircle },
            { label: 'Grammar', score: avgGrammar, icon: BookOpen },
            { label: 'Fluency', score: avgFluency, icon: MessageSquare },
          ].map(({ label, score, icon: Icon }) => (
            <div key={label} className="bg-pw-soft rounded-2xl p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1 text-pw-muted" aria-hidden="true" />
              <p className={`text-2xl font-extrabold ${scoreColor(score)}`}>{score}</p>
              <div className="w-full bg-white rounded-full h-1.5 my-2">
                <div className={`h-1.5 rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
              </div>
              <p className="text-sm text-pw-muted font-semibold leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </RaisedCard>

      {/* Per-Question Review */}
      <RaisedCard>
        <h3 className="font-extrabold text-xl flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5" aria-hidden="true" /> Question-by-Question Review
        </h3>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className="rounded-2xl border border-pw-line overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                aria-expanded={expandedIdx === i}
                className="w-full min-h-[56px] flex items-center gap-3 p-3 bg-white hover:bg-pw-soft transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pw-red"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${r.is_acceptable ? 'bg-pw-green-soft text-pw-green-ink' : 'bg-pw-red-soft text-pw-red-ink'}`}>
                  {r.is_acceptable
                    ? <CheckCircle className="w-5 h-5" aria-label="Passed" />
                    : <XCircle className="w-5 h-5" aria-label="Not passed" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-pw-muted uppercase tracking-widest">{sectionNames[r.section] || r.section}</p>
                  <p className="font-bold truncate">{r.question}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-lg font-extrabold ${scoreColor(r.overall_score)}`}>{r.overall_score}</span>
                  {expandedIdx === i ? <ChevronUp className="w-5 h-5 text-pw-muted" aria-hidden="true" /> : <ChevronDown className="w-5 h-5 text-pw-muted" aria-hidden="true" />}
                </div>
              </button>

              {expandedIdx === i && (
                <div className="bg-pw-soft p-4 space-y-3 animate-in slide-in-from-top-1">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[['Content', r.content_score], ['Grammar', r.grammar_score], ['Fluency', r.fluency_score]].map(([l, s]) => (
                      <div key={l} className="bg-white rounded-xl p-2">
                        <p className={`font-extrabold ${scoreColor(s)}`}>{s}</p>
                        <p className="text-sm text-pw-muted">{l}</p>
                      </div>
                    ))}
                  </div>

                  {r.response !== '(skipped)' && (
                    <div className="bg-white rounded-2xl p-4">
                      <Eyebrow className="mb-1">Your Response</Eyebrow>
                      <p className="italic text-pw-muted">"{r.response}"</p>
                    </div>
                  )}

                  {r.corrected_version && (
                    <div className="bg-pw-blue-soft rounded-2xl p-4">
                      <Eyebrow className="mb-1 text-pw-blue-ink">{r.understanding ? 'What the question is asking' : 'Better Version'}</Eyebrow>
                      <p className="font-bold">"{r.corrected_version}"</p>
                    </div>
                  )}

                  {r.content_feedback && (
                    <div className="bg-white rounded-2xl p-4">
                      <Eyebrow className="mb-1">{r.understanding ? 'Understanding' : 'Content Feedback'}</Eyebrow>
                      <p className="leading-relaxed">{r.content_feedback}</p>
                    </div>
                  )}
                  {r.grammar_feedback && (
                    <div className="bg-white rounded-2xl p-4">
                      <Eyebrow className="mb-1">Grammar Feedback</Eyebrow>
                      <p className="leading-relaxed">{r.grammar_feedback}</p>
                    </div>
                  )}
                  {r.improvement_tips && (
                    <div className="bg-white rounded-2xl p-4">
                      <Eyebrow className="mb-1">Tips</Eyebrow>
                      <p className="leading-relaxed">{r.improvement_tips}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </RaisedCard>

      {/* Restart */}
      <div className="pb-4">
        <SecondaryButton onClick={onRestart} className="w-full min-h-[52px]">
          <RotateCcw className="w-5 h-5" aria-hidden="true" /> Practice Again
        </SecondaryButton>
      </div>
    </div>
  );
}
