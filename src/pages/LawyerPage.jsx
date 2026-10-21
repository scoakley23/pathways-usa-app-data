import React from 'react';
import { ExternalLink, AlertTriangle, Scale, Lock, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { RaisedCard } from '@/components/pathways/ui';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import useLawyerChecklistTranslation from '@/hooks/useLawyerChecklistTranslation';
import { LAWYER_CHECKLIST_ITEMS, LEGAL_HELP_LINKS } from '@/components/lawyer/lawyerChecklist';

// "Talk to a lawyer first" — a plain, read-only list of situations where the
// learner should get legal help before filing. There are no checkboxes, no
// buttons, no inputs, and nothing on this page is tracked or saved.
export default function LawyerPage({ cachedUser }) {
  const isAdmin = cachedUser?.role === 'admin';
  const [language] = useAppLanguage();
  const rtl = RTL_LANGUAGES.includes((language || 'en').slice(0, 2).toLowerCase());
  const { translation, isTranslating } = useLawyerChecklistTranslation(language);
  const hasTranslation = language && language !== 'en' && translation?.length > 0;

  return (
    <div className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title="Talk to a lawyer first"
        subtitle="Before you answer hard questions or file your application."
        tag="Legal help"
        tagTone="red"
        art="scroll"
      />

      <RaisedCard className="space-y-3 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-pw-blue-soft text-pw-blue-ink shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-[22px] leading-snug font-extrabold text-pw-navy">When to get help first</h2>
        </div>
        <p className="text-base text-pw-navy leading-relaxed">
          Most people can apply on their own. But if <strong>ANY</strong> of these are true for you, talk to a
          lawyer or accredited representative <strong>BEFORE</strong> you file. Filing with one of these issues
          can cause serious problems, including more than a denied application. You do not need to tell this
          app anything.
        </p>
      </RaisedCard>

      <RaisedCard padding="p-4 sm:p-6" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-[22px] leading-snug font-extrabold text-pw-navy">If any of these is true for you</h2>
          {isTranslating && (
            <p className="flex items-center gap-2 text-sm text-pw-muted">
              <Loader2 className="w-4 h-4 animate-spin" /> Translating…
            </p>
          )}
        </div>
        <ul className="space-y-3">
          {LAWYER_CHECKLIST_ITEMS.map((item, i) => (
            <li key={item.id} className="flex items-start gap-3 rounded-2xl bg-pw-soft p-4">
              <span
                className="w-8 h-8 rounded-full bg-white text-pw-navy text-sm font-extrabold grid place-items-center shrink-0"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-base font-bold text-pw-navy leading-snug">
                  {hasTranslation && translation[i] ? translation[i].text : item.text}
                </p>
                <p className="text-base text-pw-muted leading-relaxed">
                  {hasTranslation && translation[i] ? translation[i].explanation : item.explanation}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {hasTranslation && (
          <p className="text-sm italic text-pw-muted">
            Machine translation. If anything is unclear, ask a person you trust or a lawyer.
          </p>
        )}
        {isAdmin && (
          <div className="rounded-2xl bg-pw-soft px-4 py-3 text-sm flex items-center gap-2 text-pw-muted">
            <Lock className="w-4 h-4 shrink-0" />
            This list is a draft pending legal review — do not publish changes without the owner's sign-off.
          </div>
        )}
      </RaisedCard>

      <section className="rounded-3xl bg-pw-navy text-white p-5 md:p-6 space-y-4 shadow-lift">
        <h2 className="text-[22px] leading-snug font-extrabold">Find free or low-cost legal help</h2>
        <ul className="space-y-3">
          {LEGAL_HELP_LINKS.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-2xl bg-white text-pw-navy p-4 min-h-[44px] hover:bg-pw-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 focus-visible:ring-offset-pw-navy"
              >
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-base font-bold group-hover:underline">{link.label}</span>
                  <span className="block text-sm text-pw-muted">{link.description}</span>
                </span>
                <ExternalLink className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-3xl bg-pw-red-soft p-5 md:p-6 space-y-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-pw-red-ink shrink-0" aria-hidden="true" />
          <h2 className="text-[22px] leading-snug font-extrabold text-pw-red-ink">Who can legally help you</h2>
        </div>
        <p className="text-base text-pw-navy leading-relaxed">
          Only lawyers and DOJ-accredited representatives can give immigration legal advice. Notarios and
          &ldquo;immigration consultants&rdquo; cannot.
        </p>
      </div>

      <p className="text-base leading-relaxed text-pw-muted">
        This page explains when to get legal help. It is not legal advice about your situation, and nothing you
        read here is saved or shared.
      </p>
    </div>
  );
}
