import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Loader2, LogIn, LogOut } from 'lucide-react';
import { interviewSessions as interviewSessionsApi } from '@/api/interview';
import { progress as progressApi } from '@/api/progress';
import { content } from '@/api/content';
import { profile as profileApi } from '@/api/profile';
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
import { staffPrograms } from '@/lib/partners';
import { ME_LINKS, ME_MORE_LINKS } from '@/lib/shellRoutes';
import { streak } from '@/lib/streak';
import { badgeShelf } from '@/lib/checkpoints';
import { useJourney } from '@/components/course/courseShared';

// Me (frame R30Me; Prompt 11): who you are, three numbers from what the app
// already saves (days in a row = the kind streak, civics answers mastered,
// best practice interview), the course badge shelf, "My tutor" (a partner
// program, joined with a code), and links to Ask Amio, Free help near you and
// Settings, then the pages that used to be in the profile menu. No new saved
// data.
import { ME_LINES as LINES } from './shellStrings';

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
  const journey = useJourney();

  useEffect(() => {
    let active = true;
    (async () => {
      let u;
      try { u = await auth.me(); } catch (e) { if (active) setUser(null); return; }
      if (!active) return;
      setUser(u);
      const [publicProfile, progress, sessions, activeDays, civics2025] = await Promise.all([
        profileApi.getPublic().catch(() => null),
        progressApi.list({ sort: '-last_practiced', limit: 500 }).catch(() => []),
        interviewSessionsApi.list({ sort: '-created_date', limit: 50 }).catch(() => []),
        profileApi.activeDays().catch(() => []),
        content.civicsQuestions({ version: '2025', limit: 300 }).catch(() => []),
      ]);
      if (!active) return;
      setName(publicProfile?.display_name || u.full_name || '');
      const civicsIds = new Set(civics2025.map((q) => q.id));
      const best = sessions
        .filter((s) => Number(s.question_count) > 0)
        .sort((a, b) => (b.passed_count / b.question_count) - (a.passed_count / a.question_count) || b.passed_count - a.passed_count)[0];
      setStats({
        days: streak(activeDays, new Date()).days,
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
          <Stat value={stats ? stats.days : '–'} label={stats?.days === 1 ? t('day_in_a_row') : t('days_in_a_row')} />
          <Stat value={stats ? stats.ready : '–'} label={t('civics_ready')} />
          <Stat value={stats?.best || '–'} label={stats && !stats.best ? t('none_yet') : t('best_interview')} />
        </div>

        <Card>
          <Eyebrow>{t('badges')}</Eyebrow>
          <p className="mt-1 text-small text-muted">{t('badges_help')}</p>
          {!journey.loading && <BadgeShelf badges={badgeShelf(journey.stops, journey.course)} t={t} className="mt-3" />}
        </Card>

        <div id="program" className="scroll-mt-20">
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
