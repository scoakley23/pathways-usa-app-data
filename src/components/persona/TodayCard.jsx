import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { ListenButton } from './TutorMessage';
import TutorIntro from './TutorIntro';
import PlanSetup from './PlanSetup';
import useTutorProfile from './useTutorProfile';
import useTodayText from './useTodayText';
import useTextSize from './useTextSize';
import { partName } from './SkillLevels';
import { Eyebrow, IndexCard, PrimaryButton, QuietButton, RaisedCard, SecondaryButton, SKILL_COLOR, Tag } from '@/components/pathways/ui';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import { tasksForDay, extraTasks, totalMinutes, dayIndex } from '@/lib/studyPlan';
import { loadPlanSettings, loadDone, saveDone, touchVisit, ymd } from '@/lib/planSettings';
import { recentResults, adjustedLevels, lowSkills, checkIns } from '@/lib/checkIns';
import { loadStage } from '@/lib/onboarding';
import { firstName, splitTasks, stageKey, timeOfDay, weekSquares, weeksToInterview } from '@/lib/todayView';

const SECTION_IDS = N400_SECTIONS.map((s) => s.id);
const SECTION_TITLE = Object.fromEntries(N400_SECTIONS.map((s) => [s.id, s.title]));
const DISMISS_KEY = 'pathways_checkins_dismissed'; // { date, ids }

// Which interview skill a task practices (for its color).
const taskSkill = (kind) => (kind.startsWith('civics') ? 'civics' : kind);

function loadDismissed(today) {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || 'null');
    return v && v.date === ymd(today) ? v.ids : [];
  } catch (e) { return []; }
}
function saveDismissed(today, ids) {
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify({ date: ymd(today), ids })); } catch (e) { /* ignore */ }
}

// Days practiced this week (Monday–Sunday, as whole-day numbers) from saved
// progress and the checkmarks on this device.
function practiceDaysThisWeek(dates, today) {
  const t = dayIndex(today);
  const monday = t - ((today.getDay() + 6) % 7);
  const days = new Set();
  for (const d of dates) {
    if (!d) continue;
    const i = dayIndex(new Date(d));
    if (i >= monday && i <= t) days.add(i);
  }
  for (let i = monday; i <= t; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (t - i));
    if (loadDone(date).length) days.add(i);
  }
  return days;
}

// The "Today" card (Prompt 6) with check-ins (Prompt 8), laid out as X2
// (Phase 3): greeting, Vía's line signed in text, a stack of index cards on
// Slate (top = the next task), "Also today", and the week's rhythm. Learners
// without a plan or quick check results meet their tutor and start the quick
// check. The greeting is the Home page's h1.
export default function TodayCard({ language = 'en', homeT }) {
  const today = useMemo(() => new Date(), []);
  const { profile, loaded: profileLoaded, saveProfile } = useTutorProfile();
  const { t, en, mine } = useTodayText(language);
  const [data, setData] = useState(null);
  const [plan, setPlan] = useState(() => loadPlanSettings());
  const [done, setDone] = useState(() => loadDone(today));
  const [missedDays] = useState(() => touchVisit(today));
  const [dismissed, setDismissed] = useState(() => loadDismissed(today));
  const [extra, setExtra] = useState(false);
  const [stage] = useState(() => loadStage());
  const { className: sizeClass } = useTextSize();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        const email = user.email.toLowerCase().trim();
        const [progress, sessions, lessons, n400, civics2025] = await Promise.all([
          base44.entities.UserProgress.filter({ user_email: email }, '-last_practiced', 500).catch(() => []),
          base44.entities.InterviewSession.filter({ user_email: email }, '-created_date', 50).catch(() => []),
          base44.entities.LessonProgress.filter({ user_email: email }, null, 200).catch(() => []),
          base44.entities.N400SectionProgress.filter({ user_email: email }, null, 50).catch(() => []),
          base44.entities.CivicsQuestion.filter({ version: '2025' }, null, 300).catch(() => []),
        ]);
        if (!active) return;
        const civicsIds = new Set(civics2025.map((q) => q.id));
        const ready = progress.filter((p) => p.content_type === 'civics_question' && p.status === 'mastered' && civicsIds.has(p.content_id)).length;
        setData({
          name: firstName(user),
          levels: user.skill_levels || null,
          progress,
          sessions,
          completedSections: n400.filter((s) => s.completed).map((s) => s.section_id),
          activityDates: [
            ...progress.map((p) => p.last_practiced),
            ...sessions.map((s) => s.created_date),
            ...lessons.map((l) => l.last_attempt_date),
            ...n400.map((s) => s.completed_date),
          ],
          ready,
          civicsTotal: civics2025.length,
        });
      } catch (e) {
        if (active) setData({ signedOut: true });
      }
    })();
    return () => { active = false; };
  }, []);

  const recent = useMemo(() => (data?.progress ? recentResults({ progress: data.progress, sessions: data.sessions, today }) : null), [data, today]);
  const levels = data?.levels || {};
  const low = useMemo(() => (recent ? lowSkills({ levels, recent, planStart: plan?.start, today }) : []), [recent, levels, plan, today]);

  const tasks = useMemo(() => {
    if (!data || data.signedOut) return [];
    const base = tasksForDay({
      date: today,
      start: plan?.start || today,
      target: plan?.target || null,
      levels: adjustedLevels(levels, low),
      sections: SECTION_IDS,
      completedSections: data.completedSections,
      missedDays,
    });
    return extra ? [...base, ...extraTasks(today)] : base;
  }, [data, plan, levels, low, missedDays, extra, today]);

  if (!data || !profileLoaded) {
    return <RaisedCard className="grid place-items-center min-h-[120px]"><Loader2 className="w-6 h-6 animate-spin text-pw-navy" /></RaisedCard>;
  }
  if (data.signedOut) return null;
  if (!data.levels && !plan) return <TutorIntro t={homeT} language={language} />;

  const allDone = tasks.length > 0 && tasks.every((task) => done.includes(task.id));
  const toggle = (id) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    saveDone(today, next);
  };
  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    saveDismissed(today, next);
  };

  const n = tasks.length;
  const m = totalMinutes(tasks);
  const tod = timeOfDay(today);
  const hello = data.name ? t(`hello_${tod}`, { name: data.name }) : t(`hello_${tod}_plain`);
  const lineKey = allDone ? 'done' : `${profile.tone}_tasks`;
  const lineMine = mine(lineKey, { n, m });
  const lineEn = en(lineKey, { n, m });
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const stageLabel = stageKey(stage) && t(stageKey(stage));

  // One check-in at a time, most important first, so the card stays calm.
  const notes = checkIns({
    missedDays,
    levels,
    checkedAt: data.levels?.checked_at,
    recent,
    planStart: plan?.start,
    englishMix: profile.english_mix,
    language,
    today,
    dismissed,
  }).slice(0, 1);

  const practiced = practiceDaysThisWeek(data.activityDates, today);
  const daysCount = practiced.size;
  const daysKey = daysCount === 0 ? 'days_week_none' : daysCount === 1 ? 'days_week_one' : 'days_week';
  const squares = weekSquares([...practiced], dayIndex(today), today.getDay());
  const weeks = weeksToInterview(plan, today);
  const weeksKey = weeks === 0 ? 'weeks_left_none' : weeks === 1 ? 'weeks_left_one' : 'weeks_left';

  const { top, rest } = splitTasks(tasks, done);
  const waiting = rest.filter((task) => !done.includes(task.id)).length;
  const skillName = (task) => (taskSkill(task.kind) === 'n400' ? 'N-400' : partName(taskSkill(task.kind), language));
  const taskLabel = (task) => {
    if (task.kind === 'n400') return t('task_n400', { section: SECTION_TITLE[task.section] || '' });
    return t(`task_${task.kind.replace('-', '_')}`);
  };

  const moreEnglish = async (next, id) => {
    try {
      await saveProfile({ ...profile, english_mix: next });
      toast.success(t('mix_btn'));
    } catch (e) { /* keep the note */ }
    dismiss(id);
  };

  const doneButton = (task, className = '') => {
    const isDone = done.includes(task.id);
    return (
      <button
        type="button"
        onClick={() => toggle(task.id)}
        aria-pressed={isDone}
        aria-label={isDone ? t('mark_not_done') : t('mark_done')}
        className={`min-w-[44px] min-h-[44px] shrink-0 grid place-items-center rounded-xl hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy ${className}`}
      >
        <span className={`w-7 h-7 rounded-full border-2 grid place-items-center ${isDone ? 'bg-pw-writing border-pw-writing' : 'border-pw-line bg-white'}`}>
          {isDone && <Check className="w-4 h-4 text-white" strokeWidth={3} aria-hidden="true" />}
        </span>
      </button>
    );
  };

  return (
    <section aria-labelledby="today-title" className="space-y-5 text-pw-navy">
      {/* Greeting and Vía's line, signed in text (her mark is in the tab bar) */}
      <div className={`space-y-3 ${sizeClass}`}>
        {stageLabel && <Tag tone="navy">{stageLabel}</Tag>}
        <h1 id="today-title" className="font-display text-[40px] leading-[1.05] sm:text-[48px]">{hello}</h1>
        <div>
          {lineMine && <p dir={dir} className="font-display italic text-2xl leading-snug">{lineMine}</p>}
          <p className={`font-display italic leading-snug ${lineMine ? 'mt-1 text-lg text-pw-muted' : 'text-2xl'}`}>{lineEn}</p>
          <p className="mt-1 font-display italic text-lg text-pw-muted">— {profile.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lineMine && <ListenButton text={lineMine} language={language} tutorName={profile.name} />}
          <ListenButton text={lineEn} language="en" label={lineMine ? 'English' : 'Listen'} tutorName={profile.name} />
        </div>
      </div>

      {!plan && (
        <PlanSetup profile={profile} language={language} again onDone={setPlan} />
      )}

      {notes.map((note) => (
        <RaisedCard key={note.id} className="space-y-3 border-l-4 border-l-pw-navy">
          {note.kind === 'welcome-back' && <p className="text-base">{t('welcome_back')}</p>}
          {note.kind === 'low-skill' && <p className="text-base">{t('low_skill', { skills: note.skills.map((s) => partName(s, language)).join(', ') })}</p>}
          {note.kind === 'recheck' && (
            <>
              <p className="text-base">{t('recheck', { skill: partName(note.skill, language) })}</p>
              <Link to={`/quick-check?part=${note.skill}`} className="min-h-11 w-full rounded-xl bg-pw-navy text-white font-semibold inline-flex items-center justify-center px-4 hover:bg-pw-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2">{t('recheck_btn')}</Link>
            </>
          )}
          {note.kind === 'english-mix' && (
            <>
              <p className="text-base">{t('mix')}</p>
              <PrimaryButton className="w-full" onClick={() => moreEnglish(note.next, note.id)}>{t('mix_btn')}</PrimaryButton>
            </>
          )}
          <QuietButton className="w-full" onClick={() => dismiss(note.id)}>{t('not_now')}</QuietButton>
        </RaisedCard>
      ))}

      {/* The card stack: today's next task on top, the others peeking out */}
      <div className="rounded-[20px] bg-pw-slate px-4 pt-5 pb-6 sm:px-6">
        <div className="relative pb-4">
          {waiting > 0 && <div aria-hidden="true" className="absolute left-3 right-3 top-10 bottom-2 rounded-[14px] bg-white/80 border border-pw-line" />}
          {waiting > 1 && <div aria-hidden="true" className="absolute left-6 right-6 top-12 bottom-0 rounded-[14px] bg-white/60 border border-pw-line" />}
          {top ? (
            <IndexCard className="relative" tab={skillName(top)} tabSkill={taskSkill(top.kind)} padding="p-5 sm:p-6">
              <Eyebrow>{t('task_of', { n: tasks.indexOf(top) + 1, t: n })}</Eyebrow>
              <h2 className="mt-2 font-display text-[30px] leading-tight">{taskLabel(top)}</h2>
              <p className="mt-1 text-base text-pw-muted">{t('minutes', { m: top.minutes })}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <Link
                  to={top.href}
                  className="min-h-[48px] rounded-full bg-pw-navy text-white font-semibold text-lg inline-flex items-center gap-2 px-6 hover:bg-pw-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
                >
                  {t('start')} <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                {doneButton(top)}
              </div>
            </IndexCard>
          ) : (
            <IndexCard className="relative" padding="p-5 sm:p-6">
              <h2 className="font-display text-[30px] leading-tight">{t('all_done_title')}</h2>
              <p className="mt-1 text-base text-pw-muted">{t('done')}</p>
              {!extra && <SecondaryButton className="mt-4 w-full" onClick={() => setExtra(true)}>{t('keep_going')}</SecondaryButton>}
            </IndexCard>
          )}
        </div>
      </div>

      {/* Also today: the other tasks, finished ones stamped */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('also_today')}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rest.map((task) => {
              const isDone = done.includes(task.id);
              return (
                <li key={task.id} className="flex items-stretch rounded-[14px] bg-white border border-pw-line shadow-raised overflow-hidden">
                  <span className={`w-1.5 shrink-0 ${SKILL_COLOR[taskSkill(task.kind)]}`} aria-hidden="true" />
                  <Link
                    to={task.href}
                    className="flex-1 min-w-0 px-3 py-3 min-h-[64px] hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pw-navy"
                  >
                    <span className="flex items-center gap-2 text-sm text-pw-muted">
                      {skillName(task)} · {t('minutes', { m: task.minutes })}
                      {isDone && (
                        <span className="ml-auto -rotate-6 rounded border-2 border-pw-writing px-1.5 text-xs font-bold uppercase tracking-[0.14em] text-pw-writing">
                          {t(task.kind === 'n400' ? 'stamp_filed' : 'stamp_done')}
                        </span>
                      )}
                    </span>
                    <span className={`block font-semibold leading-snug ${isDone ? 'text-pw-muted' : ''}`}>{taskLabel(task)}</span>
                  </Link>
                  {doneButton(task, 'self-center mr-1')}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* The week's rhythm and readiness; no countdown */}
      <div className="rounded-[14px] bg-white border border-pw-line p-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{t('this_week')}</Eyebrow>
          <div className="flex gap-1.5" aria-hidden="true">
            {squares.map((sq, k) => (
              <span key={k} className={`w-5 h-5 rounded-[4px] ${sq.filled ? 'bg-pw-navy' : 'bg-pw-line'} ${sq.today ? 'ring-2 ring-offset-1 ring-pw-muted' : ''}`} />
            ))}
          </div>
        </div>
        <p className="font-semibold">{t(daysKey, { n: daysCount })}</p>
        {data.civicsTotal > 0 && <p className="text-pw-muted">{t('ready', { n: data.ready, t: data.civicsTotal })}</p>}
        {weeks !== null && <p className="text-sm text-pw-muted">{t(weeksKey, { n: weeks })}</p>}
      </div>
    </section>
  );
}
