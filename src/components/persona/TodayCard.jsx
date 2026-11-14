import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { auth } from '@/api/auth';
import { ListenButton } from './TutorMessage';
import PlanSetup from './PlanSetup';
import useTutorProfile from './useTutorProfile';
import useTodayText from './useTodayText';
import useTextSize from './useTextSize';
import { partName } from './SkillLevels';
import TodayRoad from '@/components/home/TodayRoad';
import { ROADMAP_STOPS } from '@/components/home/roadmapStops';
import { Button, Card, CreamSheet, Eyebrow, NavyTop } from '@/components/pathways/ui';
import { LEVELS } from '@/lib/pretest';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import { tasksForDay, extraTasks, totalMinutes } from '@/lib/studyPlan';
import { loadPlanSettings, loadDone, saveDone, touchVisit, ymd } from '@/lib/planSettings';
import { recentResults, adjustedLevels, lowSkills, checkIns } from '@/lib/checkIns';
import { firstName, roadStates, splitTasks, timeOfDay } from '@/lib/todayView';

const SECTION_IDS = N400_SECTIONS.map((s) => s.id);
const SECTION_TITLE = Object.fromEntries(N400_SECTIONS.map((s) => [s.id, s.title]));
const DISMISS_KEY = 'pathways_checkins_dismissed'; // { date, ids }

// The four parts in Practice order, and how much of the bar each quick-check
// level fills.
const FOUR_PARTS = ['reading', 'writing', 'civics', 'speaking'];
const LEVEL_STEPS = { start_here: 1, getting_there: 2, strong: 3 };

// Which part a task practices (for its "Next · …" label).
const taskSkill = (kind) => (kind.startsWith('civics') ? 'civics' : kind);

// A learner's first day (no quick check results and no plan yet): the quick
// check is the one task.
const QUICK_CHECK_TASK = { id: 'quick-check', kind: 'quick-check', href: '/quick-check', minutes: 10 };

function loadDismissed(today) {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || 'null');
    return v && v.date === ymd(today) ? v.ids : [];
  } catch (e) { return []; }
}
function saveDismissed(today, ids) {
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify({ date: ymd(today), ids })); } catch (e) { /* ignore */ }
}

// Today (The Road): a navy top that says where the learner is (the stop, the
// greeting, Amio's line, the road) and a cream sheet with what to do: the next
// task of today's plan, the rest of today's tasks, one check-in from Amio, the
// interview month (device only) and the four parts. The greeting is the Home
// page's h1. `roadmap` is useRoadmapProgress(); `stopName(id)` the stop's
// name in the learner's language; `sheetTop` goes first on the sheet (the
// pilot check-in card).
export default function TodayCard({ language = 'en', roadmap, stopName, sheetTop = null }) {
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
  const { className: sizeClass } = useTextSize();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await auth.me();
        const email = user.email.toLowerCase().trim();
        const [progress, sessions, n400] = await Promise.all([
          base44.entities.UserProgress.filter({ user_email: email }, '-last_practiced', 500).catch(() => []),
          base44.entities.InterviewSession.filter({ user_email: email }, '-created_date', 50).catch(() => []),
          base44.entities.N400SectionProgress.filter({ user_email: email }, null, 50).catch(() => []),
        ]);
        if (!active) return;
        setData({
          name: firstName(user),
          levels: user.skill_levels || null,
          progress,
          sessions,
          completedSections: n400.filter((s) => s.completed).map((s) => s.section_id),
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
    if (!data.levels && !plan) return [QUICK_CHECK_TASK];
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
    return (
      <NavyTop className="min-h-[320px] grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-white" aria-label="Loading" />
      </NavyTop>
    );
  }
  if (data.signedOut) return null;
  const firstDay = !data.levels && !plan;

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
  const hello = data.name ? t(`hello_${tod}`, { name: data.name }) : t('welcome');
  const lineKey = firstDay ? 'first_line' : allDone ? 'done' : `${profile.tone}_tasks`;
  const lineMine = mine(lineKey, { n, m, name: profile.name });
  const lineEn = en(lineKey, { n, m, name: profile.name });
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  // The road: the app's roadmap rule (useRoadmapProgress), stop 1 on day one.
  const ids = ROADMAP_STOPS.map((s) => s.id);
  const states = roadStates(ids, roadmap?.done || {}, roadmap?.currentStop?.id, firstDay);
  const currentIndex = Math.max(0, states.indexOf('current'));
  const stops = ROADMAP_STOPS.map((stop, i) => {
    const name = stopName(stop.id);
    const extraWord = states[i] === 'done' ? `, ${t('stop_done')}` : states[i] === 'current' ? `, ${t('you_are_here')}` : '';
    return { id: stop.id, href: stop.href, name, state: states[i], label: `${t('stop_of', { n: stop.id, name })}${extraWord}` };
  });
  const kicker = firstDay ? t('start_here') : t('stop_of', { n: currentIndex + 1, name: stops[currentIndex].name });

  // One check-in at a time, most important first.
  const note = checkIns({
    missedDays,
    levels,
    checkedAt: data.levels?.checked_at,
    recent,
    planStart: plan?.start,
    englishMix: profile.english_mix,
    language,
    today,
    dismissed,
  })[0];
  const noteText = (x) => {
    if (x.kind === 'welcome-back') return t('welcome_back');
    if (x.kind === 'low-skill') return t('low_skill', { skills: x.skills.map((s) => partName(s, language)).join(', ') });
    if (x.kind === 'recheck') return t('recheck', { skill: partName(x.skill, language) });
    if (x.kind === 'english-mix') return t('mix');
    return '';
  };
  const moreEnglish = async (next, id) => {
    try {
      await saveProfile({ ...profile, english_mix: next });
      toast.success(t('mix_btn'));
    } catch (e) { /* keep the note */ }
    dismiss(id);
  };

  const { top, rest } = splitTasks(tasks, done);
  const skillName = (task) => {
    if (task.kind === 'quick-check') return t('quick_check_name');
    return taskSkill(task.kind) === 'n400' ? 'N-400' : partName(taskSkill(task.kind), language);
  };
  const taskLabel = (task) => {
    if (task.kind === 'quick-check') return t('task_quick_check');
    if (task.kind === 'n400') return t('task_n400', { section: SECTION_TITLE[task.section] || '' });
    return t(`task_${task.kind.replace('-', '_')}`);
  };

  const doneButton = (task) => {
    const isDone = done.includes(task.id);
    return (
      <button
        type="button"
        onClick={() => toggle(task.id)}
        aria-pressed={isDone}
        aria-label={`${isDone ? t('mark_not_done') : t('mark_done')}: ${taskLabel(task)}`}
        className="w-11 h-11 shrink-0 grid place-items-center rounded-full hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      >
        <span className={`w-7 h-7 rounded-full border-2 grid place-items-center ${isDone ? 'bg-navy border-navy' : 'border-ink-2'}`}>
          {isDone && <Check className="w-4 h-4 text-white" strokeWidth={3} aria-hidden="true" />}
        </span>
      </button>
    );
  };

  const locale = language === 'en' ? 'en-US' : language;
  let interviewMonth = '';
  if (plan?.mode === 'date' && plan.target) {
    try { interviewMonth = plan.target.toLocaleDateString(locale, { month: 'long', year: 'numeric' }); } catch (e) { interviewMonth = ''; }
  }

  return (
    <>
      {/* NAVY TOP: where you are */}
      <NavyTop className="pb-14">
        <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <div className={`space-y-3 ${sizeClass}`}>
            <p className="text-label uppercase text-on-navy">{kicker}</p>
            <h1 id="today-title" className="font-display text-[30px] sm:text-[34px] leading-[1.1]">{hello}</h1>
            <div className="max-w-2xl space-y-1">
              {lineMine && <p dir={dir} className="text-lg font-medium leading-snug">{lineMine}</p>}
              <p className={`leading-snug ${lineMine ? 'text-base text-on-navy' : 'text-lg font-medium'}`}>{lineEn}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lineMine && <ListenButton onNavy text={lineMine} language={language} tutorName={profile.name} />}
              <ListenButton onNavy text={lineEn} language="en" label={lineMine ? 'English' : 'Listen'} tutorName={profile.name} />
            </div>
          </div>
          <div className="mt-6 lg:mt-0 mx-auto w-full max-w-md lg:max-w-none">
            <TodayRoad stops={stops} ariaLabel={t('road_label')} />
          </div>
        </div>
      </NavyTop>

      {/* CREAM SHEET: what to do */}
      <CreamSheet className="min-h-[50vh]">
        <div className="mx-auto max-w-5xl space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 lg:items-start">
          <div className="space-y-4">
            {sheetTop}

            {/* Next: the first task of today's plan not done yet */}
            <Card padding="p-5">
              {top ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Eyebrow>{t('next_of', { skill: skillName(top) })}</Eyebrow>
                      <h2 className="mt-2 font-display text-[22px] leading-tight text-ink">{taskLabel(top)}</h2>
                    </div>
                    {!firstDay && doneButton(top)}
                  </div>
                  <Link
                    to={top.href}
                    className="mt-4 w-full min-h-[52px] rounded-full bg-navy text-white hover:bg-navy-deep text-lg font-semibold inline-flex items-center justify-center gap-2 px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                  >
                    {firstDay ? t('start_quick_check') : t('start_min', { m: top.minutes })}
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                  {firstDay && <p className="mt-2 text-base text-ink-2 text-center">{t('quick_check_sub')} · {t('minutes', { m: top.minutes })}</p>}
                </>
              ) : (
                <>
                  <h2 className="font-display text-[22px] leading-tight text-ink">{t('all_done_title')}</h2>
                  <p className="mt-1 text-base text-ink-2">{t('done')}</p>
                  {!extra && <Button variant="second" className="mt-4 w-full" onClick={() => setExtra(true)}>{t('keep_going')}</Button>}
                </>
              )}
            </Card>

            {/* Also today: the rest of today's plan */}
            {rest.length > 0 && (
              <Card padding="p-0">
                <h2 className="px-5 pt-4 text-label uppercase text-ink-label">{t('also_today')}</h2>
                <ul className="divide-y divide-card-line">
                  {rest.map((task) => {
                    const isDone = done.includes(task.id);
                    return (
                      <li key={task.id} className="flex items-center gap-2 ps-5 pe-2">
                        <Link to={task.href} className="flex-1 min-w-0 py-3 min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy rounded">
                          <span className={`block text-base font-semibold ${isDone ? 'text-ink-2' : 'text-ink'}`}>{taskLabel(task)}</span>
                          <span className="block text-sm text-ink-2">
                            {skillName(task)} · {t('minutes', { m: task.minutes })}{isDone ? ` · ${t(task.kind === 'n400' ? 'stamp_filed' : 'stamp_done')}` : ''}
                          </span>
                        </Link>
                        {doneButton(task)}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {/* One check-in from Amio (welcome back, a part to practice more, a re-check, more English) */}
            {note && (
              <Card padding="p-5" aria-label={profile.name}>
                <p dir={dir} className="text-lg font-medium leading-snug text-ink">{noteText(note)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {note.kind === 'recheck' && (
                    <Link to={`/quick-check?part=${note.skill}`} className="min-h-tap rounded-full bg-navy text-white hover:bg-navy-deep px-5 inline-flex items-center text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
                      {t('recheck_btn')}
                    </Link>
                  )}
                  {note.kind === 'english-mix' && (
                    <Button variant="next" onClick={() => moreEnglish(note.next, note.id)}>{t('mix_btn')}</Button>
                  )}
                  <Button variant="link" onClick={() => dismiss(note.id)}>{t('not_now')}</Button>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {/* The interview month: on this device only */}
            <Card padding="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-base font-semibold text-ink">
                  {interviewMonth ? t('interview_month', { month: interviewMonth }) : t('interview_ask')}
                </p>
                <Button variant="second" onClick={() => setSettingDate((v) => !v)} aria-expanded={settingDate}>
                  {interviewMonth ? t('change') : t('pick_month')}
                </Button>
              </div>
              {settingDate && (
                <div className="mt-4">
                  <PlanSetup profile={profile} language={language} again bare onDone={(next) => { setPlan(next); setSettingDate(false); }} />
                </div>
              )}
            </Card>

            {/* The four parts: quick check levels, as a thin bar and in words */}
            <Card padding="p-5">
              <h2 className="text-label uppercase text-ink-label">{t('four_parts')}</h2>
              <ul className="mt-3 space-y-3">
                {FOUR_PARTS.map((part) => {
                  const level = levels[part];
                  const steps = LEVEL_STEPS[level] || 0;
                  const word = level ? (language === 'es' ? LEVELS[level].es : LEVELS[level].label) : t('not_checked');
                  return (
                    <li key={part}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-base font-semibold text-ink">{partName(part, language)}</span>
                        <span className="text-sm text-ink-2">{word}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-sand overflow-hidden" aria-hidden="true">
                        <div className="h-full rounded-full bg-navy" style={{ width: `${(steps / 3) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>
      </CreamSheet>
    </>
  );
}
