import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, AlertTriangle, Scale, Lock, Loader2, ArrowUpRight, Phone } from 'lucide-react';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button, Card, RaisedCard } from '@/components/pathways/ui';
import { AmioSays } from '@/components/pathways/Amio';
import useAppLanguage, { isRTL } from '@/hooks/useAppLanguage';
import useLawyerChecklistTranslation from '@/hooks/useLawyerChecklistTranslation';
import { LAWYER_CHECKLIST_ITEMS, LEGAL_HELP_LINKS } from '@/components/lawyer/lawyerChecklist';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import ResourceFinder from '@/components/resources/ResourceFinder';

// Two screens under Me, one file:
// - /resources, "Free help near you" (frame R30Help): the curated directory
//   of legal help, classes, libraries and USCIS offices (ResourceFinder: the
//   map stays where it was), "Always call before you go", and a card to "Talk
//   to a lawyer first". The learner's location is used on the device only and
//   is never saved or sent anywhere.
// - /lawyer-first, "Talk to a lawyer first" (frame R30Lawyer): the same
//   read-only list of situations as before (wording unchanged), Amio's one
//   line, free legal help links, who can legally help, and "Find free legal
//   help near me". No checkboxes, no inputs; nothing is tracked or saved.
export default function LawyerPage({ cachedUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const lawyerScreen = location.pathname.toLowerCase() === '/lawyer-first';
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

  const back = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/me'))}
      aria-label="Back"
      className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
    </button>
  );

  if (!lawyerScreen) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'}>
        <NavyBanner title="Free help near you" subtitle="Legal help, classes and libraries" left={back} />
        <div className="mx-auto max-w-5xl px-4 py-5 space-y-5 pb-8">
          <ResourceFinder />
          <Card padding="p-4" className="flex items-center gap-3 bg-tint border-tint">
            <Phone className="w-5 h-5 shrink-0 text-navy" aria-hidden="true" />
            <p className="text-base font-semibold text-navy">Always call before you go.</p>
          </Card>
          <Link
            to="/lawyer-first"
            className="block rounded-card bg-white border-2 border-not-yet p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-not-yet focus-visible:ring-offset-2"
          >
            <span className="flex items-start gap-3">
              <Scale className="w-6 h-6 shrink-0 text-not-yet" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold text-navy">Talk to a lawyer first</span>
                <span className="mt-1 block text-base text-muted">Before you file, see when to get legal help.</span>
              </span>
              <ArrowRight className="w-5 h-5 shrink-0 mt-1 text-muted rtl:rotate-180" aria-hidden="true" />
            </span>
          </Link>
          <p className="text-base leading-relaxed text-muted">
            This page helps you find help. It is not legal advice about your situation. Nothing you read or search
            here, including your location, is saved or shared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      <NavyBanner title="Talk to a lawyer first" subtitle="Before you file, if any of these might be true" left={back} />
      <div className="mx-auto max-w-lg px-4 py-5 space-y-5 pb-8">

      <RaisedCard id="lawyer-first" className="space-y-3 scroll-mt-24 border-2 border-not-yet">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full grid place-items-center bg-not-yet-bg text-not-yet shrink-0">
            <Scale className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-navy">Talk to a lawyer first</h2>
        </div>
        <p className="text-base text-navy leading-relaxed">
          Most people can apply on their own. But if <strong>ANY</strong> of these are true for you, talk to a
          lawyer or accredited representative <strong>BEFORE</strong> you file. Filing with one of these issues
          can cause serious problems, including more than a denied application. You do not need to tell this
          app anything.
        </p>
      </RaisedCard>

      <RaisedCard padding="p-4 sm:p-6" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-lg font-bold text-navy">If any of these is true for you</h2>
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
        <h2 className="text-lg font-bold">Find free or low-cost legal help</h2>
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

      <div className="rounded-card bg-not-yet-bg border-2 border-not-yet p-5 space-y-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-not-yet shrink-0" aria-hidden="true" />
          <h2 className="text-lg font-bold text-not-yet">Who can legally help you</h2>
        </div>
        <p className="text-base text-pw-navy leading-relaxed">
          Only lawyers and DOJ-accredited representatives can give immigration legal advice. Notarios and
          &ldquo;immigration consultants&rdquo; cannot.
        </p>
      </div>


      <AmioSays mood="kind">I can&apos;t give legal advice. A free legal helper can look at your situation.</AmioSays>

      <p className="text-base leading-relaxed text-muted">
        Nothing you see or tap here is saved. Pathways is not a law office. This page explains when to get legal
        help; it is not legal advice about your situation.
      </p>

      <Button variant="main" className="w-full" onClick={() => navigate('/resources')}>
        Find free legal help near me
      </Button>
      </div>
    </div>
  );
}
