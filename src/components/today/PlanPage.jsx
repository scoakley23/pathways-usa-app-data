import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { today as todayApi } from '@/api/today';
import { UNITS } from '@/lib/course';
import { loadPlanSettings, savePlanChoice } from '@/lib/planSettings';
import { PACES, lessonsLeft, monthChoices, readyBy, recommendedPace } from '@/lib/dailyPlan';
import { minutesForPerDay } from '@/lib/dailyMinutes';
import { useJourney } from '@/components/course/courseShared';
import { useTodayText } from '@/components/today/useToday';

// Your plan (Prompt 7, frame R33Plan; Amio v2 in amio-v2/one-tap-me: a paper
// page with Back and the title, months as 12px chips (open = navy), the
// paces as white cards (open = navy border, Recommended = a gold tag)): the interview month (device only, "I
// don't know yet" allowed) and lessons per day (1 easy / 2 steady / 3 fast,
// each "about 5 / 10 / 15 min a day", src/lib/dailyMinutes.js), each with the
// "Ready by" month from the lessons left in the whole course at 6 study days
// a week. No reminder time. First open sets lessons per day too.

const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export default function PlanPage() {
  const navigate = useNavigate();
  const { t, rtl, language } = useTodayText();
  const journey = useJourney();
  const now = useMemo(() => new Date(), []);
  const saved = loadPlanSettings();
  const [month, setMonth] = useState(saved?.mode === 'date' && saved.target ? ym(saved.target) : saved ? 'unknown' : null);
  const [perDay, setPerDay] = useState(0);
  const [busy, setBusy] = useState(false);
  const firstTime = !journey.loading && journey.user && !todayApi.lessonsPerDay(journey.user);

  useEffect(() => {
    if (!journey.loading && journey.user) setPerDay((p) => p || todayApi.lessonsPerDay(journey.user));
  }, [journey.loading, journey.user]);

  const months = monthChoices(now);
  const left = lessonsLeft(UNITS, journey.progress);
  const target = month && month !== 'unknown' ? new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 15, 12) : null;
  const recommended = recommendedPace(left, target, now);
  const choice = perDay || recommended;
  const fmt = (d, opts) => d.toLocaleDateString(language === 'en' ? 'en-US' : language, opts);

  const save = async () => {
    setBusy(true);
    savePlanChoice(month && month !== 'unknown' ? { mode: 'date', month } : { mode: 'unknown' }, now);
    try { await todayApi.setLessonsPerDay(choice); } catch { /* kept on screen; try again */ }
    setBusy(false);
    navigate('/');
  };

  const chip = (active) => `min-h-tap rounded-button border-[1.5px] px-4 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${active ? 'bg-navy border-navy text-white' : 'bg-white border-line text-navy hover:border-navy'}`;

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy flex flex-col">
      <div className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 pb-5 flex flex-col gap-5">
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => navigate(-1)} aria-label={t('back')} className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
          <h1 className="min-w-0 pt-1 font-display text-[1.75rem] leading-tight" dir="auto">{t('plan_title')}</h1>
        </div>
        <section className="flex flex-col gap-2" aria-labelledby="plan-when">
          <h2 id="plan-when" className="text-lg font-bold text-navy">{t('plan_when')}</h2>
          <p className="text-base text-muted">{t('plan_when_sub')}</p>
          <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="plan-when">
            {months.map((m) => (
              <button key={m.month} type="button" role="radio" aria-checked={month === m.month} onClick={() => setMonth(m.month)} className={chip(month === m.month)}>
                {fmt(m.date, { month: 'short' })}
              </button>
            ))}
            <button type="button" role="radio" aria-checked={month === 'unknown'} onClick={() => setMonth('unknown')} className={chip(month === 'unknown')}>
              {t('plan_dont_know')}
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="plan-pace">
          <h2 id="plan-pace" className="text-lg font-bold text-navy">{t('plan_how_many')}</h2>
          <div className="flex flex-col gap-3" role="radiogroup" aria-labelledby="plan-pace">
            {PACES.map((p) => {
              const on = choice === p.perDay;
              const ready = readyBy(left, p.perDay, now);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPerDay(p.perDay)}
                  className={`flex items-center gap-4 rounded-card border-[2.5px] bg-white px-4 py-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${on ? 'border-navy' : 'border-line hover:border-navy'}`}
                >
                  <span className="font-display text-[2.125rem] text-navy w-8 text-center shrink-0" aria-hidden="true">{p.perDay}</span>
                  <span className="flex-1 min-w-0">
                    {p.perDay === recommended && <span className="mb-1 inline-block rounded-button bg-gold px-3 py-1 text-small font-semibold text-navy">{t('recommended')}</span>}
                    <span className="block text-lg font-bold text-navy">{t(`pace_${p.id}`)} · {p.perDay === 1 ? t('pace_lessons_1') : t('pace_lessons_n', { n: p.perDay })}</span>
                    <span className="block text-base text-navy">{t('pace_minutes', { n: minutesForPerDay(p.perDay) })}</span>
                    <span className="block text-base text-muted">{t('ready_by', { month: fmt(ready, { month: 'long', year: ready.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }) })}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <AmioSays mood="kind" size={56}>{t('plan_amio')}</AmioSays>
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" disabled={busy || journey.loading} onClick={save}>{firstTime ? t('start_plan') : t('save_plan')}</Button>
      </div>
    </div>
  );
}
