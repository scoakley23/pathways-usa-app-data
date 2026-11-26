import React, { useState, useEffect } from 'react';
import { lessonProgress as lessonProgressApi } from '@/api/lessons';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";
import FlashcardView from '@/components/lessons/FlashcardView';
import GlossaryText from '@/components/lessons/GlossaryText';
import LessonNotesTab from '@/components/lessons/LessonNotesTab';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import PosterRun, { cleanQuestionText, officialAnswerText } from '@/components/lessons/PosterRun';
import { ListenButton } from '@/components/persona/TutorMessage';
import OfficeholderNote from '@/components/civics/OfficeholderNote';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { officeholderAnswerFor } from '@/lib/officeholderQuestions';
import { useLessonTranslation } from '@/hooks/useLessonTranslation';
import { Button, Card, ExplainSimplyButton, SegmentedProgress } from '@/components/pathways/ui';
import RedStop from '@/components/pathways/RedStop';
import { questionsForLesson } from '@/lib/lessonQuestions';
import { deckSteps, splitIdeas } from '@/lib/lessonDeck';
import useDeckText from './useDeckText';

const MARKDOWN = 'max-w-none text-lg leading-relaxed text-navy [&_h1]:font-display [&_h2]:font-bold [&_h3]:font-bold [&_h1]:text-[1.5rem] [&_h2]:text-[1.25rem] [&_h3]:text-[1.125rem] [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-2 [&>*:first-child]:mt-0 [&_p]:my-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-6 [&_ol]:ps-6 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1 [&_strong]:font-bold [&_a]:underline';

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
function KeyPointCard({ point, number, t }) {
  const [open, setOpen] = useState(false);
  const text = typeof point === 'string' ? point : point.text;
  const definition = typeof point === 'string' ? null : point.definition;
  const imageUrl = typeof point === 'string' ? null : point.image_url;
  return (
    <Card padding="p-4">
      <p className="text-base font-semibold text-muted" dir="auto">{t('key_point', { n: number })}</p>
      <p className="mt-1 text-[1.375rem] font-bold leading-snug" dir="auto"><GlossaryText>{text}</GlossaryText></p>
      {imageUrl && <img src={imageUrl} alt="" className="mt-4 w-full max-h-64 object-cover rounded-card border border-line" />}
      {definition && (
        <div className="mt-4 space-y-3">
          <ExplainSimplyButton aria-expanded={open} onClick={() => setOpen((v) => !v)}>{t('explain_simply')}</ExplainSimplyButton>
          {open && <p className="rounded-card bg-line-soft p-4 text-lg leading-relaxed" dir="auto">{definition}</p>}
        </div>
      )}
    </Card>
  );
}

// A lesson as a deck (Phase 4): Watch → Learn → Key words → Questions on the
// test → Go over them → done. The lesson's official questions come from its
// topic, matched to this lesson by its words (src/lib/lessonQuestions.js).
// Saves only what it saved before: LessonProgress (completed, scores).
export default function LessonDetail({ lesson, onBack, onComplete, lessons, onNavigateLesson }) {
  const { location } = useLearnerLocation();
  const { t, rtl } = useDeckText();
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
        currentUser = await auth.me();
      } catch (e) { /* signed out */ }
      setUser(currentUser);

      const [lessonFlashcards, civics2025, civics2008, progressList] = await Promise.all([
        content.lessonFlashcards(lesson.id, { limit: 200 }),
        content.civicsQuestions({ version: '2025', category: lesson.topic, limit: 100 }),
        content.civicsQuestions({ version: '2008', category: lesson.topic, limit: 100 }),
        currentUser?.email ? lessonProgressApi.list({ lessonId: lesson.id, limit: 1 }) : Promise.resolve([])
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
          const newProgress = await lessonProgressApi.save(null, {
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
    const existing = await lessonProgressApi.get(lesson.id);
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
    await lessonProgressApi.save(existing, data);
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
      toast.info(t('sign_in_save'), {
        action: { label: t('sign_in'), onClick: () => auth.goToSignIn() },
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
        <Loader2 className="w-8 h-8 animate-spin text-navy" aria-label={t('loading')} />
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

  const stepName = (id) => t(`step_${id}`);
  const nav = 'min-h-[56px] rounded-card border-[1.5px] border-line bg-white p-3 flex items-center gap-2 hover:border-navy min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim';

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="max-w-lg mx-auto flex flex-col gap-5 text-navy">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <button type="button" onClick={onBack} className="self-start -ms-2 min-h-tap inline-flex items-center gap-2 px-2 rounded-button text-base font-semibold text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /> <span dir="auto">{t('all_lessons')}</span>
        </button>
        <div>
          {displayLesson.topic && <p className="text-base font-semibold text-muted" dir="auto">{displayLesson.topic}</p>}
          <h1 className="mt-1 font-display text-[1.75rem] leading-tight" dir="auto">{displayLesson.title}</h1>
          {displayLesson.description && <p className="text-muted text-base mt-2" dir="auto">{displayLesson.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LanguageSelector language={language} onLanguageChange={setLanguage} translating={translating} />
          {translating ? (
            <span className="inline-flex items-center gap-2 rounded-button bg-line-soft px-3 py-1.5 text-small font-semibold" dir="auto"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('translating')}</span>
          ) : lessonProgress?.completed ? (
            <span className="inline-flex items-center gap-1.5 rounded-button bg-gold px-3 py-1.5 text-small font-semibold text-navy" dir="auto"><Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> {t('lesson_completed')}</span>
          ) : null}
        </div>
        {!finished && (
          <div className="space-y-2">
            <p className="text-small font-semibold text-muted" dir="auto">{t('step_of', { n: stepIndex + 1, total: steps.length, step: stepName(step) })}</p>
            <SegmentedProgress current={stepIndex} total={steps.length} label={t('step_of', { n: stepIndex + 1, total: steps.length, step: stepName(step) })} />
          </div>
        )}
      </header>

      {!finished && (
        <>
          {/* Watch */}
          {step === 'watch' && (
            videoId ? (
              <div className="w-full rounded-card overflow-hidden bg-navy">
                <div className="relative" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}`}
                    title={t('video_title')}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <Card padding="p-4"><p className="text-lg text-muted" dir="auto">{t('no_video')}</p></Card>
            )
          )}

          {/* Learn: one idea per card */}
          {step === 'learn' && (
            <div className="flex flex-col gap-3">
              {keyPoints.map((point, i) => <KeyPointCard key={`kp-${i}`} point={point} number={i + 1} t={t} />)}
              {ideas.map((idea, i) => (
                <Card key={`idea-${i}`} padding="p-4">
                  <div className={MARKDOWN} dir="auto">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p><GlossaryText>{children}</GlossaryText></p>,
                        li: ({ children }) => <li><GlossaryText>{children}</GlossaryText></li>,
                      }}
                    >
                      {idea}
                    </ReactMarkdown>
                  </div>
                </Card>
              ))}
              {!keyPoints.length && !ideas.length && <Card padding="p-4"><p className="text-lg text-muted" dir="auto">{t('no_text')}</p></Card>}
            </div>
          )}

          {/* Key words: flip cards */}
          {step === 'words' && (
            <Card padding="p-4">
              <h2 className="mb-3 text-lg font-bold" dir="auto">{stepName('words')}</h2>
              <FlashcardView flashcards={displayFlashcards} />
            </Card>
          )}

          {/* Questions on the test: official wording and answers */}
          {step === 'questions' && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xl font-bold leading-snug" dir="auto">{t('exact_questions')}</p>
                <p className="mt-1 text-base text-muted" dir="auto">{questions.length === 1 ? t('questions_one', { version }) : t('questions_many', { n: questions.length, version })}</p>
              </div>
              <ol className="flex flex-col gap-3 list-none m-0 p-0">
                {questions.map((q, i) => (
                  <li key={q.id}>
                    <Card padding="p-4">
                      <p className="text-base font-semibold text-muted" dir="auto">{t('question_n', { n: i + 1 })}</p>
                      <p className="mt-1 text-xl font-bold leading-snug" lang="en" dir="ltr">{cleanQuestionText(q.question)}</p>
                      <p className="mt-3 text-lg leading-snug" lang="en" dir="ltr">{t('answer', { answer: officialAnswerText(q, location) })}</p>
                      <OfficeholderNote answer={officeholderAnswerFor(q, location)} graded={false} className="mt-2" />
                      <ListenButton text={cleanQuestionText(q.question)} language="en" className="mt-3" />
                    </Card>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Go over them: the poster run */}
          {step === 'review' && (
            <PosterRun key={runKey} questions={questions} language={language} onFinish={finishRun} />
          )}

          {/* Step navigation (the poster run moves itself to the end) */}
          {step !== 'review' && (
            <div className="flex flex-col gap-2">
              {isLast ? (
                <Button variant="main" className="w-full" onClick={() => setFinished(true)}>{t('finish')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /></Button>
              ) : (
                <Button variant="main" className="w-full" onClick={() => go(stepIndex + 1)}><span dir="auto">{stepName(steps[stepIndex + 1])}</span> <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /></Button>
              )}
              {stepIndex > 0 && (
                <Button variant="second" className="w-full" onClick={() => go(stepIndex - 1)}><ChevronLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /> {t('back')}</Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Done: summary, notes, what next */}
      {finished && (
        <div className="flex flex-col gap-4">
          <Card padding="p-5">
            <p className="text-base font-semibold text-muted" dir="auto">{displayLesson.title}</p>
            <h2 className="mt-1 font-display text-[2rem] leading-tight" dir="auto"><RedStop>{t('done_title')}</RedStop></h2>
            {result ? (
              <>
                <p className="mt-3 text-xl font-semibold" dir="auto">{t('right_of', { n: result.correct, total: result.total })}</p>
                <p className="mt-2 text-base text-muted" dir="auto">{t('meaning_note')}</p>
              </>
            ) : questions.length === 0 ? (
              <p className="mt-3 text-base text-muted" dir="auto">{t('no_test_questions')}</p>
            ) : (
              <p className="mt-3 text-base text-muted" dir="auto">{t('go_over_any_time')}</p>
            )}
          </Card>
          {nextLesson && (
            <Button variant="main" className="w-full" onClick={() => goToLesson(nextLesson)}>{t('next_lesson')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /></Button>
          )}
          {questions.length === 0 && !lessonProgress?.completed && (
            <Button variant={nextLesson ? 'second' : 'main'} className="w-full" onClick={markComplete}>{t('mark_complete')}</Button>
          )}
          {questions.length > 0 && (
            <Button variant="second" className="w-full" onClick={() => { setFinished(false); setResult(null); setRunKey((k) => k + 1); setStepIndex(steps.indexOf('review')); }}>
              <RotateCcw className="w-5 h-5" aria-hidden="true" /> {t('go_over_again')}
            </Button>
          )}
          {user?.email && <LessonNotesTab lesson={lesson} userEmail={user.email} />}
        </div>
      )}

      {/* Lesson navigation */}
      {lessons && lessons.length > 1 && (
        <nav aria-label={t('lesson_nav')} className="grid grid-cols-2 gap-2 pt-5 border-t border-line">
          {prevLesson ? (
            <button type="button" onClick={() => goToLesson(prevLesson)} className={`${nav} text-start`}>
              <ChevronLeft className="w-5 h-5 shrink-0 rtl:rotate-180" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-small text-muted" dir="auto">{t('previous')}</span>
                <span className="block text-base font-semibold truncate" dir="auto">{prevLesson.title}</span>
              </span>
            </button>
          ) : <span />}
          {nextLesson ? (
            <button type="button" onClick={() => goToLesson(nextLesson)} className={`${nav} justify-end text-end`}>
              <span className="min-w-0">
                <span className="block text-small text-muted" dir="auto">{t('next')}</span>
                <span className="block text-base font-semibold truncate" dir="auto">{nextLesson.title}</span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0 rtl:rotate-180" aria-hidden="true" />
            </button>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
