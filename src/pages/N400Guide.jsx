import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button } from '@/components/pathways/ui';
import { cardCount, nextSection } from '@/lib/n400View';
import N400Section, { visibleCards } from '@/components/n400/N400Section';
import { tabFor } from '@/components/n400/N400Folder';
import N400Cover from '@/components/n400/N400Cover';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import N400BlankForm from '@/components/n400/N400BlankForm';
import ReadyToFile from '@/components/n400/ReadyToFile';
import useAppLanguage from '@/hooks/useAppLanguage';
import useTutorProfile from '@/components/persona/useTutorProfile';

// N-400 Question Guide: explains what questions on the naturalization
// application mean. No learner answers are collected here — only whole-section
// completion is saved. The guide's home (frame R30N400: "Your N-400,
// explained", "Continue: {section}", the warning and the sections; the old
// ?folder=open lands here too) → one section (?section=…&card=n), one card per
// screen (frame R30N400Card) with the section chips under its navy banner.
// "See the form" (?view=form) shows the blank form.
export default function N400Guide({ cachedUser }) {
  const [language] = useAppLanguage();
  const { profile } = useTutorProfile();
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
  }, [step, sectionId, cardIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // The open section's chip scrolls into view in the chip row.
  useEffect(() => {
    if (step !== 'section') return;
    const chip = document.querySelector('[data-section-chip][aria-current="true"]');
    try { chip?.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { /* older browsers */ }
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
    base44.entities.N400SectionProgress.filter({ user_email: cachedUser.email })
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
    if (existing) {
      await base44.entities.N400SectionProgress.update(existing.id, {
        completed: true,
        completed_date: now,
      });
      setProgress((prev) => prev.map((p) => (p.section_id === sectionId ? { ...p, completed: true } : p)));
    } else {
      const created = await base44.entities.N400SectionProgress.create({
        user_email: cachedUser.email,
        section_id: sectionId,
        section_title: section.title,
        completed: true,
        completed_date: now,
      });
      setProgress((prev) => [...prev, created]);
    }
  };

  const { section: nextUp, started } = nextSection(N400_SECTIONS, completedIds);
  const cards = cardCount(N400_SECTIONS, isAdmin);

  // The Guide | See the form switch, on navy (white pill for the open view).
  const viewSwitch = (
    <div role="group" aria-label="View" className="inline-flex rounded-full bg-chip-navy p-1">
      {[['guide', 'Guide'], ['form', 'See the form']].map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => setView(id)}
          className={`min-h-tap rounded-full px-4 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${view === id ? 'bg-white text-navy' : 'text-on-navy hover:text-white'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  // A section: its own navy top (back to the guide, where it is on the form,
  // the title, and one chip per section to switch).
  if (view === 'guide' && step === 'section') {
    return (
      <div>
        <NavyBanner
          title={`Section ${N400_SECTIONS.indexOf(activeSection) + 1} · Card ${Math.min(cardIndex + 1, Math.max(1, visibleCards(activeSection, isAdmin).length))} of ${visibleCards(activeSection, isAdmin).length}`}
          subtitle={`${activeSection.title} · ${activeSection.partLabel}`}
          left={(
            <button
              type="button"
              onClick={() => setSearchParams({})}
              aria-label="Back to the N-400 guide"
              className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
            </button>
          )}
          extra={(
            <nav aria-label="Sections" className="-mx-4 px-4 overflow-x-auto">
              <ul className="flex gap-2 w-max pb-1">
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
                        className={`min-h-tap whitespace-nowrap rounded-full px-4 inline-flex items-center gap-1.5 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${active ? 'bg-white text-navy' : 'bg-chip-navy text-white hover:bg-navy-deep'}`}
                      >
                        {read && <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />}
                        {tabFor(s).label}
                        {read && <span className="sr-only">, read</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        />
        <div className="mx-auto max-w-lg px-4 py-5 pb-8">
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
    <div>
      <NavyBanner
        title="Your N-400, explained"
        subtitle={view === 'form'
          ? 'This is what the paper form looks like. It stays blank: we never fill it in or keep answers.'
          : `Learn what each question means. ${cards} cards · ${N400_SECTIONS.length} sections. This is not legal advice.`}
        extra={<div>{viewSwitch}</div>}
      />

      <div className="mx-auto max-w-lg px-4 py-5 space-y-6 pb-8">
          {view === 'guide' && nextUp && (
            <Button variant="main" className="w-full" onClick={() => pickSection(nextUp.id)}>
              {started ? 'Continue' : 'Start'}: {nextUp.title} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
            </Button>
          )}
          {view === 'form' ? (
            <N400BlankForm sections={N400_SECTIONS} isAdmin={isAdmin} onOpenSection={pickSection} />
          ) : (
            <>
              <N400Cover sections={N400_SECTIONS} completedIds={completedIds} countFor={visibleCount} onSelect={pickSection} tutorName={profile.name} />
              <ReadyToFile />
              <p className="text-center text-sm text-muted">Pathways is not part of USCIS or the government.</p>
            </>
          )}
      </div>
    </div>
  );
}
