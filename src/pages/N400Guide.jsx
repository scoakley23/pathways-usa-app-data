import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import N400Section from '@/components/n400/N400Section';
import N400Folder from '@/components/n400/N400Folder';
import N400Cover from '@/components/n400/N400Cover';
import N400SectionList from '@/components/n400/N400SectionList';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import N400BlankForm from '@/components/n400/N400BlankForm';
import ReadyToFile from '@/components/n400/ReadyToFile';
import useAppLanguage from '@/hooks/useAppLanguage';
import useTutorProfile from '@/components/persona/useTutorProfile';

// N-400 Question Guide: explains what questions on the naturalization
// application mean. No learner answers are collected here — only whole-section
// completion is saved. Three steps, so it is never a wall of text at first:
// the folder cover → the section list (?folder=open) → one section with the
// form's words (?section=…). Ruled paper behind, the learner's own page.
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
  const step = sectionId ? 'section' : searchParams.get('folder') ? 'list' : 'cover';
  // Moving in (cover → list → section) adds a history step so Back moves out;
  // switching tabs inside a section does not.
  const openFolder = () => setSearchParams({ folder: 'open' });
  const pickSection = (id) => setSearchParams({ section: id });
  const openSection = (id) => setSearchParams({ section: id }, { replace: true });
  const completedIds = progress.filter((p) => p.completed).map((p) => p.section_id);
  const visibleCount = (s) => (isAdmin ? s.questions : s.questions.filter((q) => q.status === 'approved')).length;

  // Each step (cover, list, a section) starts at the top of the page.
  useEffect(() => {
    if (!searchParams.get('ready')) window.scrollTo({ top: 0 });
  }, [step, sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const toggle = (active) =>
    `min-h-10 rounded-full px-4 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy ${
      active ? 'bg-white text-pw-navy shadow-raised' : 'text-pw-muted hover:text-pw-navy'
    }`;
  const backLink = 'inline-flex items-center gap-1.5 min-h-11 rounded-full border border-pw-line bg-white px-4 text-[15px] font-semibold text-pw-navy hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy';

  return (
    <div className="space-y-6">
      <PageHeader
        tag={`Form N-400 · ${completedIds.length} of ${N400_SECTIONS.length} sections read`}
        title="The N-400, in plain words"
        guide={view === 'form'
          ? 'This is what the paper form looks like. It stays blank: we never fill it in or keep answers.'
          : 'I explain what each question means. How it applies to you is a question for a lawyer.'}
      >
        <div role="group" aria-label="View" className="inline-flex rounded-full bg-pw-soft p-1">
          <button type="button" aria-pressed={view === 'guide'} onClick={() => setView('guide')} className={toggle(view === 'guide')}>Guide</button>
          <button type="button" aria-pressed={view === 'form'} onClick={() => setView('form')} className={toggle(view === 'form')}>See the form</button>
        </div>
      </PageHeader>

      {view === 'form' ? (
        <N400BlankForm sections={N400_SECTIONS} isAdmin={isAdmin} onOpenSection={pickSection} />
      ) : (
        <div className="pw-ruled relative -mx-4 px-4 ps-12 py-6 sm:mx-0 sm:rounded-[20px] sm:ps-14">
          <span aria-hidden="true" className="absolute inset-y-0 start-7 sm:start-9 w-0.5 bg-pw-margin" />
          {step === 'cover' && (
            <N400Cover sections={N400_SECTIONS} completedIds={completedIds} onOpen={openFolder} tutorName={profile.name} />
          )}
          {step === 'list' && (
            <div className="space-y-4">
              <button type="button" onClick={() => setSearchParams({})} className={backLink}>
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" /> Folder cover
              </button>
              <h2 className="font-display text-[34px] leading-tight">Pick a section</h2>
              <N400SectionList sections={N400_SECTIONS} completedIds={completedIds} countFor={visibleCount} onSelect={pickSection} />
              <p className="text-center text-[15px]">We never save your answers to the N-400.</p>
            </div>
          )}
          {step === 'section' && (
            <div className="space-y-4">
              <button type="button" onClick={openFolder} className={backLink}>
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" /> All sections
              </button>
              <N400Folder sections={N400_SECTIONS} activeId={activeSection.id} completedIds={completedIds} onSelect={openSection}>
                <N400Section
                  key={activeSection.id}
                  section={activeSection}
                  isAdmin={isAdmin}
                  language={language}
                  completed={completedIds.includes(activeSection.id)}
                  onComplete={markComplete}
                />
              </N400Folder>
            </div>
          )}
        </div>
      )}
      {view === 'guide' && step !== 'section' && <ReadyToFile />}
    </div>
  );
}
