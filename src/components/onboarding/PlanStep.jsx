import React from 'react';
import { ExternalLink } from 'lucide-react';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { MINUTE_CHOICES } from '@/lib/dailyMinutes';
import { STAGES, asksFiled } from '@/lib/onboarding';

// Your plan, in first open (Amio v2, frame OnboardPlan). "Have you sent your
// N-400?" with the four stage answers Getting started always had (they feed
// the pilot exactly as before; saved on this device only), then, once sent,
// which civics test (the same question and link as before), then "About how
// long each day?": about 5 / 10 / 15 min a day = 1 / 2 / 3 lessons a day.
// Nothing here is required.

const USCIS_TEST = 'https://www.uscis.gov/citizenship/2025-test';
const FILED = ['before', 'after', 'unsure'];

const choice = (on) => `rounded-button text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${
  on ? 'bg-sky border-[2.5px] border-navy font-extrabold' : 'bg-white border-[1.5px] border-line font-semibold hover:border-navy'
}`;

// "N-400" never breaks at its hyphen ("N-" / "400?").
function keepTogether(text) {
  return String(text).split(/(N-400)/).map((part, k) => (part === 'N-400' ? <span key={k} className="whitespace-nowrap">{part}</span> : part));
}

export default function PlanStep({ t, rtl, label, stage, onStage, filed, onFiled, perDay, onPerDay, busy, onDone }) {
  return (
    <OnboardingShell
      step="plan"
      t={t}
      rtl={rtl}
      amio={t('plan_amio')}
      button={t('make_plan')}
      onButton={onDone}
      buttonDisabled={busy}
    >
      <section className="flex flex-col gap-3" aria-labelledby="plan-sent">
        <h1 id="plan-sent" dir="auto" className="font-display text-[1.625rem] leading-[1.1] tracking-tight">{keepTogether(t('plan_sent'))}</h1>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="plan-sent">
          {STAGES.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={stage === s} onClick={() => onStage(s)} className={`min-h-[4rem] px-3 py-2 text-base leading-tight ${choice(stage === s)}`}>
              {label(`stage_${s}`)}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{t('plan_stays')}</p>
      </section>

      {asksFiled(stage) && (
        <section className="flex flex-col gap-3" aria-labelledby="plan-filed">
          <h2 id="plan-filed" className="text-lg font-bold">{label('filed_ask')}</h2>
          <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="plan-filed">
            {FILED.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={filed === a} onClick={() => onFiled(a)} className={`min-h-[3.5rem] px-4 py-2 text-start text-base ${choice(filed === a)}`}>
                {label(`filed_${a}`)}
              </button>
            ))}
          </div>
          <a
            href={USCIS_TEST}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-11 text-base font-bold text-denim underline underline-offset-4 decoration-denim/40 hover:decoration-denim"
          >
            {label('filed_link')} <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="plan-long">
        <h2 id="plan-long" className="font-display text-[1.625rem] leading-[1.1] tracking-tight">{t('plan_how_long')}</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="plan-long">
          {MINUTE_CHOICES.map((c) => {
            const on = perDay === c.perDay;
            return (
              <button
                key={c.minutes}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={t('plan_about', { n: c.minutes })}
                onClick={() => onPerDay(c.perDay)}
                className={`min-h-[5.25rem] px-1 flex flex-col items-center justify-center text-navy rounded-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${
                  on ? 'bg-gold border-[2.5px] border-navy' : 'bg-white border-[1.5px] border-line hover:border-navy'
                }`}
              >
                <span className="font-display text-[1.875rem] leading-none" aria-hidden="true">{c.minutes}</span>
                <span className="text-small" aria-hidden="true">{t('plan_min_a_day')}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted">{t('plan_change')}</p>
      </section>
    </OnboardingShell>
  );
}
