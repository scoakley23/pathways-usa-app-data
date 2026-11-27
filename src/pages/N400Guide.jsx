import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { n400Progress as n400ProgressApi } from '@/api/interview';
import { Button } from '@/components/pathways/ui';
import { AmioSays } from '@/components/pathways/Amio';
import useN400GuideText from '@/components/n400/useN400GuideText';
import { cardCount, nextSection } from '@/lib/n400View';
import N400Section, { visibleCards } from '@/components/n400/N400Section';
import N400Cover from '@/components/n400/N400Cover';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import N400BlankForm from '@/components/n400/N400BlankForm';
import ReadyToFile from '@/components/n400/ReadyToFile';
import useAppLanguage from '@/hooks/useAppLanguage';

// N-400 Question Guide (Amio v2: paper pages, wording in n400GuideStrings.js):
// explains what questions on the naturalization
// application mean. No learner answers are collected here — only whole-section
// completion is saved. The guide's home (frame R30N400: "Your N-400,
// explained", "Continue: {section}", the warning and the sections; the old
// ?folder=open lands here too) → one section (?section=…&card=n), one card per
// screen (frame R30N400Card) with the section chips under its navy banner.
// "See the form" (?view=form) shows the blank form.
export default function N400Guide({ cachedUser }) {
  const [language] = useAppLanguage();
  const { t, rtl } = useN400GuideText();
  const dir = rtl ? 'rtl' : 'ltr';
  const isAdmin = cachedUser?.role === 'admin';
  const [progress, setProgress] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  // "See the form" (?view=form; the old ?view=examples link lands here too).
  const view = ['form', 'examples'].includes(searchParams.get('view')) ? 'form' : 'guide';
  const setView = (next) => setSearchParams(next === 'guide' ? {} : { view: next }, { replace: true });
  const sectionId = searchParams.get('section');
  const activeSection = N400_SECTIONS.find((s) => s.id === sectionId) || N400_SECTIONS[0];
  const step = sectionId ? 'section' : 'home';
  // Moving in (cover → list → section) adds a history step so Back moves out;
  // switching tabs inside a section does not.
  const pickSection = (id) => setSearchParams({ section: id });
  const openSection = (id) => setSearchParams({ section: id }, { replace: true });
  const cardIndex = Math.max(0, (parseInt(searchParams.get('card'), 10) || 1) - 1);
  const goToCard = (i) => setSearchParams({ section: activeSection.id, card: String(i + 1) });
  const completedIds = progress.filter((p) => p.completed).map((p) => p.section_id);
  const visibleCount = (s) => (isAdmin ? s.questions : s.questions.filter((q) => q.status === 'approved')).length;

  // Each step (cover, list, a section) starts at the top of the page.
  useEffect(() => {
    if (!searchParams.get('ready')) window.scrollTo({ top: 0 });
  }, [step, sectionId, cardIndex]);

  // The open section's chip scrolls into view in the chip row.
  useEffect(() => {
    if (step !== 'section') return;
    const chip = document.querySelector('[data-section-chip][aria-current="true"]');
    try { chip?.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch { /* older browsers */ }
  }, [step, sectionId]);

  // ?ready=1 (end of the N-400 coach) jumps to "Ready to file?".
  useEffect(() => {
    if (searchParams.get('ready')) {
      const id = setTimeout(() => document.getElementById('ready-to-file')?.scrollIntoView({ behavior: 'smooth' }), 300);
      return () => clearTimeout(id);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!cachedUser?.email) return;
    let cancelled = false;
    n400ProgressApi.list()
      .then((records) => {
        if (!cancelled) setProgress(records);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cachedUser?.email]);

  const markComplete = async (sectionId) => {
    const section = N400_SECTIONS.find((s) => s.id === sectionId);
    const existing = progress.find((p) => p.section_id === sectionId);
    const now = new Date().toISOString();
    const saved = await n400ProgressApi.markRead(existing, { sectionId, title: section.title, date: now });
    if (existing) {
      setProgress((prev) => prev.map((p) => (p.section_id === sectionId ? { ...p, completed: true } : p)));
    } else {
      setProgress((prev) => [...prev, saved]);
    }
  };

  const { section: nextUp, started } = nextSection(N400_SECTIONS, completedIds);
  const cards = cardCount(N400_SECTIONS, isAdmin);

  // The Guide | See the form switch: two 12px tabs (the open one white with
  // a navy border).
  const viewSwitch = (
    <div role="group" aria-label={t('view_label')} className="grid grid-cols-2 gap-2">
      {[['guide', t('view_guide')], ['form', t('view_form')]].map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => setView(id)}
          className={`min-h-tap rounded-button border-[2.5px] px-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${view === id ? 'bg-white border-navy text-navy' : 'bg-line-soft border-line-soft text-navy hover:border-line'}`}
        >
          <span dir="auto">{label}</span>
        </button>
      ))}
    </div>
  );

  // A section: Back, where it is, the title, and one chip per section.
  if (view === 'guide' && step === 'section') {
    const total = visibleCards(activeSection, isAdmin).length;
    return (
      <div dir={dir} className="min-h-full bg-paper text-navy">
        <div className="mx-auto max-w-lg px-4 pt-4 pb-8 flex flex-col gap-4">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              aria-label={t('back_guide')}
              className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
            >
              <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
            </button>
            <div className="min-w-0 pt-1">
              <p className="text-base font-semibold text-muted" dir="auto">
                {t('section_of', { n: N400_SECTIONS.indexOf(activeSection) + 1, card: Math.min(cardIndex + 1, Math.max(1, total)), total })}
              </p>
              <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t(`title_${activeSection.id}`)}</h1>
              <p className="text-base text-muted" dir="auto">{t(`part_${activeSection.id}`)}</p>
            </div>
          </div>
          <nav aria-label={t('sections_nav')} className="-mx-4 px-4 overflow-x-auto">
            <ul className="flex gap-2 w-max pb-1 list-none m-0 p-0">
              {N400_SECTIONS.map((s) => {
                const active = s.id === activeSection.id;
                const read = completedIds.includes(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => openSection(s.id)}
                      data-section-chip
                      aria-current={active ? 'true' : undefined}
                      className={`min-h-tap whitespace-nowrap rounded-button border-[1.5px] px-4 inline-flex items-center gap-1.5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${active ? 'bg-navy border-navy text-white' : 'bg-white border-line text-navy hover:border-navy'}`}
                    >
                      {read && (
                        <span className={`w-5 h-5 rounded-full grid place-items-center bg-gold text-navy`} aria-hidden="true">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </span>
                      )}
                      <span dir="auto">{t(`tab_${s.id}`)}</span>
                      {read && <span className="sr-only">, {t('read_sr')}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <N400Section
            key={activeSection.id}
            section={activeSection}
            isAdmin={isAdmin}
            language={language}
            completed={completedIds.includes(activeSection.id)}
            onComplete={markComplete}
            cardIndex={cardIndex}
            onCard={goToCard}
          />
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-full bg-paper text-navy">
      <div className="mx-auto max-w-lg px-4 pt-6 pb-8 flex flex-col gap-5">
        <div>
          <h1 className="font-display text-[2rem] leading-tight" dir="auto">{t('title')}</h1>
          <p className="mt-1 text-base text-muted" dir="auto">
            {view === 'form' ? t('subtitle_form') : t('subtitle', { cards, sections: N400_SECTIONS.length })}
          </p>
        </div>
        {viewSwitch}
        {view === 'guide' && <AmioSays mood="hello" size={56}>{t('amio_guide')}</AmioSays>}
        {view === 'guide' && nextUp && (
          <Button variant="main" className="w-full" onClick={() => pickSection(nextUp.id)}>
            <span dir="auto">{t(started ? 'continue' : 'start', { section: t(`title_${nextUp.id}`) })}</span> <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
        )}
        {view === 'form' ? (
          <N400BlankForm sections={N400_SECTIONS} isAdmin={isAdmin} onOpenSection={pickSection} />
        ) : (
          <>
            <N400Cover sections={N400_SECTIONS} completedIds={completedIds} countFor={visibleCount} onSelect={pickSection} />
            <ReadyToFile />
            <p className="text-center text-base text-muted" dir="auto">{t('not_government')}</p>
          </>
        )}
      </div>
    </div>
  );
}
