import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen, CalendarDays, FileText, Landmark, Mic, PenLine, Scale } from 'lucide-react';
import useReadinessData from '@/components/shell/useReadinessData';
import { AmioSays } from '@/components/pathways/Amio';
import { MAIN_PRESS } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { useAuth } from '@/lib/AuthContext';
import { INTERVIEW_LINKS } from '@/lib/shellRoutes';
import { readyParts } from '@/lib/interviewReadiness';
import { PROCESSING_TIMES, USCIS_N400_URL, canSeeSampleOffices, savedRange } from '@/lib/interviewEstimate';
import N400LessonsCard from '@/components/n400lesson/N400LessonsCard';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ChevronRight } from 'lucide-react';

// The Interview tab (/interview, Amio v2 frame Interview). On navy: Amio's
// line, "n of 5 parts of the interview ready" with five circles (N-400 ·
// Speaking · Reading · Writing · Civics, readyParts() over what the app
// already saves: N-400 guide sections read, the latest practice interview,
// quick-check levels), and the gold Practice interview button. Then four big
// tiles: When? (the device-only estimate, /interview/when), the N-400 guide,
// Ask a lawyer (/lawyer-first) and File (uscis.gov), the "AI practice
// officer" line, the day guide and next N-400 lesson links, and the N-400
// lessons. Past practice interview scores are on the mock interview's start
// screen and on Progress. Reads only; saves nothing.
import { INTERVIEW_LINES as LINES } from './shellStrings';

const PART_ICONS = { n400: FileText, speaking: Mic, reading: BookOpen, writing: PenLine, civics: Landmark };

function Tile({ to, href, icon: Icon, title, sub, className, srNote }) {
  const inner = (
    <>
      <Icon className="w-7 h-7" strokeWidth={2} aria-hidden="true" />
      <span className="mt-auto block text-lg font-bold leading-tight">{title}</span>
      <span className="block text-sm">{sub}</span>
      {srNote && <span className="sr-only"> ({srNote})</span>}
    </>
  );
  const cls = `min-h-[7rem] rounded-card p-4 flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${className}`;
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <Link to={to} className={cls}>{inner}</Link>;
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'interview_tab_v3' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const { user } = useAuth();
  const data = useReadinessData();
  const { parts, readyCount, total } = readyParts(data || {});
  const firstNotReady = parts.find((p) => !p.ready);
  const amio = !data ? null : readyCount === 0 ? t('amio_start') : firstNotReady ? t('amio_next', { part: t(`part_${firstNotReady.id}`) }) : t('amio_all');
  const range = savedRange(PROCESSING_TIMES, { showSamples: canSeeSampleOffices(user) });
  const locale = language === 'en' ? 'en-US' : language;
  let when = t('tile_when_none');
  if (range) {
    try { when = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).formatRange(range.from, range.to); } catch { when = `${range.from.toLocaleDateString(locale, { month: 'short' })} – ${range.to.toLocaleDateString(locale, { month: 'short', year: 'numeric' })}`; }
  }
  const mock = INTERVIEW_LINKS.find((l) => l.id === 'mock');
  // The gold button offers two lengths: the practice interview (about 10
  // questions, scores saved) or the whole day (/interview-day, nothing saved).
  const [choose, setChoose] = useState(false);
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const lengths = [
    { id: 'short', title: t('len_short'), body: t('len_short_body'), path: mock.path },
    { id: 'day', title: t('len_day'), body: t('len_day_body'), path: '/interview-day?call=1' },
  ];

  return (
    <div dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <section className="bg-navy text-white" aria-labelledby="ready-title">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-6 flex flex-col gap-4">
          <h1 id="ready-title" className="sr-only">{t('title')}</h1>
          {amio && <AmioSays mood="hello" size={56} onNavy>{amio}</AmioSays>}
          <div>
            <p className="font-display text-[4rem] leading-none tracking-tight tabular-nums">{data ? t('n_of_total', { n: readyCount, total }) : ' '}</p>
            <p className="mt-1 text-lg text-sky">{t('parts_ready')}</p>
          </div>
          <ul className="grid grid-cols-5 gap-1 list-none m-0 p-0">
            {parts.map((p) => {
              const Icon = PART_ICONS[p.id];
              return (
                <li key={p.id} className="flex flex-col items-center gap-1.5 text-center">
                  <span className={`grid place-items-center w-14 h-14 rounded-full ${p.ready ? 'bg-gold text-navy' : 'border-2 border-dashed border-on-navy text-on-navy'}`}>
                    <Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className={`text-small leading-tight ${p.ready ? 'text-white font-semibold' : 'text-on-navy'}`}>
                    {t(`part_${p.id}`)}<span className="sr-only">: {p.ready ? t('ready') : t('not_yet')}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setChoose(true)}
            className={`w-full min-h-main mb-[5px] rounded-button bg-gold px-6 text-lg font-extrabold text-navy ${MAIN_PRESS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy`}
          >
            {t('start')}
          </button>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Tile to="/interview/when" icon={CalendarDays} title={t('tile_when')} sub={when} className="bg-sky text-navy" />
          <Tile to="/n400-guide" icon={FileText} title={t('tile_n400')} sub={t('tile_n400_sub')} className="bg-gold text-navy" />
          <Tile to="/lawyer-first" icon={Scale} title={t('tile_lawyer')} sub={t('tile_lawyer_sub')} className="bg-denim text-white" />
          <Tile href={USCIS_N400_URL} icon={ArrowUpRight} title={t('tile_file')} sub={t('tile_file_sub')} srNote={t('opens_outside')} className="bg-white text-navy border-[1.5px] border-line" />
        </div>
        <p className="text-small text-muted text-center">{t('footer')}</p>

        <div className="flex flex-wrap gap-2">
          {INTERVIEW_LINKS.filter((l) => ['day', 'coach'].includes(l.id)).map((l) => (
            <Link
              key={l.id}
              to={l.path}
              className="min-h-tap inline-flex items-center rounded-button border border-line bg-white px-4 text-base font-semibold text-navy hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
            >
              {t(`link_${l.id}`)}
            </Link>
          ))}
        </div>

        <N400LessonsCard />
      </div>

      <Sheet open={choose} onOpenChange={setChoose}>
        <SheetContent side="bottom" dir={dir} className="rounded-t-sheet bg-paper text-navy px-4 pt-6 pb-8">
          <SheetTitle className="pe-10 font-display text-[1.625rem] leading-tight text-navy" dir="auto">{t('len_title')}</SheetTitle>
          <SheetDescription className="sr-only">{t('len_title')}</SheetDescription>
          <ul className="mt-4 flex flex-col gap-2 list-none m-0 p-0">
            {lengths.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => { setChoose(false); navigate(l.path); }}
                  className="w-full min-h-[4.5rem] rounded-card bg-white border-[1.5px] border-line px-4 py-3 flex items-center gap-3 text-start hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-lg font-bold" dir="auto">{l.title}</span>
                    <span className="block text-base text-muted" dir="auto">{l.body}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
