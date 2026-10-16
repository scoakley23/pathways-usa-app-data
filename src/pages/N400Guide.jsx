import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpenText, UsersRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import N400Section from '@/components/n400/N400Section';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import N400Walkthrough from '@/components/n400/N400Walkthrough';
import useAppLanguage from '@/hooks/useAppLanguage';
import LanguageSelector from '@/components/lessons/LanguageSelector';

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="N-400 Question Guide"
        subtitle="Understand the questions on the naturalization application (Form N-400)."
      />

      <p className="text-sm leading-relaxed" style={{ color: '#4A5A78' }}>
        This guide explains what each question on Form N-400 means, in plain English. It shows the official
        question, words to know, and other ways an officer might ask it. This guide does not tell you how to
        answer any question, and nothing you say here is saved as an answer.
      </p>

      {/* Sub-pages inside the guide */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl">
        <button
          type="button"
          onClick={() => setView('guide')}
          className={`text-left rounded-2xl border-2 p-4 space-y-1 bg-white transition-colors ${
            view === 'guide' ? 'border-indigo-600' : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpenText className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">Question guide</span>
          </div>
          <span className="text-xs block" style={{ color: '#4A5A78' }}>
            {N400_SECTIONS.length} topics · official questions, words to know, officer phrasings
          </span>
        </button>
        <button
          type="button"
          onClick={() => setView('examples')}
          className={`text-left rounded-2xl border-2 p-4 space-y-1 bg-white transition-colors ${
            view === 'examples' ? 'border-indigo-600' : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">Example applicants</span>
          </div>
          <span className="text-xs block" style={{ color: '#4A5A78' }}>
            Meet 6 practice people · see their answers and their N-400 form
          </span>
        </button>
      </div>

      {view === 'examples' ? (
        <N400Walkthrough />
      ) : (
        <>
          <div className="flex justify-end">
            <LanguageSelector language={language} onLanguageChange={changeLanguage} />
          </div>

          {N400_SECTIONS.map((section) => (
            <N400Section
              key={section.id}
              section={section}
              isAdmin={isAdmin}
              language={language}
              completed={progress.some((p) => p.section_id === section.id && p.completed)}
              onComplete={markComplete}
            />
          ))}
        </>
      )}
    </div>
  );
}