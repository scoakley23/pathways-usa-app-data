import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/pathways/ui';
import { checkInQuestions, buildCheckIn, choicesFor } from '@/lib/pilotCheckIns';
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
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <Card padding="p-5" className="max-w-lg w-full mx-auto text-navy">
      <form onSubmit={save} className="space-y-7" aria-labelledby="checkin-title">
        <div className="space-y-3">
          <p className="text-base font-semibold text-muted" dir="auto">{t('eyebrow')}</p>
          <h1 id="checkin-title" className="font-display text-[1.75rem] leading-tight text-navy" dir="auto">{t('checkin_title')}</h1>
          <p className="text-base text-muted">{t('small_print')}</p>
        </div>

        {(q.ask.length > 0 || q.done.length > 0) && (
          <div className="space-y-5">
            <p className="text-lg font-bold text-navy">{t('since')}</p>
            {q.done.length > 0 && (
              <ul className="space-y-2">
                {q.done.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-base text-navy">
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

        {error && <p role="alert" className="text-base font-semibold text-not-yet">{t('error')}</p>}

        <div className="flex flex-col gap-2">
          <Button variant="main" type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {saving ? t('saving') : t('save')}
          </Button>
          <Button variant="second" onClick={onNotNow} disabled={saving} className="w-full">{t('not_now')}</Button>
        </div>
      </form>
    </Card>
  );
}