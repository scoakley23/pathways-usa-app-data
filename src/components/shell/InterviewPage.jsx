import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import useReadinessData from '@/components/shell/useReadinessData';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button, Card } from '@/components/pathways/ui';
import InterviewRoom from '@/components/interview/InterviewRoom';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { loadPlanSettings } from '@/lib/planSettings';
import { INTERVIEW_LINKS } from '@/lib/shellRoutes';
import { lastScores, readinessTiles } from '@/lib/interviewReadiness';
import N400LessonsCard from '@/components/n400lesson/N400LessonsCard';

// The Interview tab (/interview, frame R30Interview): "Are you ready?" with
// four tiles from what the app already saves (quick-check levels, mastered
// civics questions, practice interview scores), the interview room, the last
// 4 practice scores, "Start practice interview", and links to the day guide,
// the N-400 guide and the next N-400 lesson, then the N-400 lessons. Reads
// only; saves nothing.
import { INTERVIEW_LINES as LINES } from './shellStrings';

const PRACTICE_QUESTIONS = 12; // 2 small talk + 3 about you + 4 "Have you ever…" + 3 swearing in (InterviewPractice)

function Tile({ tile, t }) {
  let body;
  if (tile.ready) {
    body = (
      <p className="text-[1.375rem] font-bold text-correct flex items-center gap-1.5">
        {t('ready')} <Check className="w-6 h-6" strokeWidth={3} aria-hidden="true" />
      </p>
    );
  } else if (tile.kind === 'level') {
    body = <p className="text-lg font-bold text-navy">{tile.level ? t(`level_${tile.level}`) : t('not_checked')}</p>;
  } else if (tile.kind === 'percent') {
    body = tile.value === null
      ? <p className="text-lg font-bold text-navy">{t('no_interview_yet')}</p>
      : <p className="text-[1.375rem] font-bold text-navy tabular-nums">{tile.value}%</p>;
  } else {
    body = <p className="text-[1.375rem] font-bold text-navy tabular-nums">{t('of').replace('{n}', tile.value).replace('{total}', tile.total)}</p>;
  }
  const bar = !tile.ready && (tile.kind === 'percent' ? tile.value : tile.kind === 'count' ? Math.round((tile.value / (tile.total || 1)) * 100) : null);
  return (
    <Card padding="p-4" className="min-h-[96px] flex flex-col justify-center">
      <p className="text-base text-muted">{t(tile.id)}</p>
      <div className="mt-1">{body}</div>
      {typeof bar === 'number' && (
        <div className="mt-3 h-2 rounded-full bg-tint overflow-hidden" aria-hidden="true">
          <div className="h-full rounded-full bg-denim" style={{ width: `${Math.max(0, Math.min(100, bar))}%` }} />
        </div>
      )}
    </Card>
  );
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'interview_tab_v2' });
  const t = (key) => (language !== 'en' && tr(key)) || LINES[key];
  const data = useReadinessData();

  const { tiles, readyCount } = readinessTiles(data || {});
  const plan = loadPlanSettings();
  const month = plan?.target ? plan.target.toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'long' }) : null;
  const subtitle = [t('ready_in').replace('{n}', readyCount), month ? t('interview_month').replace('{month}', month) : null].filter(Boolean).join(' · ');
  const last = lastScores(data?.sessions || []);
  const mock = INTERVIEW_LINKS.find((l) => l.id === 'mock');

  return (
    <div dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'}>
      <NavyBanner title={t('title')} subtitle={data ? subtitle : ' '} />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => <Tile key={tile.id} tile={tile} t={t} />)}
        </div>

        <Card padding="p-0" className="overflow-hidden">
          <InterviewRoom />
          <div className="p-5">
            <h2 className="text-title font-bold text-navy">{t('practice_title')}</h2>
            <p className="mt-1 text-base text-muted">{t('practice_body').replace('{n}', PRACTICE_QUESTIONS)}</p>
            {last.length > 0 && (
              <p className="mt-2 text-base text-navy">
                <span className="font-bold">{t('last').replace('{n}', last.length)}</span>{' '}
                {last.map((s, i) => (
                  <span key={i} className={i === last.length - 1 ? 'font-bold' : 'text-muted'}>
                    {i > 0 && ' · '}
                    {i === last.length - 1 ? t('of').replace('{n}', s.passed).replace('{total}', s.total) : s.passed}
                  </span>
                ))}
              </p>
            )}
          </div>
        </Card>

        <Button variant="main" className="w-full" onClick={() => navigate(mock.path)}>{t('start')}</Button>

        <div className="flex flex-wrap gap-2">
          {INTERVIEW_LINKS.filter((l) => l.id !== 'mock').map((l) => (
            <Link
              key={l.id}
              to={l.path}
              className="min-h-tap inline-flex items-center rounded-full border border-line bg-white px-4 text-base font-semibold text-navy hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
            >
              {t(`link_${l.id}`)}
            </Link>
          ))}
        </div>

        <N400LessonsCard />
      </div>
    </div>
  );
}
