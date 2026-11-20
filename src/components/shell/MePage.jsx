import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, LogIn, SlidersHorizontal } from 'lucide-react';
import { profile as profileApi } from '@/api/profile';
import { auth } from '@/api/auth';
import { Amio } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { ME_LINKS, SETTINGS_PATH } from '@/lib/shellRoutes';
import { pathView, topicBlocks } from '@/lib/meView';
import { useJourney } from '@/components/course/courseShared';
import useReadinessData from '@/components/shell/useReadinessData';

// Me (/me, Amio v2 frame Me). On navy: "{name}, you know", the number of
// civics questions mastered (user_progress, via useReadinessData()) "of 128
// civics questions", the settings button, and the path from 0 to 128 with
// milestones (10 · 25 · 50 · 75 · 100 · 128) and Amio where the learner is.
// Below: one block per topic (unit) that fills with color as its questions
// are mastered (topicBlocks()), then Ask Amio, Free help near you and
// Progress. Everything else (My tutor, history, notifications, partner,
// admin, sign out) is in Settings. No stars, no badges. Reads only.
import { ME_LINES as LINES } from './shellStrings';

function LinkRow({ to, children }) {
  return (
    <Link to={to} className="w-full min-h-[3.25rem] flex items-center gap-3 px-4 py-2 text-start text-base font-semibold text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
      <span className="flex-1 min-w-0">{children}</span>
      <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
    </Link>
  );
}

function Path({ view, t }) {
  return (
    <div className="pt-12">
      <div role="img" aria-label={t('path_label', { n: view.n, total: view.total })} className="relative h-6 mx-3">
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-navy-line" />
        <span className="absolute start-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gold" style={{ width: `${view.pct}%` }} />
        {view.marks.map((m) => (
          <span
            key={m.at}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2 w-4 h-4 rounded-full border-2 ${m.reached ? 'bg-gold border-gold' : m.at === view.next ? 'bg-navy border-sky' : 'bg-navy border-navy-line'}`}
            style={{ insetInlineStart: `${m.pct}%` }}
          />
        ))}
        <span className="absolute bottom-full mb-1 -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${view.pct}%` }}>
          <Amio mood="hello" size={36} onNavy />
        </span>
      </div>
      <div className="relative h-5 mx-3 mt-1" aria-hidden="true">
        {view.marks.map((m) => (
          <span key={m.at} className={`absolute -translate-x-1/2 rtl:translate-x-1/2 text-small tabular-nums ${m.at === view.next ? 'font-bold text-white' : 'text-on-navy'}`} style={{ insetInlineStart: `${m.pct}%` }}>{m.at}</span>
        ))}
      </div>
    </div>
  );
}

function TopicBlock({ block, t, wide }) {
  const sr = t('topic_sr', { title: block.title, done: block.done, total: block.total });
  if (block.complete) {
    return (
      <li className={`rounded-card bg-navy text-white px-4 py-4 flex items-center gap-3 ${wide ? 'col-span-2' : ''}`}>
        <span className="flex-1 min-w-0 text-base font-bold break-words" dir="auto">{block.title}</span>
        <Check className="w-6 h-6 shrink-0 text-gold" strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">{sr}</span>
      </li>
    );
  }
  return (
    <li className={`relative overflow-hidden rounded-card bg-line-soft text-navy min-h-[6rem] px-4 py-3 flex flex-col justify-between ${wide ? 'col-span-2' : ''}`}>
      <span className={`absolute inset-x-0 bottom-0 ${block.fill === 'gold' ? 'bg-gold' : 'bg-sky'}`} style={{ height: `${block.pct}%` }} aria-hidden="true" />
      <span className="relative text-base font-bold break-words" dir="auto">{block.title}</span>
      <span className="relative font-display text-[1.75rem] leading-none tabular-nums" aria-hidden="true">{block.pct}%</span>
      <span className="sr-only">{sr}</span>
    </li>
  );
}

export default function MePage() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'me_v2' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const [user, setUser] = useState(undefined);
  const [name, setName] = useState('');
  const journey = useJourney();
  const readiness = useReadinessData();

  useEffect(() => {
    let active = true;
    (async () => {
      let u;
      try { u = await auth.me(); } catch { if (active) setUser(null); return; }
      if (!active) return;
      setUser(u);
      const publicProfile = await profileApi.getPublic().catch(() => null);
      if (active) setName((publicProfile?.display_name || u?.full_name || '').split(' ')[0]);
    })();
    return () => { active = false; };
  }, []);

  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const settingsButton = (
    <Link to={SETTINGS_PATH} aria-label={t('settings')} className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
      <SlidersHorizontal className="w-6 h-6" aria-hidden="true" />
    </Link>
  );

  if (user === null) {
    return (
      <div dir={dir} className="min-h-full bg-paper text-navy">
        <section className="bg-navy text-white">
          <div className="max-w-lg mx-auto px-4 pt-6 pb-6 flex items-start justify-between gap-3">
            <h1 className="font-display text-[2rem] leading-tight">{t('welcome')}</h1>
            {settingsButton}
          </div>
        </section>
        <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">
          <section className="rounded-card bg-white border-[1.5px] border-line p-5 flex flex-col gap-4">
            <p className="text-base">{t('sign_in_body')}</p>
            <Button variant="main" className="w-full" onClick={() => auth.goToSignIn()}>
              <LogIn className="w-5 h-5" aria-hidden="true" /> {t('sign_in')}
            </Button>
          </section>
          <nav aria-label={t('more')} className="rounded-card bg-white border-[1.5px] border-line overflow-hidden">
            <LinkRow to="/resources">{t('link_help')}</LinkRow>
          </nav>
        </div>
      </div>
    );
  }

  const total = readiness?.civicsTotal || 128;
  const view = pathView(readiness?.civicsMastered || 0, total);
  const blocks = journey.loading ? [] : topicBlocks(journey.course, readiness?.masteredIds || new Set());

  return (
    <div dir={dir} className="min-h-full bg-paper text-navy">
      <section className="bg-navy text-white" aria-labelledby="me-title">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 id="me-title" className="min-w-0">
              <span className="block text-lg text-on-navy break-words" dir="auto">{name ? t('you_know_name', { name }) : t('you_know')}</span>
              <span className="mt-2 flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-[4.5rem] leading-none tabular-nums">{readiness ? view.n : ' '}</span>
                <span className="font-sans text-lg font-semibold">{t('of_civics', { total })}</span>
              </span>
            </h1>
            {settingsButton}
          </div>
          {readiness && <Path view={view} t={t} />}
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        {blocks.length > 0 && (
          <section aria-label={t('topics')}>
            <ul className="grid grid-cols-2 gap-2 list-none m-0 p-0">
              {blocks.map((b, i) => <TopicBlock key={b.id} block={b} t={t} wide={i === 0 || (i === blocks.length - 1 && blocks.length % 2 === 0)} />)}
            </ul>
          </section>
        )}

        <nav aria-label={t('more')} className="rounded-card bg-white border-[1.5px] border-line overflow-hidden divide-y divide-line">
          {ME_LINKS.map((l) => <LinkRow key={l.id} to={l.path}>{t(`link_${l.id}`)}</LinkRow>)}
        </nav>
      </div>
    </div>
  );
}
