import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";
import FlashcardView from '@/components/lessons/FlashcardView';
import GlossaryText from '@/components/lessons/GlossaryText';
import LessonNotesTab from '@/components/lessons/LessonNotesTab';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import PosterRun, { cleanQuestionText, officialAnswerText } from '@/components/lessons/PosterRun';
import { ListenButton } from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { useLessonTranslation } from '@/hooks/useLessonTranslation';
import { Eyebrow, ExplainSimplyButton, IndexCard, PrimaryButton, QuietButton, SecondaryButton, SegmentedProgress, Tag } from '@/components/pathways/ui';
import { questionsForLesson } from '@/lib/lessonQuestions';
import { STEP_LABELS, deckSteps, splitIdeas } from '@/lib/lessonDeck';

const MARKDOWN = 'max-w-none text-lg leading-relaxed text-pw-navy [&_h1]:font-display [&_h2]:font-display [&_h3]:font-display [&_h1]:text-3xl [&_h2]:text-[28px] [&_h3]:text-2xl [&_h1]:font-normal [&_h2]:font-normal [&_h3]:font-normal [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-2 [&>*:first-child]:mt-0 [&_p]:my-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1 [&_strong]:font-bold [&_a]:underline';

const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^/?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// One key point as an index card; "Explain it simply" reveals its
// definition (lesson content written by the team, nothing AI-made).
function KeyPointCard({ point, number }) {
  const [open, setOpen] = useState(false);
  const text = typeof point === 'string' ? point : point.text;
  const definition = typeof point === 'string' ? null : point.definition;
  const imageUrl = typeof point === 'string' ? null : point.image_url;
  return (
    <IndexCard tab={`Key point ${number}`} tabSkill="civics">
      <p className="font-display text-[26px] leading-snug"><GlossaryText>{text}</GlossaryText></p>
      {imageUrl && <img src={imageUrl} alt="" className="mt-4 w-full max-h-64 object-cover rounded-[10px] border border-pw-line" />}
      {definition && (
        <div className="mt-4 space-y-3">
          <ExplainSimplyButton aria-expanded={open} onClick={() => setOpen((v) => !v)} />
          {open && <p className="rounded-[10px] bg-pw-blue-soft p-4 text-lg leading-relaxed">{definition}</p>}
        </div>
      )}
    </IndexCard>
  );
}

// A lesson as a deck (Phase 4): Watch → Learn → Key words → Questions on the
// test → Go over them → done. The lesson's official questions come from its
// topic, matched to this lesson by its words (src/lib/lessonQuestions.js).
// Saves only what it saved before: LessonProgress (completed, scores).
export default function LessonDetail({ lesson, onBack, onComplete, lessons, onNavigateLesson }) {
  const { profile } = useTutorProfile();
  const [user, setUser] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [lessonProgress, setLessonProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null); // { correct, total }
  const [runKey, setRunKey] = useState(0);

  // Official questions and answers are not sent for translation: the
  // learner sees them in English, as the officer asks them.
  const { language, setLanguage, translating, displayLesson, displayFlashcards } = useLessonTranslation({ lesson, flashcards, quizzes: [] });

  useEffect(() => {
    loadData();
    setStepIndex(0);
    setFinished(false);
    setResult(null);
  }, [lesson?.id]);

  const loadData = async () => {
    if (!lesson?.id) return;
    setLoading(true);
    try {
      // Signed-out learners can still practice; they just don't save progress.
      let currentUser = null;
      try {
        currentUser = await base44.auth.me();
      } catch (e) { /* signed out */ }
      setUser(currentUser);

      const [lessonFlashcards, civics2025, civics2008, progressList] = await Promise.all([
        base44.entities.LessonFlashcard.filter({ lesson_id: lesson.id }, null, 200),
        base44.entities.CivicsQuestion.filter({ version: '2025', category: lesson.topic }, null, 100),
        base44.entities.CivicsQuestion.filter({ version: '2008', category: lesson.topic }, null, 100),
        currentUser?.email ? base44.entities.LessonProgress.filter(
          { user_email: currentUser.email, lesson_id: lesson.id }, null, 1
        ) : Promise.resolve([])
      ]);

      setFlashcards(lessonFlashcards);
      // Use 2025 questions, fall back to 2008 if none available.
      const topicQuestions = civics2025.length > 0 ? civics2025 : civics2008;
      const mine = questionsForLesson(lesson, lessons, topicQuestions);
      setQuestions(mine);
      if (progressList.length > 0) {
        setLessonProgress(progressList[0]);
      } else if (currentUser?.email) {
        // Mark as "in progress" the moment they open the lesson
        try {
          const newProgress = await base44.entities.LessonProgress.create({
            user_email: currentUser.email,
            lesson_id: lesson.id,
            topic: lesson.topic,
            completed: false,
            quiz_attempts: 0,
            best_score: 0,
            last_score: 0,
            total_questions: mine.length,
            last_attempt_date: new Date().toISOString(),
            needs_review: false
          });
          setLessonProgress(newProgress);
        } catch (e) {
          console.error('Failed to create initial progress:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load lesson data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (fields) => {
    if (!user?.email) return false;
    const existing = await base44.entities.LessonProgress.filter({ user_email: user.email, lesson_id: lesson.id }, null, 1);
    const data = {
      user_email: user.email,
      lesson_id: lesson.id,
      topic: lesson.topic,
      quiz_attempts: lessonProgress?.quiz_attempts || 0,
      best_score: lessonProgress?.best_score || 0,
      last_score: lessonProgress?.last_score || 0,
      needs_review: lessonProgress?.needs_review || false,
      total_questions: questions.length,
      last_attempt_date: new Date().toISOString(),
      ...fields,
    };
    if (existing.length > 0) await base44.entities.LessonProgress.update(existing[0].id, data);
    else await base44.entities.LessonProgress.create(data);
    setLessonProgress((prev) => ({ ...prev, ...data }));
    return true;
  };

  // End of "Go over them": save the score and mark the lesson complete.
  const finishRun = async ({ correct, total }) => {
    setResult({ correct, total });
    setFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const pct = total ? (correct / total) * 100 : 0;
    try {
      await saveProgress({
        completed: true,
        quiz_attempts: (lessonProgress?.quiz_attempts || 0) + 1,
        best_score: Math.max(lessonProgress?.best_score || 0, pct),
        last_score: pct,
        needs_review: pct < 60,
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  // Lessons without official questions end with "Mark lesson complete".
  const markComplete = async () => {
    if (!user?.email) {
      toast.info('Sign in to save your progress.', {
        action: { label: 'Sign in', onClick: () => base44.auth.redirectToLogin(window.location.href) },
      });
      return;
    }
    try {
      await saveProgress({ completed: true });
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
    if (onComplete) onComplete();
  };

  const currentIndex = lessons ? lessons.findIndex((l) => l.id === lesson?.id) : -1;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < (lessons?.length || 0) - 1 ? lessons[currentIndex + 1] : null;
  const goToLesson = (l) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onNavigateLesson) onNavigateLesson(l);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-pw-navy" aria-label="Loading" />
      </div>
    );
  }

  const videoId = extractYouTubeId(lesson.video_url);
  const steps = deckSteps({ hasVideo: !!lesson.video_url, hasWords: displayFlashcards.length > 0, hasQuestions: questions.length > 0 });
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const ideas = splitIdeas(displayLesson.content);
  const keyPoints = displayLesson.key_points || [];
  const isLast = stepIndex >= steps.length - 1;
  const go = (i) => {
    setStepIndex(Math.max(0, Math.min(steps.length - 1, i)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const version = questions[0]?.version || '2025';

  return (
    <div className="space-y-6 text-pw-navy">
      {/* Header */}
      <header className="space-y-4">
        <QuietButton onClick={onBack} className="-ml-3">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" /> All lessons
        </QuietButton>
        <div>
          {displayLesson.topic && <Eyebrow>{displayLesson.topic}</Eyebrow>}
          <h1 className="mt-1 font-display text-[36px] sm:text-[44px] leading-[1.05]">{displayLesson.title}</h1>
          {displayLesson.description && <p className="text-pw-muted text-lg mt-2">{displayLesson.description}</p>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LanguageSelector language={language} onLanguageChange={setLanguage} translating={translating} />
          {translating ? (
            <Tag tone="blue"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating…</Tag>
          ) : lessonProgress?.completed ? (
            <Tag tone="green">Lesson completed</Tag>
          ) : null}
        </div>
        {!finished && (
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pw-muted">
              Step {stepIndex + 1} of {steps.length} · {STEP_LABELS[step]}
            </p>
            <SegmentedProgress current={stepIndex} total={steps.length} label={`Step ${stepIndex + 1} of ${steps.length}: ${STEP_LABELS[step]}`} />
          </div>
        )}
      </header>

      {!finished && (
        <>
          {/* Watch */}
          {step === 'watch' && (
            videoId ? (
              <div className="w-full rounded-[14px] overflow-hidden shadow-raised bg-black">
                <div className="relative" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}`}
                    title="Lesson video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <IndexCard><p className="text-lg text-pw-muted">Video not available.</p></IndexCard>
            )
          )}

          {/* Learn: one idea per card */}
          {step === 'learn' && (
            <div className="space-y-6">
              {keyPoints.map((point, i) => <KeyPointCard key={`kp-${i}`} point={point} number={i + 1} />)}
              {ideas.map((idea, i) => (
                <IndexCard key={`idea-${i}`}>
                  <div className={MARKDOWN}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p><GlossaryText>{children}</GlossaryText></p>,
                        li: ({ children }) => <li><GlossaryText>{children}</GlossaryText></li>,
                      }}
                    >
                      {idea}
                    </ReactMarkdown>
                  </div>
                </IndexCard>
              ))}
              {!keyPoints.length && !ideas.length && <IndexCard><p className="text-lg text-pw-muted">This lesson has no text yet.</p></IndexCard>}
            </div>
          )}

          {/* Key words: flip cards */}
          {step === 'words' && (
            <IndexCard tab="Key words" tabSkill="civics">
              <FlashcardView flashcards={displayFlashcards} />
            </IndexCard>
          )}

          {/* Questions on the test: official wording and answers */}
          {step === 'questions' && (
            <div className="space-y-4">
              <div>
                <p className="font-display italic text-2xl leading-snug">These are the exact questions the officer may ask.</p>
                <p className="mt-1 text-base text-pw-muted">{questions.length} {questions.length === 1 ? 'question' : 'questions'} from the {version} civics test, in English, with the official answers.</p>
              </div>
              <ol className="space-y-4">
                {questions.map((q, i) => (
                  <li key={q.id}>
                    <IndexCard tab={`Question ${i + 1}`} tabSkill="civics">
                      <p className="text-xl font-semibold leading-snug">{cleanQuestionText(q.question)}</p>
                      <p className="mt-3 font-display italic text-xl leading-snug">Answer: {officialAnswerText(q)}</p>
                      <ListenButton text={cleanQuestionText(q.question)} language="en" className="mt-3" />
                    </IndexCard>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Go over them: the poster run */}
          {step === 'review' && (
            <PosterRun key={runKey} questions={questions} language={language} tutorName={profile.name} onFinish={finishRun} />
          )}

          {/* Step navigation (the poster run moves itself to the end) */}
          {step !== 'review' && (
            <div className="flex items-center justify-between gap-3">
              {stepIndex > 0 ? (
                <SecondaryButton onClick={() => go(stepIndex - 1)}><ChevronLeft className="w-5 h-5" aria-hidden="true" /> Back</SecondaryButton>
              ) : <span />}
              {isLast ? (
                <PrimaryButton onClick={() => setFinished(true)}>Finish <ArrowRight className="w-5 h-5" aria-hidden="true" /></PrimaryButton>
              ) : (
                <PrimaryButton onClick={() => go(stepIndex + 1)}>{STEP_LABELS[steps[stepIndex + 1]]} <ArrowRight className="w-5 h-5" aria-hidden="true" /></PrimaryButton>
              )}
            </div>
          )}
        </>
      )}

      {/* Done card: summary, notes, what next */}
      {finished && (
        <div className="space-y-6">
          <IndexCard padding="p-6">
            <Eyebrow>Lesson done</Eyebrow>
            <h2 className="mt-2 font-display text-[32px] leading-tight">{displayLesson.title}</h2>
            {result ? (
              <>
                <p className="mt-3 text-xl">You knew <span className="font-display text-3xl">{result.correct}</span> of {result.total} questions.</p>
                <p className="mt-2 text-lg text-pw-muted">At the interview, the officer asks out loud. Your answer doesn't need to be word for word, only right in meaning.</p>
              </>
            ) : questions.length === 0 ? (
              <p className="mt-3 text-lg text-pw-muted">This lesson has no test questions to go over yet.</p>
            ) : (
              <p className="mt-3 text-lg text-pw-muted">Go over the questions any time to check what you know.</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {questions.length > 0 && (
                <SecondaryButton onClick={() => { setFinished(false); setResult(null); setRunKey((k) => k + 1); setStepIndex(steps.indexOf('review')); }}>
                  <RotateCcw className="w-5 h-5" aria-hidden="true" /> Go over them again
                </SecondaryButton>
              )}
              {questions.length === 0 && !lessonProgress?.completed && (
                <PrimaryButton onClick={markComplete}>Mark lesson complete</PrimaryButton>
              )}
              {nextLesson && (
                <PrimaryButton onClick={() => goToLesson(nextLesson)}>Next lesson <ArrowRight className="w-5 h-5" aria-hidden="true" /></PrimaryButton>
              )}
            </div>
          </IndexCard>
          {user?.email && (
            <IndexCard tab="My notes" tabSkill="n400">
              <LessonNotesTab lesson={lesson} userEmail={user.email} />
            </IndexCard>
          )}
        </div>
      )}

      {/* Lesson navigation */}
      {lessons && lessons.length > 1 && (
        <nav aria-label="Lesson navigation" className="grid grid-cols-2 gap-3 pt-6 border-t border-pw-line">
          {prevLesson ? (
            <button
              type="button"
              onClick={() => goToLesson(prevLesson)}
              className="min-h-[56px] rounded-[14px] border border-pw-line bg-white p-3 flex items-center gap-2 text-left hover:border-pw-navy transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
            >
              <ChevronLeft className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm text-pw-muted">Previous</span>
                <span className="block text-base font-semibold truncate">{prevLesson.title}</span>
              </span>
            </button>
          ) : <span />}
          {nextLesson ? (
            <button
              type="button"
              onClick={() => goToLesson(nextLesson)}
              className="min-h-[56px] rounded-[14px] border border-pw-line bg-white p-3 flex items-center justify-end gap-2 text-right hover:border-pw-navy transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
            >
              <span className="min-w-0">
                <span className="block text-sm text-pw-muted">Next</span>
                <span className="block text-base font-semibold truncate">{nextLesson.title}</span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </button>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
