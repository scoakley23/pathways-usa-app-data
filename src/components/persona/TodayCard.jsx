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
import { IndexCard, RaisedCard, SecondaryButton, SKILL_COLOR, SKILL_ON } from '@/components/pathways/ui';
import { LEVELS } from '@/lib/pretest';
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

// Vía's notes are handwritten (Caveat) when the text is in Latin script;
// other scripts keep Instrument Sans so they stay readable.
const handwritten = (text) => /^[\p{Script=Latin}\p{P}\p{N}\p{Zs}\p{S}]*$/u.test(text || '');

// The four parts in Practice order, and how many of three steps each
// quick-check level fills.
const FOUR_PARTS = ['reading', 'writing', 'civics', 'speaking'];
const LEVEL_STEPS = { start_here: 1, getting_there: 2, strong: 3 };

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
  const [settingDate, setSettingDate] = useState(false);
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
  const next = rest.filter((task) => !done.includes(task.id)).slice(0, 2);
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

  // The checkmark sits on a skill-colored surface: its ring follows the text
  // color (white or ink), and a done task gets a filled circle.
  const doneButton = (task, className = '') => {
    const isDone = done.includes(task.id);
    const onDark = SKILL_ON[taskSkill(task.kind)] === 'text-white';
    return (
      <button
        type="button"
        onClick={() => toggle(task.id)}
        aria-pressed={isDone}
        aria-label={isDone ? t('mark_not_done') : t('mark_done')}
        className={`min-w-[44px] min-h-[44px] shrink-0 grid place-items-center rounded-xl hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${className}`}
      >
        <span className={`w-7 h-7 rounded-full border-2 border-current grid place-items-center ${isDone ? 'bg-current' : ''}`}>
          {isDone && <Check className={`w-4 h-4 ${onDark ? 'text-pw-navy' : 'text-white'}`} strokeWidth={3} aria-hidden="true" />}
        </span>
      </button>
    );
  };

  // Mon..Sun initials in the learner's language, for the week squares.
  const locale = language === 'en' ? 'en-US' : language;
  const weekdayInitials = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(2024, 0, 1 + k); // Jan 1 2024 was a Monday
    try { return d.toLocaleDateString(locale, { weekday: 'narrow' }); } catch (e) { return ''; }
  });
  let weekday = '';
  try { weekday = today.toLocaleDateString(locale, { weekday: 'long' }); } catch (e) { /* ignore */ }

  // One note on the desk at a time, in Vía's handwriting: the date question
  // first (until the learner answers it), otherwise today's check-in.
  const note = !plan ? { id: 'plan', kind: 'plan' } : notes[0];
  const noteText = (n) => {
    if (n.kind === 'plan') return t('plan_ask_again');
    if (n.kind === 'welcome-back') return t('welcome_back');
    if (n.kind === 'low-skill') return t('low_skill', { skills: n.skills.map((s) => partName(s, language)).join(', ') });
    if (n.kind === 'recheck') return t('recheck', { skill: partName(n.skill, language) });
    if (n.kind === 'english-mix') return t('mix');
    return '';
  };
  const noteBtn = 'min-h-11 rounded-full px-4 text-[15px] font-semibold inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy';

  return (
    <section aria-labelledby="today-title" className="space-y-6 text-pw-navy">
      {/* Day and stage, greeting, and Vía's line signed in text (her mark is in the tab bar) */}
      <div className={`space-y-2 ${sizeClass}`}>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-pw-muted">
          {[weekday, stageLabel].filter(Boolean).join(' · ')}
        </p>
        <h1 id="today-title" className="font-display text-[44px] leading-[1.02] sm:text-[60px]">{hello}</h1>
        <div className="max-w-2xl">
          {lineMine && <p dir={dir} className="font-display italic text-[23px] sm:text-[26px] leading-snug">{lineMine}</p>}
          <p className={`font-display italic leading-snug ${lineMine ? 'mt-1 text-lg text-pw-muted' : 'text-[23px] sm:text-[26px]'}`}>
            {lineEn} <span className="whitespace-nowrap text-pw-muted">— {profile.name}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {lineMine && <ListenButton text={lineMine} language={language} tutorName={profile.name} />}
          <ListenButton text={lineEn} language="en" label={lineMine ? 'English' : 'Listen'} tutorName={profile.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* The desk: today's next task on top of the stack, the others peeking out */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[22px] bg-pw-slate px-4 pt-6 pb-5 sm:px-7 sm:pt-8 sm:pb-7 space-y-4">
            <div className="relative pb-4">
              {next[0] && <div aria-hidden="true" className={`absolute left-2 right-2 bottom-2 h-12 rounded-[16px] ${SKILL_COLOR[taskSkill(next[0].kind)]}`} />}
              {next[1] && <div aria-hidden="true" className={`absolute left-4 right-4 bottom-0 h-12 rounded-[16px] ${SKILL_COLOR[taskSkill(next[1].kind)]}`} />}
              {top ? (
                <div className={`relative flex min-h-[250px] flex-col rounded-[18px] p-5 sm:p-7 shadow-[0_12px_26px_rgba(20,38,74,0.22)] ${SKILL_COLOR[taskSkill(top.kind)]} ${SKILL_ON[taskSkill(top.kind)]}`}>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em]">
                    {skillName(top)} · {t('task_of', { n: tasks.indexOf(top) + 1, t: n })}
                  </p>
                  <h2 className="mt-3 text-[34px] sm:text-[42px] font-bold leading-[1.05] tracking-[-0.01em]">{taskLabel(top)}</h2>
                  <p className="mt-2 font-display italic text-[21px]">{t('minutes', { m: top.minutes })}</p>
                  <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                    <Link
                      to={top.href}
                      className={`min-h-[52px] rounded-full font-semibold text-lg inline-flex items-center gap-2 px-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${SKILL_ON[taskSkill(top.kind)] === 'text-white' ? 'bg-white text-pw-navy hover:bg-pw-soft' : 'bg-pw-navy text-white hover:bg-pw-navy-deep'}`}
                    >
                      {t('start')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                    {doneButton(top)}
                  </div>
                </div>
              ) : (
                <IndexCard className="relative" padding="p-5 sm:p-7">
                  <h2 className="font-display text-[34px] leading-tight">{t('all_done_title')}</h2>
                  <p className="mt-1 text-base text-pw-muted">{t('done')}</p>
                  {!extra && <SecondaryButton className="mt-4 w-full" onClick={() => setExtra(true)}>{t('keep_going')}</SecondaryButton>}
                </IndexCard>
              )}
            </div>

            {note && (
              <aside
                aria-label={profile.name}
                className="ms-auto max-w-[300px] -rotate-[1.5deg] rounded-[4px] bg-white px-4 pt-3 pb-3 shadow-[0_6px_14px_rgba(20,38,74,0.14)] space-y-2"
              >
                <p dir={dir} className={`text-pw-navy ${handwritten(noteText(note)) ? 'font-hand font-semibold text-[23px] leading-tight' : 'text-base leading-relaxed'}`}>
                  {noteText(note)}
                </p>
                <p className="font-hand font-semibold text-[21px] leading-none text-pw-muted">— {profile.name}</p>
                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  {note.kind === 'plan' && (
                    <button type="button" onClick={() => setSettingDate((v) => !v)} aria-expanded={settingDate} className={`${noteBtn} bg-pw-soft text-pw-navy hover:bg-pw-soft-hover`}>
                      {t('pick_month')}
                    </button>
                  )}
                  {note.kind === 'recheck' && (
                    <Link to={`/quick-check?part=${note.skill}`} className={`${noteBtn} bg-pw-navy text-white hover:bg-pw-navy-deep`}>{t('recheck_btn')}</Link>
                  )}
                  {note.kind === 'english-mix' && (
                    <button type="button" onClick={() => moreEnglish(note.next, note.id)} className={`${noteBtn} bg-pw-navy text-white hover:bg-pw-navy-deep`}>{t('mix_btn')}</button>
                  )}
                  {note.kind !== 'plan' && (
                    <button type="button" onClick={() => dismiss(note.id)} className={`${noteBtn} text-pw-navy hover:bg-pw-soft`}>{t('not_now')}</button>
                  )}
                </div>
              </aside>
            )}
          </div>

          {!plan && settingDate && (
            <PlanSetup profile={profile} language={language} again bare onDone={setPlan} />
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Also today: the other tasks, finished ones stamped */}
          {rest.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-[28px] sm:text-[30px] leading-tight">{t('also_today')}</h2>
              <ul className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                {rest.map((task) => {
                  const isDone = done.includes(task.id);
                  return (
                    <li key={task.id} className={`relative flex rounded-[16px] overflow-hidden ${SKILL_COLOR[taskSkill(task.kind)]} ${SKILL_ON[taskSkill(task.kind)]}`}>
                      <Link
                        to={task.href}
                        className="flex-1 min-w-0 flex flex-col justify-between gap-3 ps-3.5 pe-1 pt-3.5 pb-4 min-h-[140px] lg:min-h-[96px] hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current"
                      >
                        <span className="block text-[13px] font-semibold uppercase tracking-[0.12em]">
                          {skillName(task)} · {t('minutes', { m: task.minutes })}
                        </span>
                        <span className="block text-[19px] font-bold leading-tight">{taskLabel(task)}</span>
                      </Link>
                      {doneButton(task, 'mt-1.5 me-1')}
                      {isDone && (
                        <span className="pointer-events-none absolute end-3 bottom-3 -rotate-[8deg] rounded-md border-2 border-current px-2 py-0.5 text-sm font-bold uppercase tracking-[0.12em]">
                          {t(task.kind === 'n400' ? 'stamp_filed' : 'stamp_done')}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* The four parts (quick check levels, in words too), the week's
              rhythm and readiness; no countdown */}
          <div className="rounded-[14px] bg-white border border-pw-line p-4 sm:p-5 space-y-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-pw-muted">{t('four_parts')}</h2>
            <ul className="space-y-2.5">
              {FOUR_PARTS.map((part) => {
                const level = levels[part];
                const steps = LEVEL_STEPS[level] || 0;
                const word = level ? (language === 'es' ? LEVELS[level].es : LEVELS[level].label) : t('not_checked');
                return (
                  <li key={part} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
                    <span className="text-base font-semibold">{partName(part, language)}</span>
                    <span className="flex items-center gap-3">
                      <span className="grid flex-1 grid-cols-3 gap-1" aria-hidden="true">
                        {[1, 2, 3].map((k) => (
                          <span key={k} className={`h-3 rounded ${k <= steps ? SKILL_COLOR[part] : 'bg-pw-soft'}`} />
                        ))}
                      </span>
                      <span className="w-[104px] shrink-0 text-[15px] text-pw-muted">{word}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <h2 className="border-t border-pw-line pt-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-pw-muted">{t('this_week')}</h2>
            <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
              {squares.map((sq, k) => (
                <div key={k} className="flex flex-col items-center gap-1">
                  <span className={`block w-full aspect-square max-h-9 rounded-md ${sq.filled ? 'bg-pw-navy' : sq.today ? 'bg-white border-2 border-pw-navy' : 'bg-pw-soft'}`} />
                  <span className="text-[13px] text-pw-muted">{weekdayInitials[k]}</span>
                </div>
              ))}
            </div>
            <p className="text-base font-semibold">{t(daysKey, { n: daysCount })}</p>
            {data.civicsTotal > 0 && (
              <p className="border-t border-pw-line pt-3 font-display text-[22px] leading-snug">{t('ready', { n: data.ready, t: data.civicsTotal })}</p>
            )}
            {weeks !== null && <p className="text-[15px] text-pw-muted">{t(weeksKey, { n: weeks })}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
