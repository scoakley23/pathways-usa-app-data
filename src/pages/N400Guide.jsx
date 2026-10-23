import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpenText, UsersRound, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import N400Section from '@/components/n400/N400Section';
import N400Folder from '@/components/n400/N400Folder';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import N400Walkthrough from '@/components/n400/N400Walkthrough';
import ReadyToFile from '@/components/n400/ReadyToFile';
import useAppLanguage from '@/hooks/useAppLanguage';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import { SKILL_TONE } from '@/components/pathways/ui';

// N-400 Question Guide: explains what questions on the naturalization
// application mean. No learner answers are collected here — only whole-section
// completion is saved.
export default function N400Guide({ cachedUser }) {
  const [language, changeLanguage] = useAppLanguage();
  const isAdmin = cachedUser?.role === 'admin';
  const [progress, setProgress] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'examples' ? 'examples' : 'guide';
  const setView = (next) => setSearchParams(next === 'guide' ? {} : { view: next }, { replace: true });
  // The open folder tab (?section=…); the first section by default.
  const activeSection = N400_SECTIONS.find((s) => s.id === searchParams.get('section')) || N400_SECTIONS[0];
  const openSection = (id) => setSearchParams({ section: id }, { replace: true });
  const completedIds = progress.filter((p) => p.completed).map((p) => p.section_id);

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

  const optionClasses = (active) =>
    `text-left rounded-[14px] border-2 p-4 space-y-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${
      active ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy/40'
    }`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="N-400 Question Guide"
        subtitle="Understand the questions on the naturalization application (Form N-400)."
        tag="Form N-400"
        tagTone={SKILL_TONE.n400}
        art="pencil"
        guide="I can explain what each question and its key words mean. I can't tell you how to answer about your own life. For that, talk to a lawyer."
      />

      <p className="text-base leading-relaxed text-pw-muted">
        This guide explains what each question on Form N-400 means, in plain English. It shows the official
        question, words to know, and other ways an officer might ask it. This guide does not tell you how to
        answer any question, and nothing you say here is saved as an answer.
      </p>

      {/* Sub-pages inside the guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <button
          type="button"
          onClick={() => setView('guide')}
          aria-pressed={view === 'guide'}
          className={optionClasses(view === 'guide')}
        >
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-pw-blue-soft text-pw-blue-ink grid place-items-center shrink-0">
              <BookOpenText className="w-5 h-5" />
            </span>
            <span className="font-bold text-pw-navy text-base flex-1">Question guide</span>
            {view === 'guide' && <CheckCircle2 className="w-5 h-5 text-pw-navy shrink-0" aria-hidden="true" />}
          </div>
          <span className="text-sm block text-pw-muted">
            {N400_SECTIONS.length} sections · the form's words, what they mean, how the officer might ask
          </span>
        </button>
        <button
          type="button"
          onClick={() => setView('examples')}
          aria-pressed={view === 'examples'}
          className={optionClasses(view === 'examples')}
        >
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-pw-teal-soft text-pw-teal-ink grid place-items-center shrink-0">
              <UsersRound className="w-5 h-5" />
            </span>
            <span className="font-bold text-pw-navy text-base flex-1">Example applicants</span>
            {view === 'examples' && <CheckCircle2 className="w-5 h-5 text-pw-navy shrink-0" aria-hidden="true" />}
          </div>
          <span className="text-sm block text-pw-muted">
            Meet 6 practice people · see their answers and their N-400 form
          </span>
        </button>
      </div>

      {view === 'examples' ? (
        <N400Walkthrough />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <LanguageSelector language={language} onLanguageChange={changeLanguage} />
          </div>

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
      <ReadyToFile />
    </div>
  );
}
