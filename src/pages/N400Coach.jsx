import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import TutorLesson from '@/components/persona/TutorLesson';
import TutorMessage from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { languageNameFor } from '@/components/persona/languageName';
import { N400_STEPS } from '@/components/persona/n400Steps';
import { PrimaryButton, Tag } from '@/components/pathways/ui';
import N400Folder from '@/components/n400/N400Folder';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import useAppLanguage from '@/hooks/useAppLanguage';
import { allDoneLine, buildN400Lesson, liveSections, pickSection } from '@/lib/n400Lesson';

const linkBtn = 'w-full min-h-[52px] rounded-xl font-semibold text-lg inline-flex items-center justify-center px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2';
// Folder tabs open that section's lesson (the page reads ?section= once).
const openSection = (id) => window.location.assign(`/n400-coach?section=${id}`);

// N-400 coaching (Prompt 9): this week's N-400 Guide section as a tutor
// lesson. Never collects, fills in, or stores form answers — only that the
// section was completed (N400SectionProgress, same as the Guide).
export default function N400Coach() {
  const navigate = useNavigate();
  const { profile, loaded } = useTutorProfile();
  const [language] = useAppLanguage();
  const [user, setUser] = useState(undefined);
  const [progress, setProgress] = useState([]);
  const [stage, setStage] = useState('lesson'); // lesson | done
  const requested = useMemo(() => new URLSearchParams(window.location.search).get('section'), []);

  useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        setUser(u);
        const rows = await base44.entities.N400SectionProgress.filter({ user_email: u.email }).catch(() => []);
        setProgress(rows);
      })
      .catch(() => setUser(null));
  }, []);

  const completed = progress.filter((p) => p.completed).map((p) => p.section_id);
  const section = useMemo(() => pickSection(N400_SECTIONS, completed, requested), [completed.join(','), requested]); // eslint-disable-line react-hooks/exhaustive-deps
  const lesson = useMemo(
    () => (section ? buildN400Lesson({ section, language }) : null),
    [section, language],
  );
  const sections = liveSections(N400_SECTIONS);

  const markComplete = async () => {
    if (!user?.email || !section) return;
    const existing = progress.find((p) => p.section_id === section.id);
    const now = new Date().toISOString();
    try {
      if (existing) {
        await base44.entities.N400SectionProgress.update(existing.id, { completed: true, completed_date: now });
        setProgress((prev) => prev.map((p) => (p.section_id === section.id ? { ...p, completed: true } : p)));
      } else {
        const created = await base44.entities.N400SectionProgress.create({
          user_email: user.email,
          section_id: section.id,
          section_title: section.title,
          completed: true,
          completed_date: now,
        });
        setProgress((prev) => [...prev, created]);
      }
    } catch (e) {
      toast.error("Couldn't save that this section is done. Please try again.");
    }
  };

  if (user === undefined || !loaded) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-pw-navy" />;
  if (!user) {
    return <p className="text-center text-pw-muted mt-12">Please sign in to use the N-400 coach.</p>;
  }

  // Every section done (or finished just now and nothing left): Ready to file?
  if (!section || stage === 'done') {
    const next = pickSection(N400_SECTIONS, completed);
    const allDone = !next;
    const msg = allDone ? allDoneLine(language) : null;
    return (
      <div className="max-w-xl mx-auto space-y-5 text-pw-navy">
        <h1 className="sr-only">N-400 coach</h1>
        <N400Folder sections={sections} activeId={section?.id} completedIds={completed} onSelect={openSection}>
          <Tag tone="green">{allDone ? 'All sections done' : 'Section done'}</Tag>
        </N400Folder>
        {allDone ? (
          <>
            <TutorMessage profile={profile} language={language} mine={msg.mine} en={msg.en} />
            <Link to="/n400-guide?ready=1" className={`${linkBtn} bg-pw-navy text-white`}>Ready to file?</Link>
          </>
        ) : (
          <>
            <TutorMessage profile={profile} language={language} {...profileLine(profile)} />
            <PrimaryButton large className="w-full" onClick={() => navigate('/')}>Back to Today</PrimaryButton>
            <Link to={`/n400-coach?section=${next.id}`} reloadDocument className={`${linkBtn} border-2 border-pw-navy text-pw-navy bg-white`}>
              Next section: {next.title}
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="max-w-xl mx-auto">
        <N400Folder sections={sections} activeId={section.id} completedIds={completed} onSelect={openSection} />
      </div>
      <TutorLesson
        lesson={lesson}
        profile={profile}
        language={language}
        languageName={languageNameFor(language)}
        extraSteps={N400_STEPS}
        onFinish={async () => {
          await markComplete();
          setStage('done');
          window.scrollTo({ top: 0 });
        }}
        onExit={() => navigate('/')}
      />
    </div>
  );
}

// The tutor's "done for today" line in their tone (English; the lesson's
// own messages carry the learner's language).
function profileLine(profile) {
  const lines = {
    warm: 'Nice work on this section. See you next time.',
    direct: 'Section done.',
    coach: 'Section done. One step closer.',
    officer: 'Thank you. That concludes this section.',
  };
  return { en: lines[profile.tone] || lines.warm, mine: null };
}
