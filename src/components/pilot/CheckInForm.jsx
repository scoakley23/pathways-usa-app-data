import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { RaisedCard, PrimaryButton, QuietButton, Eyebrow } from '@/components/pathways/ui';
import { checkInQuestions, buildCheckIn, choicesFor } from '../../../base44/shared/pilotCheckIns.js';
import usePilotText from './pilotStrings';
import { saveCheckIn } from './checkInData';
import { ChoiceQuestion, ReadinessQuestion } from './PilotFields';

// The 3-, 6- or 12-month check-in: one screen, every question optional with
// "I'd rather not say". Milestones already answered "Yes" show as done.
// Saves one OutcomeCheckIn of `kind` (nothing if nothing was answered).
export default function CheckInForm({ kind, rows = [], user, language = 'en', onDone, onNotNow }) {
  const t = usePilotText(language);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const q = checkInQuestions({ rows, answers });
  const set = (field) => (value) => setAnswers((a) => ({ ...a, [field]: value }));

  const save = async (e) => {
    e.preventDefault();
    const checkIn = buildCheckIn({ kind, rows, answers });
    if (!checkIn) {
      onNotNow?.();
      return;
    }
    setSaving(true);
    setError(false);
    try {
      await saveCheckIn(user.email, checkIn);
      onDone?.(checkIn);
    } catch (err) {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <RaisedCard padding="p-5 sm:p-8" className="max-w-2xl w-full mx-auto">
      <form onSubmit={save} className="space-y-7" aria-labelledby="checkin-title">
        <div className="space-y-3">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h1 id="checkin-title" className="font-display text-[36px] leading-tight text-pw-navy">{t('checkin_title')}</h1>
          <p className="text-base text-pw-muted">{t('small_print')}</p>
        </div>

        {(q.ask.length > 0 || q.done.length > 0) && (
          <div className="space-y-5">
            <p className="text-lg font-bold text-pw-navy">{t('since')}</p>
            {q.done.length > 0 && (
              <ul className="space-y-2">
                {q.done.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-base text-pw-navy">
                    <Check className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span><span className="sr-only">{t('done_label')}: </span>{t(`m_${m}`)}</span>
                  </li>
                ))}
              </ul>
            )}
            {q.ask.map((m) => (
              <ChoiceQuestion
                key={m}
                inline
                label={t(`m_${m}`)}
                value={answers[m] || ''}
                onChange={set(m)}
                options={choicesFor(m).map((c) => [c, t(c)])}
                t={t}
              />
            ))}
          </div>
        )}

        {q.confidence && (
          <ReadinessQuestion label={t('ready_now')} value={answers.confidence || ''} onChange={set('confidence')} t={t} />
        )}

        {q.wouldHave && (
          <ChoiceQuestion
            inline
            label={t('would_have')}
            value={answers.would_have_without_pathways || ''}
            onChange={set('would_have_without_pathways')}
            options={[['yes', t('yes')], ['maybe', t('maybe')], ['no', t('no')]]}
            t={t}
          />
        )}

        {error && <p role="alert" className="text-base font-semibold text-pw-red-ink">{t('error')}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <QuietButton onClick={onNotNow} disabled={saving} className="w-full sm:w-auto">{t('not_now')}</QuietButton>
          <PrimaryButton type="submit" disabled={saving} large className="w-full sm:w-auto">
            {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {saving ? t('saving') : t('save')}
          </PrimaryButton>
        </div>
      </form>
    </RaisedCard>
  );
}
