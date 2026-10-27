import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { RaisedCard, PrimaryButton, QuietButton, Eyebrow } from '@/components/pathways/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { buildSignupAnswers, stageFromOnboarding } from '@/lib/pilot';
import { loadStage } from '@/lib/onboarding';
import usePilotText from './pilotStrings';
import { ChoiceQuestion, ReadinessQuestion, StateSelect } from './PilotFields';

// "Help us improve Pathways": shown once on Home, after the learner's first
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
    const answers = save ? buildSignupAnswers({ state, stage, confidence, reminders }) : null;
    setSaving(true);
    try {
      if (answers?.checkIn) {
        await base44.entities.OutcomeCheckIn.create({ user_email: user.email.toLowerCase().trim(), ...answers.checkIn });
      }
      await base44.auth.updateMe(answers ? answers.profile : { pilot_intro_seen: true });
      onDone?.();
    } catch (e) {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <RaisedCard padding="p-5 sm:p-8" className="max-w-2xl w-full mx-auto">
      <form onSubmit={(e) => { e.preventDefault(); finish(true); }} className="space-y-7" aria-labelledby="pilot-title">
        <div className="space-y-3">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h1 id="pilot-title" className="font-display text-[36px] leading-tight text-pw-navy">{t('title')}</h1>
          <p className="text-base text-pw-navy">{t('intro')}</p>
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
          <span className="text-base text-pw-navy">{t('reminders_label')}</span>
        </label>

        {error && <p role="alert" className="text-base font-semibold text-pw-red-ink">{t('error')}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <QuietButton onClick={() => finish(false)} disabled={saving} className="w-full sm:w-auto">{t('skip')}</QuietButton>
          <PrimaryButton type="submit" disabled={saving} large className="w-full sm:w-auto">
            {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {saving ? t('saving') : t('save')}
          </PrimaryButton>
        </div>
      </form>
    </RaisedCard>
  );
}
