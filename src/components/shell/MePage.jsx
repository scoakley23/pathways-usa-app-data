import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Loader2, LogIn, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button, Card, Eyebrow } from '@/components/pathways/ui';
import ProgramCard from '@/components/partners/ProgramCard';
import BadgeShelf from '@/components/shell/BadgeShelf';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { openNotifications } from '@/components/notifications/NotificationCenter';
import { loadPlanSettings } from '@/lib/planSettings';
import { practiceDaysThisWeek } from '@/lib/todayView';
import { staffPrograms } from '@/lib/partners';
import { ME_LINKS, ME_MORE_LINKS } from '@/lib/shellRoutes';

// Me (frame R30Me): who you are, three numbers from what the app already
// saves, the badge shelf, your program ("My tutor": a partner program), and
// links to Ask Amio, Free help near you and Settings, then the pages that
// used to be in the profile menu. No new saved data. Left out until their
// prompts: stars (Prompt 4) and the streak (Prompt 7); "days practiced this
// week" stands in for "days in a row".
const LINES = {
  welcome: 'Welcome',
  studying_in: 'Studying in {language}',
  interview_month: 'Interview month: {month}',
  days_week: 'days practiced this week',
  civics_ready: 'civics answers ready',
  best_interview: 'best practice interview',
  none_yet: 'none yet',
  badges: 'Your badges',
  more: 'More',
  sign_out: 'Sign out',
  sign_in: 'Sign in',
  sign_in_body: 'Sign in to see your progress, badges and settings.',
  ...Object.fromEntries([...ME_LINKS, ...ME_MORE_LINKS].map((l) => [`link_${l.id}`, l.label])),
};

const languageLabel = (code) => {
  const label = LANGUAGES.find((l) => l.value === code)?.label || 'English';
  return label.split(' (')[0];
};

function Stat({ value, label }) {
  return (
    <Card padding="p-3" className="text-center flex flex-col justify-center min-h-[96px]">
      <p className="text-[26px] font-bold leading-none text-navy tabular-nums">{value}</p>
      <p className="mt-1.5 text-small text-muted leading-tight">{label}</p>
    </Card>
  );
}

function LinkRow({ to, onClick, children }) {
  const look = 'w-full min-h-[52px] flex items-center gap-3 py-2 text-start text-base font-semibold text-navy hover:text-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded-lg';
  const inner = (
    <>
      <span className="flex-1 min-w-0">{children}</span>
      <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
    </>
  );
  return onClick
    ? <button type="button" onClick={onClick} className={look}>{inner}</button>
    : <Link to={to} className={look}>{inner}</Link>;
}

export default function MePage() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'me_v1' });
  const t = (key) => (language !== 'en' && tr(key)) || LINES[key];
  const { hash } = useLocation();
  const [user, setUser] = useState(undefined);
  const [name, setName] = useState('');
  const [stats, setStats] = useState(null);
  const [staff, setStaff] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let u;
      try { u = await auth.me(); } catch (e) { if (active) setUser(null); return; }
      if (!active) return;
      setUser(u);
      const email = u.email.toLowerCase().trim();
      const [profiles, progress, sessions, lessons, n400, civics2025] = await Promise.all([
        base44.entities.PublicProfile.filter({ user_email: email }).catch(() => []),
        base44.entities.UserProgress.filter({ user_email: email }, '-last_practiced', 500).catch(() => []),
        base44.entities.InterviewSession.filter({ user_email: email }, '-created_date', 50).catch(() => []),
        base44.entities.LessonProgress.filter({ user_email: email }, null, 200).catch(() => []),
        base44.entities.N400SectionProgress.filter({ user_email: email }, null, 50).catch(() => []),
        content.civicsQuestions({ version: '2025', limit: 300 }).catch(() => []),
      ]);
      if (!active) return;
      setName(profiles[0]?.display_name || u.full_name || '');
      const civicsIds = new Set(civics2025.map((q) => q.id));
      const dates = [
        ...progress.map((p) => p.last_practiced),
        ...sessions.map((s) => s.created_date),
        ...lessons.map((l) => l.last_attempt_date),
        ...n400.map((s) => s.completed_date),
      ];
      const best = sessions
        .filter((s) => Number(s.question_count) > 0)
        .sort((a, b) => (b.passed_count / b.question_count) - (a.passed_count / a.question_count) || b.passed_count - a.passed_count)[0];
      setStats({
        days: practiceDaysThisWeek(dates, new Date()).size,
        ready: progress.filter((p) => p.content_type === 'civics_question' && p.status === 'mastered' && civicsIds.has(p.content_id)).length,
        best: best ? `${best.passed_count || 0}/${best.question_count}` : null,
      });
      staffPrograms().then((list) => { if (active) setStaff(list.length > 0); }).catch(() => {});
    })();
    return () => { active = false; };
  }, []);

  // #program (from the old Profile address) scrolls to the program card.
  useEffect(() => {
    if (!stats || !hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
  }, [stats, hash]);

  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  if (user === undefined) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-navy" aria-label="Loading" /></div>;
  }

  if (user === null) {
    return (
      <div dir={dir}>
        <NavyBanner title="Me" />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <Card>
            <p className="text-base text-navy">{t('sign_in_body')}</p>
            <Button variant="main" className="w-full mt-4" onClick={() => auth.goToSignIn()}>
              <LogIn className="w-5 h-5" aria-hidden="true" /> {t('sign_in')}
            </Button>
          </Card>
          <Card padding="px-5 py-2">
            <LinkRow to="/resources">{t('link_help')}</LinkRow>
          </Card>
        </div>
      </div>
    );
  }

  const plan = loadPlanSettings();
  const month = plan?.target
    ? plan.target.toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'long', year: 'numeric' })
    : null;
  const subtitle = [
    t('studying_in').replace('{language}', languageLabel(language)),
    month ? t('interview_month').replace('{month}', month) : null,
  ].filter(Boolean).join(' · ');

  const more = ME_MORE_LINKS.filter((l) => !l.when || (l.when === 'staff' && staff) || (l.when === 'admin' && user.role === 'admin'));

  return (
    <div dir={dir}>
      <NavyBanner title={name || t('welcome')} subtitle={subtitle} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div className="grid grid-cols-3 gap-2.5">
          <Stat value={stats ? stats.days : '–'} label={t('days_week')} />
          <Stat value={stats ? stats.ready : '–'} label={t('civics_ready')} />
          <Stat value={stats?.best || '–'} label={stats && !stats.best ? t('none_yet') : t('best_interview')} />
        </div>

        <Card>
          <Eyebrow>{t('badges')}</Eyebrow>
          <BadgeShelf earned={user.badges || []} className="mt-3" />
        </Card>

        <div id="program" className="empty:hidden scroll-mt-20">
          <ProgramCard user={user} />
        </div>

        <Card padding="px-5 py-2">
          {ME_LINKS.map((l) => <LinkRow key={l.id} to={l.path}>{t(`link_${l.id}`)}</LinkRow>)}
        </Card>

        <Card padding="px-5 py-2">
          <Eyebrow className="pt-2">{t('more')}</Eyebrow>
          {more.map((l) => (
            l.action === 'notifications'
              ? <LinkRow key={l.id} onClick={openNotifications}>{t(`link_${l.id}`)}</LinkRow>
              : <LinkRow key={l.id} to={l.path}>{t(`link_${l.id}`)}</LinkRow>
          ))}
        </Card>

        <Button
          variant="second"
          className="w-full"
          onClick={async () => { await auth.signOut(); window.location.href = '/'; }}
        >
          <LogOut className="w-5 h-5" aria-hidden="true" /> {t('sign_out')}
        </Button>
      </div>
    </div>
  );
}
