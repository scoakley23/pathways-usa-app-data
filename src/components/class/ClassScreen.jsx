import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Volume2, X } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import useShortcuts from '@/components/pathways/useShortcuts';
import usePackLookup from '@/components/course/usePackLookup';
import { speakText } from '@/components/utils/textToSpeech';
import { UNITS } from '@/lib/course';
import { translateCourse } from '@/lib/courseTitles';
import { classAnswers, classPool, classRound } from '@/lib/classScreen';
import { useClassText } from './classStrings';

// The Class screen (/class, desktop vision D): for partner classes on a
// projector or a big screen. Pick a topic, then one official question at a
// time in very large type, "Show answer" for the official answer, and Next.
// Saves nothing (no records, no browser storage) and needs no sign-in; the
// questions and answers stay in English, word for word. Keys: R read aloud,
// A show or hide the answer, N next, Esc back to the topics.

function TopicButton({ on, title, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[4.5rem] rounded-card bg-white px-4 py-3 text-start flex flex-col justify-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${on ? 'border-[2.5px] border-navy' : 'border-[1.5px] border-line hover:border-navy'}`}
    >
      <span className="text-base font-bold leading-tight break-words" dir="auto">{title}</span>
      <span className="text-small text-muted">{sub}</span>
    </button>
  );
}

function Pick({ t, topics, topic, setTopic, onStart, onBack }) {
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-10 pt-5 lg:pt-10 pb-8 flex flex-col gap-6">
      <button type="button" onClick={onBack} className="self-start min-h-tap inline-flex items-center gap-2 rounded-button px-1 text-base font-semibold text-navy hover:text-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">
        <ArrowLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />{t('back')}
      </button>
      <div className="flex items-center gap-4">
        <Amio mood="hello" size={64} className="shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display text-[2.25rem] lg:text-[3rem] leading-none tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-base text-muted max-w-2xl" dir="auto">{t('intro')} {t('saves_nothing')}</p>
        </div>
      </div>
      <section aria-labelledby="class-topics" className="flex flex-col gap-3">
        <h2 id="class-topics" className="text-lg font-bold">{t('pick_topic')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          {topics.map((x) => (
            <TopicButton key={x.id} on={topic === x.id} title={x.title} sub={t('questions_n', { n: x.count })} onClick={() => setTopic(x.id)} />
          ))}
        </div>
        <p className="text-small text-muted" dir="auto">{t('left_out')}</p>
      </section>
      <Button variant="main" className="w-full sm:w-auto sm:self-start sm:px-12" onClick={onStart}>{t('start')}</Button>
    </div>
  );
}

function Round({ t, topicTitle, questions, index, shown, setShown, onNext, onClose }) {
  const question = questions[index];
  const answer = useMemo(() => classAnswers(question), [question]);
  const last = index === questions.length - 1;
  const read = () => speakText(question.question, 'en');
  useShortcuts({ r: read, a: () => setShown((v) => !v), n: onNext, escape: onClose });
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 lg:px-16 pt-5 lg:pt-10 pb-6 flex flex-col gap-6">
      <div className="flex items-center gap-3 lg:gap-4">
        <button type="button" onClick={onClose} aria-label={t('close')} className="w-11 h-11 -ms-2 shrink-0 rounded-full grid place-items-center text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        <Amio mood="hello" size={48} className="shrink-0 hidden sm:block" />
        <div className="flex-1 min-w-0">
          <p className="text-lg lg:text-xl font-bold">{t('title')}</p>
          <p className="text-small lg:text-base text-muted break-words" dir="auto">{t('status', { topic: topicTitle, n: index + 1, total: questions.length })}</p>
        </div>
        <div className="hidden md:flex gap-1.5" aria-hidden="true">
          {questions.map((q, i) => (
            <span key={q.id} className={`w-8 h-2.5 rounded-sm ${i < index ? 'bg-gold' : i === index ? 'bg-navy' : 'bg-line-soft'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8 py-4">
        <div>
          <p className="text-lg lg:text-2xl font-semibold text-denim" dir="auto">{t('officer_asks')}</p>
          <h1 lang="en" dir="ltr" className="mt-3 font-display text-[2.5rem] sm:text-[3.5rem] lg:text-[5.5rem] leading-[1] tracking-tight max-w-6xl break-words">{question.question}</h1>
        </div>
        {shown && (
          <section aria-live="polite" className="self-start max-w-5xl rounded-card bg-gold text-navy border-[2.5px] border-navy px-5 py-4 lg:px-8 lg:py-6 flex items-start gap-4 lg:gap-6">
            <Check className="w-9 h-9 lg:w-12 lg:h-12 shrink-0 mt-1" strokeWidth={2.6} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-base lg:text-xl font-semibold" dir="auto">{answer.answers.length > 1 ? t('official_answers') : t('official_answer')}</p>
              <ul lang="en" dir="ltr" className="mt-1 list-none m-0 p-0 flex flex-col gap-1">
                {answer.answers.map((a) => <li key={a} className="font-display text-[1.75rem] lg:text-[3rem] leading-[1.05] tracking-tight break-words">{a}</li>)}
              </ul>
              {answer.checkedOn && <p className="mt-3 text-small lg:text-base" dir="auto">{t('checked_on', { date: answer.checkedOn })}</p>}
              {answer.mayChangeSoon && <p className="text-small lg:text-base" dir="auto">{t('may_change')}</p>}
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="second" onClick={read}><Volume2 className="w-5 h-5" aria-hidden="true" />{t('read_aloud')}</Button>
          <Button variant="second" onClick={() => setShown((v) => !v)} aria-expanded={shown}>{shown ? t('hide_answer') : t('show_answer')}</Button>
        </div>
        <Button variant="main" className="w-full sm:w-auto sm:px-12" onClick={onNext}>{last ? t('finish') : t('next')}</Button>
      </div>
      <p className="hidden lg:block text-small text-muted" dir="auto">{t('keys')}</p>
    </div>
  );
}

function Done({ t, total, onAgain, onTopics }) {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 pb-8 flex flex-col items-center text-center gap-4">
      <Amio mood="cheering" size={120} />
      <h1 className="font-display text-[2.5rem] leading-tight">{t('done_title')}</h1>
      <p className="text-lg text-muted" dir="auto">{t('done_body', { n: total })}</p>
      <div className="w-full flex flex-col sm:flex-row gap-3 justify-center mt-2">
        <Button variant="main" className="sm:px-10" onClick={onAgain}>{t('again')}</Button>
        <Button variant="second" className="sm:px-10" onClick={onTopics}>{t('other_topic')}</Button>
      </div>
    </div>
  );
}

export default function ClassScreen() {
  const navigate = useNavigate();
  const { t, rtl, language } = useClassText();
  const tx = usePackLookup(language);
  const units = useMemo(() => translateCourse(UNITS, tx), [tx]);
  const topics = useMemo(() => [
    { id: 'all', title: t('all_topics'), count: classPool('all').length },
    ...units.map((u) => ({ id: u.id, title: u.title, count: classPool(u.id).length })).filter((x) => x.count > 0),
  ], [units, t]);
  const [topic, setTopic] = useState('all');
  const [phase, setPhase] = useState('pick'); // pick | round | done
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);

  const start = () => { setQuestions(classRound(topic)); setIndex(0); setShown(false); setPhase('round'); };
  const next = () => {
    if (index >= questions.length - 1) { setPhase('done'); return; }
    setIndex((i) => i + 1);
    setShown(false);
  };
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/interview'));
  const topicTitle = topics.find((x) => x.id === topic)?.title || '';

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper text-navy flex flex-col">
      <div className="flex-1">
        {phase === 'pick' && <Pick t={t} topics={topics} topic={topic} setTopic={setTopic} onStart={start} onBack={back} />}
        {phase === 'round' && questions.length > 0 && (
          <Round t={t} topicTitle={topicTitle} questions={questions} index={index} shown={shown} setShown={setShown} onNext={next} onClose={() => setPhase('pick')} />
        )}
        {phase === 'done' && <Done t={t} total={questions.length} onAgain={start} onTopics={() => setPhase('pick')} />}
      </div>
    </div>
  );
}
