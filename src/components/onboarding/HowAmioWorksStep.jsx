import React from 'react';
import { Lock, Mic } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import OnboardingShell from '@/components/onboarding/OnboardingShell';

// How Amio works (Amio v2, frame OnboardHowItWorks; was Meet Amio): three
// blocks, then "Got it". I explain in your language (navy), you answer in
// English (gold), your voice is never saved (sky).
function Block({ className, icon, title, body, bodyClass = '' }) {
  return (
    <li className={`rounded-card p-4 flex items-center gap-3.5 ${className}`}>
      {icon}
      <span className="min-w-0">
        <span className="block font-display text-[1.375rem] leading-tight">{title}</span>
        <span className={`block mt-1 text-sm ${bodyClass}`}>{body}</span>
      </span>
    </li>
  );
}

export default function HowAmioWorksStep({ t, rtl, languageName, onContinue }) {
  return (
    <OnboardingShell step="how" t={t} rtl={rtl} amio={t('how_amio')} button={t('got_it')} onButton={onContinue}>
      <ul className="list-none m-0 p-0 flex flex-col gap-2">
        <Block
          className="bg-navy text-white"
          icon={<Amio size={44} onNavy />}
          title={t('how_explain', { language: languageName })}
          body={t('how_explain_body')}
          bodyClass="text-sky"
        />
        <Block
          className="bg-gold text-navy"
          icon={<span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-navy text-gold"><Mic className="w-5 h-5" strokeWidth={2} aria-hidden="true" /></span>}
          title={t('how_answer')}
          body={t('how_answer_body')}
        />
        <Block
          className="bg-sky text-navy"
          icon={<span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-white text-navy"><Lock className="w-5 h-5" strokeWidth={2} aria-hidden="true" /></span>}
          title={t('how_voice')}
          body={t('how_voice_body')}
        />
      </ul>
    </OnboardingShell>
  );
}
