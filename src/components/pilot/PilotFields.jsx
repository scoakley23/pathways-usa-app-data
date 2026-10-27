import React from 'react';
import { Check, Frown, Annoyed, Meh, Smile, Laugh } from 'lucide-react';
import { US_STATES } from '@/config/pilot';
import { PREFER_NOT } from '@/lib/pilot';

// Shared fields for the "Help us improve Pathways" screen and the Profile
// card. Every choice can be tapped again to clear it.

const CHIP = 'min-h-11 rounded-2xl border-2 px-4 py-2 text-left text-base font-semibold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2';
const chipTone = (selected) => (selected ? 'border-pw-navy bg-pw-soft text-pw-navy' : 'border-pw-line bg-white text-pw-navy hover:border-pw-navy/50');
const LABEL = 'text-lg font-bold text-pw-navy';
const FIELD = 'w-full min-h-11 rounded-xl border-2 border-pw-line bg-white px-3 text-base text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy';

export function Choice({ selected, onClick, children, className = '' }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`${CHIP} ${chipTone(selected)} ${className}`}>
      <span className="min-w-0">{children}</span>
      {selected && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </button>
  );
}

// A question with a few choices plus "I'd rather not say".
export function ChoiceQuestion({ label, value, onChange, options, t, inline = false }) {
  const toggle = (v) => onChange(value === v ? '' : v);
  return (
    <fieldset className="space-y-2">
      <legend className={`${LABEL} mb-2`}>{label}</legend>
      <div className={inline ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}>
        {options.map(([v, text]) => (
          <Choice key={v} selected={value === v} onClick={() => toggle(v)}>{text}</Choice>
        ))}
        <Choice selected={value === PREFER_NOT} onClick={() => toggle(PREFER_NOT)} className="text-pw-muted">{t('prefer_not')}</Choice>
      </div>
    </fieldset>
  );
}

const FACES = [Frown, Annoyed, Meh, Smile, Laugh];

export function ReadinessQuestion({ label, value, onChange, t }) {
  const toggle = (v) => onChange(value === v ? '' : v);
  return (
    <fieldset className="space-y-2">
      <legend className={`${LABEL} mb-2`}>{label}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {FACES.map((Face, i) => {
          const v = String(i + 1);
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={selected}
              aria-label={`${v}${i === 0 ? `, ${t('ready_low')}` : i === 4 ? `, ${t('ready_high')}` : ''}`}
              onClick={() => toggle(v)}
              className={`min-h-[64px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${chipTone(selected)}`}
            >
              <Face className="w-6 h-6" aria-hidden="true" />
              <span className="font-display text-xl leading-none">{v}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-sm text-pw-muted" aria-hidden="true">
        <span>{t('ready_low')}</span>
        <span>{t('ready_high')}</span>
      </div>
      <Choice selected={value === PREFER_NOT} onClick={() => toggle(PREFER_NOT)} className="text-pw-muted">{t('prefer_not')}</Choice>
    </fieldset>
  );
}

export function StateSelect({ id, value, onChange, t }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={`${LABEL} block`}>{t('state_label')}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD}>
        <option value="">{t('state_choose')}</option>
        {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        <option value={PREFER_NOT}>{t('prefer_not')}</option>
      </select>
    </div>
  );
}
