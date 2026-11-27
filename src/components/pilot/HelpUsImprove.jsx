import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from '@/api/auth';
import { Button, Card } from '@/components/pathways/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { buildSignupAnswers, stageFromOnboarding } from '@/lib/pilot';
import { loadStage } from '@/lib/onboarding';
import usePilotText from './pilotStrings';
import { saveCheckIn } from './checkInData';
import { ChoiceQuestion, ReadinessQuestion, StateSelect } from './PilotFields';

// "Help us improve Amio": shown once on Home, after the learner's first
// day (src/lib/pilot.js, shouldShowPilotIntro). Every question is optional;
// Skip saves nothing but "seen". Answers become one OutcomeCheckIn of kind
// "signup" plus the pilot fields on the account. Partner programs never see
// any of it.
export default function HelpUsImprove({ user, language = 'en', onDone }) {
  const t = usePilotText(language);
  const [state, setState] = useState(user?.state || '');
  const [stage, setStage] = useState(() => stageFromOnboarding(loadStage()));
  const [confidence, setConfidence] = useState('');
  const [reminders, setReminders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const finish = async (save) => {
    setError(false);
    const answers = save ? buildSignupAnswers({ state, stage, confidence, reminders, language }) : null;
    setSaving(true);
    try {
      if (answers?.checkIn) {
        await saveCheckIn(user.email, answers.checkIn);
      }
      await auth.updateMe(answers ? answers.profile : { pilot_intro_seen: true });
      onDone?.();
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <Card padding="p-5" className="max-w-lg w-full mx-auto text-navy">
      <form onSubmit={(e) => { e.preventDefault(); finish(true); }} className="space-y-7" aria-labelledby="pilot-title">
        <div className="space-y-3">
          <p className="text-base font-semibold text-muted" dir="auto">{t('eyebrow')}</p>
          <h1 id="pilot-title" className="font-display text-[1.75rem] leading-tight text-navy" dir="auto">{t('title')}</h1>
          <p className="text-base text-navy">{t('intro')}</p>
        </div>

        <StateSelect id="pilot-state" value={state} onChange={setState} t={t} />

        <ChoiceQuestion
          label={t('stage_label')}
          value={stage}
          onChange={setStage}
          options={[
            ['not_filed', t('stage_not_filed')],
            ['filed_waiting', t('stage_filed_waiting')],
            ['interview_scheduled', t('stage_interview_scheduled')],
          ]}
          t={t}
        />

        <ReadinessQuestion label={t('ready_label')} value={confidence} onChange={setConfidence} t={t} />

        <label htmlFor="pilot-reminders" className="flex items-start gap-3 min-h-11 cursor-pointer">
          <Checkbox id="pilot-reminders" checked={reminders} onCheckedChange={(v) => setReminders(v === true)} className="mt-1 h-5 w-5" />
          <span className="text-base text-navy">{t('reminders_label')}</span>
        </label>

        {error && <p role="alert" className="text-base font-semibold text-not-yet">{t('error')}</p>}

        <div className="flex flex-col gap-2">
          <Button variant="main" type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {saving ? t('saving') : t('save')}
          </Button>
          <Button variant="second" onClick={() => finish(false)} disabled={saving} className="w-full">{t('skip')}</Button>
        </div>
      </form>
    </Card>
  );
}
