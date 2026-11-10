import React, { useState } from 'react';
import { Eyebrow, RaisedCard } from '@/components/pathways/ui';
import RoundComplete from './RoundComplete';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, BookOpen, MessageSquare } from 'lucide-react';

export default function InterviewReport({ results, onRestart, onClose, onBack, name = '' }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  const passed = results.filter(r => r.is_acceptable).length;
  const total = results.length;
  const passRate = Math.round((passed / total) * 100);

  const avgContent = Math.round(results.reduce((s, r) => s + (r.content_score || 0), 0) / total);
  const avgGrammar = Math.round(results.reduce((s, r) => s + (r.grammar_score || 0), 0) / total);
  const avgFluency = Math.round(results.reduce((s, r) => s + (r.fluency_score || 0), 0) / total);
  const avgOverall = Math.round(results.reduce((s, r) => s + (r.overall_score || 0), 0) / total);


  const scoreColor = (s) => s >= 80 ? 'text-pw-green-ink' : s >= 60 ? 'text-pw-blue-ink' : 'text-pw-red-ink';
  const barColor = (s) => s >= 80 ? 'bg-pw-green-ink' : s >= 60 ? 'bg-pw-blue-ink' : 'bg-pw-red-ink';

  const sectionNames = {
    small_talk: 'Small Talk',
    personal_info: 'Personal Info',
    morals_ethics: 'Morals & Ethics',
    oath_requirements: 'Oath Requirements'
  };

  // The end of a mock interview (The Road): the Round complete screen, with
  // one star per question (acceptable or not), "n of m passed", the overall
  // score, then the existing report (score breakdown, question by question).
  // Only the scores the app already has; saving happens in InterviewPractice.
  return (
    <RoundComplete
      outcomes={results.map((r) => (r.is_acceptable ? 'right' : 'missed'))}
      title={`${passed} of ${total} passed. Nice work${name ? `, ${name}` : ''}.`}
      rule={`Overall score ${avgOverall} of 100 · ${passRate}% passed.`}
      onClose={onClose}
      onAgain={onRestart}
      onBack={onBack}
    >
      <div className="space-y-4 text-ink">
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
                className="w-full min-h-[56px] flex items-center gap-3 p-3 bg-white hover:bg-pw-soft transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pw-navy"
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

      </div>
    </RoundComplete>
  );
}
