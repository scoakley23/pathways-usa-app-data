import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import TutorMessage from './TutorMessage';
import TutorIntro from './TutorIntro';
import PlanSetup from './PlanSetup';
import useTutorProfile from './useTutorProfile';
import useTodayText from './useTodayText';
import { partName } from './SkillLevels';
import { PrimaryButton, QuietButton, RaisedCard, SecondaryButton, SkillDot, Tag } from '@/components/pathways/ui';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import { tasksForDay, extraTasks, totalMinutes, dayIndex } from '@/lib/studyPlan';
import { loadPlanSettings, loadDone, saveDone, touchVisit, ymd } from '@/lib/planSettings';
import { recentResults, adjustedLevels, lowSkills, checkIns } from '@/lib/checkIns';

const SECTION_IDS = N400_SECTIONS.map((s) => s.id);
const SECTION_TITLE = Object.fromEntries(N400_SECTIONS.map((s) => [s.id, s.title]));
const DISMISS_KEY = 'pathways_checkins_dismissed'; // { date, ids }

// Which interview skill a task practices (for its color).
const taskSkill = (kind) => (kind.startsWith('civics') ? 'civics' : kind);

const timeOfDay = (d) => (d.getHours() < 12 ? 'morning' : d.getHours() < 18 ? 'afternoon' : 'evening');

function loadDismissed(today) {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || 'null');
    return v && v.date === ymd(today) ? v.ids : [];
  } catch (e) { return []; }
}
function saveDismissed(today, ids) {
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify({ date: ymd(today), ids })); } catch (e) { /* ignore */ }
}

// Practice days this week (Monday–Sunday) from saved progress and today's
// checkmarks on this device.
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
  return days.size;
}

// The "Today" card (Prompt 6) with check-ins (Prompt 8). Learners without
// a plan or quick check results meet their tutor and start the quick check.
// The title is the Home page's h1.
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
  const greetKey = `greet_${timeOfDay(today)}`;
  const tasksKey = `${profile.tone}_tasks`;
  const withGreeting = profile.tone !== 'direct';
  const greetingMine = mine(tasksKey, { n, m }) && (withGreeting ? `${mine(greetKey)} ${mine(tasksKey, { n, m })}` : mine(tasksKey, { n, m }));
  const greetingEn = withGreeting ? `${en(greetKey)} ${en(tasksKey, { n, m })}` : en(tasksKey, { n, m });

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

  const daysCount = practiceDaysThisWeek(data.activityDates, today);
  const daysKey = daysCount === 0 ? 'days_week_none' : daysCount === 1 ? 'days_week_one' : 'days_week';

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

  return (
    <section aria-labelledby="today-title" className="space-y-4 text-pw-navy">
      <div className="flex items-center justify-between gap-3">
        <h1 id="today-title" className="text-[32px] leading-tight font-extrabold tracking-[-0.5px]">{t('title')}</h1>
        <Tag tone="teal">{t('minutes', { m })}</Tag>
      </div>

      {!plan && (
        <PlanSetup profile={profile} language={language} again onDone={setPlan} />
      )}

      <TutorMessage
        profile={profile}
        language={language}
        mine={allDone ? mine('done') : greetingMine}
        en={allDone ? en('done') : greetingEn}
      />

      {notes.map((note) => (
        <RaisedCard key={note.id} className="space-y-3 border-l-4 border-l-pw-red">
          {note.kind === 'welcome-back' && <p className="text-base">{t('welcome_back')}</p>}
          {note.kind === 'low-skill' && <p className="text-base">{t('low_skill', { skills: note.skills.map((s) => partName(s, language)).join(', ') })}</p>}
          {note.kind === 'recheck' && (
            <>
              <p className="text-base">{t('recheck', { skill: partName(note.skill, language) })}</p>
              <Link to={`/quick-check?part=${note.skill}`} className="min-h-11 w-full rounded-2xl bg-pw-navy text-white font-bold inline-flex items-center justify-center px-4">{t('recheck_btn')}</Link>
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

      <ul className="space-y-2">
        {tasks.map((task) => {
          const isDone = done.includes(task.id);
          return (
            <li key={task.id} className={`flex items-stretch rounded-2xl border-2 bg-white overflow-hidden ${isDone ? 'border-pw-green-ink/40' : 'border-pw-line'}`}>
              <button
                type="button"
                onClick={() => toggle(task.id)}
                aria-pressed={isDone}
                aria-label={isDone ? t('mark_not_done') : t('mark_done')}
                className="w-14 shrink-0 grid place-items-center hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pw-red"
              >
                <span className={`w-7 h-7 rounded-full border-2 grid place-items-center ${isDone ? 'bg-pw-green-ink border-pw-green-ink' : 'border-pw-line bg-white'}`}>
                  {isDone && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </span>
              </button>
              <Link
                to={task.href}
                className="flex-1 min-w-0 flex items-center gap-2 py-3 pr-3 min-h-[56px] hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pw-red"
              >
                <span className="flex-1 min-w-0">
                  <span className={`block font-bold leading-snug ${isDone ? 'text-pw-muted line-through decoration-pw-muted/50' : ''}`}>{taskLabel(task)}</span>
                  <span className="flex items-center gap-2 text-sm text-pw-muted">
                    <SkillDot skill={taskSkill(task.kind)} />
                    {taskSkill(task.kind) === 'n400' ? 'N-400' : partName(taskSkill(task.kind), language)} · {t('minutes', { m: task.minutes })}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-pw-muted shrink-0" aria-label={t('open')} />
              </Link>
            </li>
          );
        })}
      </ul>

      {allDone && !extra && (
        <SecondaryButton className="w-full" onClick={() => setExtra(true)}>{t('keep_going')}</SecondaryButton>
      )}

      <div className="rounded-2xl bg-pw-soft p-4 space-y-1">
        <p className="font-bold">{t(daysKey, { n: daysCount })}</p>
        {data.civicsTotal > 0 && <p className="text-pw-muted">{t('ready', { n: data.ready, t: data.civicsTotal })}</p>}
      </div>
    </section>
  );
}
