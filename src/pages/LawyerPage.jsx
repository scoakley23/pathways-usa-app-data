import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, AlertTriangle, Scale, Lock, Loader2, ArrowUpRight, Phone } from 'lucide-react';
import { Button, Card } from '@/components/pathways/ui';
import { AmioSays } from '@/components/pathways/Amio';
import useLawyerText from '@/components/lawyer/useLawyerText';
import useLawyerChecklistTranslation from '@/hooks/useLawyerChecklistTranslation';
import { LAWYER_CHECKLIST_ITEMS, LEGAL_HELP_LINKS } from '@/components/lawyer/lawyerChecklist';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import ResourceFinder from '@/components/resources/ResourceFinder';

// Two screens under Me, one file (Amio v2: paper pages with Back and the
// title; wording in src/components/lawyer/lawyerStrings.js):
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
  const { t, language, rtl } = useLawyerText();
  const { translation, isTranslating } = useLawyerChecklistTranslation(language);
  const hasTranslation = language && language !== 'en' && translation?.length > 0;
  // The guide section each item points at, in the learner's language when we
  // have a translation of it.
  const guideTitleFor = (item, i) =>
    (hasTranslation && translation[i]?.section) ||
    N400_SECTIONS.find((s) => s.id === item.guideSectionId)?.title ||
    t('the_guide');

  const top = (title, sub) => (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/me'))}
        aria-label={t('back')}
        className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
      >
        <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
      </button>
      <div className="min-w-0 pt-1">
        <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{title}</h1>
        <p className="text-base text-muted" dir="auto">{sub}</p>
      </div>
    </div>
  );

  if (!lawyerScreen) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
        <div className="mx-auto max-w-5xl px-4 pt-4 pb-8 flex flex-col gap-5">
          {top(t('help_title'), t('help_sub'))}
          <ResourceFinder />
          <Card padding="p-4" className="flex items-center gap-3 bg-line-soft border-line-soft">
            <Phone className="w-5 h-5 shrink-0 text-navy" aria-hidden="true" />
            <p className="text-base font-semibold text-navy" dir="auto">{t('call_first')}</p>
          </Card>
          <Link
            to="/lawyer-first"
            className="block rounded-card bg-white border-[2.5px] border-not-yet p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            <span className="flex items-start gap-3">
              <Scale className="w-6 h-6 shrink-0 text-not-yet" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold text-navy" dir="auto">{t('lawyer_title')}</span>
                <span className="mt-1 block text-base text-muted" dir="auto">{t('lawyer_card_body')}</span>
              </span>
              <ArrowRight className="w-5 h-5 shrink-0 mt-1 text-muted rtl:rotate-180" aria-hidden="true" />
            </span>
          </Link>
          <p className="text-base leading-relaxed text-muted" dir="auto">{t('help_note')}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="mx-auto max-w-lg px-4 pt-4 pb-8 flex flex-col gap-5">
        {top(t('lawyer_title'), t('lawyer_sub'))}
        <AmioSays mood="kind" size={56}>{t('amio_lawyer')}</AmioSays>

        <Card id="lawyer-first" padding="p-4" className="scroll-mt-24 border-[2.5px] border-not-yet">
          <div className="flex items-start gap-3">
            <Scale className="w-6 h-6 shrink-0 text-not-yet" aria-hidden="true" />
            <p className="text-base leading-relaxed" dir="auto">{t('lawyer_intro')}</p>
          </div>
        </Card>

        <section aria-labelledby="if-any" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="if-any" className="text-lg font-bold" dir="auto">{t('if_any')}</h2>
            {isTranslating && (
              <p className="flex items-center gap-2 text-base text-muted" dir="auto">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('translating')}
              </p>
            )}
          </div>
          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {LAWYER_CHECKLIST_ITEMS.map((item, i) => (
              <li key={item.id} className="flex items-start gap-3 rounded-card bg-white border-[1.5px] border-line p-4">
                <span className="w-8 h-8 rounded-full bg-line-soft text-navy text-base font-bold grid place-items-center shrink-0" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-base font-bold leading-snug" dir="auto">
                    {hasTranslation && translation[i] ? translation[i].text : item.text}
                  </p>
                  <p className="text-base text-muted leading-relaxed" dir="auto">
                    {hasTranslation && translation[i] ? translation[i].explanation : item.explanation}
                  </p>
                  {item.guideSectionId && (
                    <Link
                      to={`/n400-guide?section=${item.guideSectionId}`}
                      className="inline-flex items-center gap-1.5 min-h-11 text-base font-semibold text-denim underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
                    >
                      <span dir="auto">{t('read_in_guide', { section: guideTitleFor(item, i) })}</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-base text-muted leading-relaxed" dir="auto">{t('guide_note')}</p>
          {hasTranslation && <p className="text-small text-muted" dir="auto">{t('machine_note')}</p>}
          {isAdmin && (
            <div className="rounded-card bg-line-soft px-4 py-3 text-small flex items-center gap-2 text-muted">
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span dir="auto">{t('admin_draft')}</span>
            </div>
          )}
        </section>

        <section aria-labelledby="free-help" className="rounded-card bg-white border-[1.5px] border-line p-4 flex flex-col gap-3">
          <h2 id="free-help" className="text-lg font-bold" dir="auto">{t('free_help')}</h2>
          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {LEGAL_HELP_LINKS.map((link, i) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-card bg-paper p-4 min-h-[44px] hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
                >
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block text-base font-bold group-hover:underline" lang="en" dir="ltr">{link.label}</span>
                    <span className="block text-base text-muted" dir="auto">{t(`link_${i}`)}</span>
                    <span className="sr-only"> ({t('opens_outside')})</span>
                  </span>
                  <ExternalLink className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Card padding="p-4" className="border-[2.5px] border-not-yet flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-not-yet shrink-0" aria-hidden="true" />
            <h2 className="text-lg font-bold" dir="auto">{t('who_can')}</h2>
          </div>
          <p className="text-base leading-relaxed" dir="auto">{t('who_can_body')}</p>
        </Card>

        <p className="text-base leading-relaxed text-muted" dir="auto">{t('nothing_saved')}</p>

        <Button variant="main" className="w-full" onClick={() => navigate('/resources')}>
          <span dir="auto">{t('find_near_me')}</span>
        </Button>
      </div>
    </div>
  );
}
