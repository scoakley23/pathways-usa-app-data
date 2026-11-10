import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, AlertTriangle, Scale, Lock, Loader2, ArrowUpRight } from 'lucide-react';
import PageTop from '@/components/pathways/PageTop';
import { CreamSheet, RaisedCard } from '@/components/pathways/ui';
import useAppLanguage, { isRTL } from '@/hooks/useAppLanguage';
import useLawyerChecklistTranslation from '@/hooks/useLawyerChecklistTranslation';
import { LAWYER_CHECKLIST_ITEMS, LEGAL_HELP_LINKS } from '@/components/lawyer/lawyerChecklist';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import ResourceFinder from '@/components/resources/ResourceFinder';

// Resource Hub (/resources, and /lawyer-first for older links). Two parts:
// 1. "Find help near you" — a map and list of legal help, classes, and USCIS
//    offices (ResourceFinder). The learner's location is used on the device
//    only and is never saved or sent anywhere.
// 2. "Talk to a lawyer first" — a plain, read-only list of situations where
//    the learner should get legal help before filing. No checkboxes, no
//    inputs, and nothing in it is tracked or saved.
export default function LawyerPage({ cachedUser }) {
  const location = useLocation();
  useEffect(() => {
    // Links that say "Talk to a lawyer first" land on that section.
    if (location.pathname === '/lawyer-first') {
      document.getElementById('lawyer-first')?.scrollIntoView({ block: 'start' });
    }
  }, [location.pathname]);
  const isAdmin = cachedUser?.role === 'admin';
  const [language] = useAppLanguage();
  const rtl = isRTL(language);
  const { translation, isTranslating } = useLawyerChecklistTranslation(language);
  const hasTranslation = language && language !== 'en' && translation?.length > 0;
  // The guide section each item points at, in the learner's language when we
  // have a translation of it.
  const guideTitleFor = (item, i) =>
    (hasTranslation && translation[i]?.section) ||
    N400_SECTIONS.find((s) => s.id === item.guideSectionId)?.title ||
    'the N-400 guide';

  return (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      <PageTop
        back
        tag="Help near you"
        title="Resource Hub"
        subtitle="Help near you, and when to talk to a lawyer first."
        guide="I'm a study tutor, not a lawyer. Here you can find free legal help, classes, and offices near you, and see when to talk to a lawyer before you file."
      />
      <CreamSheet>
      <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <ResourceFinder />

      <RaisedCard id="lawyer-first" className="space-y-3 md:p-6 scroll-mt-24 border-2 border-not-correct">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full grid place-items-center bg-not-correct-soft text-not-correct shrink-0">
            <Scale className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-[22px] leading-snug font-display text-ink">Talk to a lawyer first</h2>
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
          <h2 className="text-[22px] leading-snug font-display text-ink">If any of these is true for you</h2>
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
                {item.guideSectionId && (
                  <Link
                    to={`/n400-guide?section=${item.guideSectionId}`}
                    className="inline-flex items-center gap-1.5 min-h-11 text-sm font-bold text-pw-navy underline underline-offset-4 decoration-pw-navy/40 hover:decoration-pw-navy rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
                  >
                    <span>{guideTitleFor(item, i)} — read it in the N-400 guide</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-base text-pw-muted leading-relaxed px-1">
          Each item links to the part of our N-400 guide that explains those questions. The guide tells you what
          the form asks — it does not tell you how to answer.
        </p>
        {hasTranslation && (
          <p className="text-sm text-pw-muted">
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

      <section className="rounded-card bg-white border border-card-line text-ink p-5 md:p-6 space-y-4">
        <h2 className="text-[22px] leading-snug font-display">Find free or low-cost legal help</h2>
        <ul className="space-y-3">
          {LEGAL_HELP_LINKS.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-2xl bg-sand text-ink p-4 min-h-[44px] hover:bg-sand-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
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

      <div className="rounded-card bg-pw-red-soft p-5 md:p-6 space-y-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-pw-red-ink shrink-0" aria-hidden="true" />
          <h2 className="text-[22px] leading-snug font-display text-not-correct-text">Who can legally help you</h2>
        </div>
        <p className="text-base text-pw-navy leading-relaxed">
          Only lawyers and DOJ-accredited representatives can give immigration legal advice. Notarios and
          &ldquo;immigration consultants&rdquo; cannot.
        </p>
      </div>

      <p className="text-base leading-relaxed text-pw-muted">
        This page helps you find help and explains when to get legal help. It is not legal advice about your
        situation. Nothing you read or search here, including your location, is saved or shared.
      </p>
      </div>
      </CreamSheet>
    </div>
  );
}