import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { useJourney } from '@/components/course/courseShared';
import { today as todayApi } from '@/api/today';
import { UNITS } from '@/lib/course';
import { lessonsLeft, readyBy } from '@/lib/dailyPlan';
import { savePlanChoice } from '@/lib/planSettings';
import {
  NOT_FILED, PROCESSING_TIMES, USCIS_PROCESSING_URL, estimateRange, isStale, loadInterviewChoice, officeById,
  canSeeSampleOffices, recentMonths, saveInterviewChoice, visibleOffices,
} from '@/lib/interviewEstimate';
import { WHEN_LINES } from '@/components/shell/shellStrings';

// "When's my interview?" (/interview/when, Amio v2 frame WhenInterview).
// Not filed yet: the "ready by" month from the learner's plan. Already filed:
// the filing month and field office (both on this device only, never sent
// anywhere; src/lib/interviewEstimate.js) give "Most N-400s at this office are
// finished between … and …" (or "by …" when USCIS shows one number), from the hand-checked USCIS times bundled in
// content/uscis/ (never fetched). Always "Estimate only. Not legal advice."
// and the official USCIS processing times link. While no real office has
// been checked yet, learners see "Coming soon" and the link instead of an
// empty picker; admins (and dev) also see the sample offices and real ones
// still waiting for the owner's check (marked "needs check"). Once the hand
// check is more than 60 days old, learners see "Coming soon" again and admins
// see an "out of date" note (isStale()).

const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export default function WhenInterviewPage() {
  const navigate = useNavigate();
  const [language] = useAppLanguage();
  const rtl = RTL_LANGUAGES.includes(language);
  const tr = useTranslatedLines(WHEN_LINES, language, { cacheKey: 'interview_when_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || WHEN_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const journey = useJourney();
  const showSamples = canSeeSampleOffices(journey.user);
  const offices = visibleOffices(PROCESSING_TIMES, { showSamples });
  const [choice, setChoice] = useState(loadInterviewChoice);
  const [added, setAdded] = useState(false);
  const locale = language === 'en' ? 'en-US' : language;

  const update = (patch) => {
    saveInterviewChoice(patch);
    setChoice(loadInterviewChoice());
    setAdded(false);
  };

  const filed = choice.filed && choice.filed !== NOT_FILED;
  const office = officeById(choice.officeId, PROCESSING_TIMES, { showSamples });
  const range = filed ? estimateRange(office, choice.filed) : null;

  const monthName = (d, withYear = true) => d.toLocaleDateString(locale, withYear ? { month: 'long', year: 'numeric' } : { month: 'long' });
  const num = (n) => { try { return new Intl.NumberFormat(locale).format(n); } catch { return String(n); } };
  const rangeText = (r) => {
    if (r.single) return monthName(r.to);
    try { return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).formatRange(r.from, r.to); } catch { return `${monthName(r.from)} – ${monthName(r.to)}`; }
  };

  // The plan's "ready by" month (lessons left at the learner's pace).
  const ready = useMemo(() => {
    if (journey.loading || !journey.user) return null;
    const perDay = todayApi.lessonsPerDay(journey.user);
    if (!perDay) return null;
    return readyBy(lessonsLeft(UNITS, journey.progress), perDay);
  }, [journey.loading, journey.user, journey.progress]);

  const checked = PROCESSING_TIMES.checked_on
    ? new Date(`${PROCESSING_TIMES.checked_on}T12:00:00`).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const toggle = (on) => `min-h-tap flex-1 rounded-button px-3 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${on ? 'bg-navy text-white' : 'text-navy'}`;
  const select = 'w-full min-h-[3rem] rounded-button border-[1.5px] border-line bg-white px-3 text-base font-bold text-navy focus:outline-none focus:ring-2 focus:ring-denim';

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 flex flex-col gap-5">
        <button type="button" onClick={() => navigate(-1)} aria-label={t('back')} className="w-11 h-11 -ms-2 grid place-items-center rounded-full hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
        </button>
        <h1 className="font-display text-[2.5rem] leading-none tracking-tight">{t('title')}</h1>

        <div role="radiogroup" aria-label={t('title')} className="flex gap-1 rounded-card bg-line-soft p-1">
          <button type="button" role="radio" aria-checked={!filed} onClick={() => update({ filed: NOT_FILED })} className={toggle(!filed)}>{t('not_filed')}</button>
          <button type="button" role="radio" aria-checked={!!filed} onClick={() => update({ filed: filed ? choice.filed : recentMonths(1)[0] })} className={toggle(!!filed)}>{t('filed')}</button>
        </div>

        {filed && offices.length === 0 && (
          <section className="rounded-card bg-white border-[1.5px] border-line p-5 flex flex-col gap-2">
            <h2 className="text-lg font-bold">{t('coming_soon_title')}</h2>
            <p className="text-base">{t('coming_soon_body')}</p>
          </section>
        )}

        {filed && offices.length > 0 && (
          <>
            <dl className="flex flex-col">
              <div className="flex flex-col gap-1.5 py-3 border-b border-line">
                <dt><label htmlFor="when-month" className="text-base text-muted">{t('filed_in')}</label></dt>
                <dd>
                  <select id="when-month" value={choice.filed} onChange={(e) => update({ filed: e.target.value })} className={select}>
                    {recentMonths().map((m) => {
                      const [y, mo] = m.split('-').map(Number);
                      return <option key={m} value={m}>{monthName(new Date(y, mo - 1, 15))}</option>;
                    })}
                  </select>
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 py-3 border-b border-line">
                <dt><label htmlFor="when-office" className="text-base text-muted">{t('field_office')}</label></dt>
                <dd>
                  <select id="when-office" value={office?.id || ''} onChange={(e) => update({ officeId: e.target.value || null })} className={select}>
                    <option value="">{t('pick_office')}</option>
                    {offices.map((o) => <option key={o.id} value={o.id}>{o.name}{o.state && o.state !== '--' ? `, ${o.state}` : ''}{o.needs_owner_check ? ` (${t('needs_check')})` : ''}</option>)}
                  </select>
                </dd>
              </div>
            </dl>
            {offices.some((o) => o.sample) && <p className="text-small text-muted">{t('sample_note')}</p>}
            {offices.some((o) => o.needs_owner_check) && <p className="text-small text-muted">{t('needs_check_note')}</p>}
            {showSamples && offices.some((o) => !o.sample) && isStale(PROCESSING_TIMES) && <p className="text-small text-muted">{t('out_of_date_note')}</p>}

            {range ? (
              <section className="rounded-card bg-sky p-5 flex flex-col gap-2" aria-live="polite">
                <p className="font-display text-[2.25rem] leading-[1.05] tracking-tight">{rangeText(range)}</p>
                <p className="text-base">{range.single
                  ? t('most_finished_by', { month: monthName(range.to) })
                  : t('most_finished', { from: monthName(range.from), to: monthName(range.to) })}</p>
                <p className="text-base">{range.single
                  ? t('uscis_months_one', { months: num(range.max) })
                  : t('uscis_months', { min: num(range.min), max: num(range.max) })}</p>
              </section>
            ) : (
              <p className="text-base text-muted">{t('pick_both')}</p>
            )}
          </>
        )}

        {!filed && (
          ready
            ? <section className="rounded-card bg-sky p-5"><p className="font-display text-[1.75rem] leading-tight">{t('ready_by', { month: monthName(ready) })}</p></section>
            : (
              <section className="rounded-card bg-white border-[1.5px] border-line p-5 flex flex-col gap-3">
                <p className="text-base">{t('no_plan')}</p>
                <Link to="/plan" className="self-start min-h-tap inline-flex items-center font-semibold text-denim underline underline-offset-4">{t('make_plan')}</Link>
              </section>
            )
        )}

        {ready && (filed ? range : false) && <AmioSays mood="hello" size={56}>{t('ready_by_amio', { month: monthName(ready, false) })}</AmioSays>}

        <p className="text-base font-bold">{t('estimate_only')}</p>
        <p className="flex items-center gap-2 text-small text-muted">
          <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
          {checked ? t('saved_here', { date: checked }) : t('saved_here_nodate')}
        </p>

        <div className="flex flex-col items-center gap-2">
          {range && (
            <Button
              variant="main"
              className="w-full"
              onClick={() => { savePlanChoice({ mode: 'date', month: ym(range.from) }); setAdded(true); }}
            >
              {t('use_in_plan')}
            </Button>
          )}
          {added && <p role="status" className="text-base text-navy">{t('used_in_plan')}</p>}
          <a
            href={USCIS_PROCESSING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-tap inline-flex items-center gap-2 px-1 text-base font-semibold text-navy underline underline-offset-4 hover:text-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded"
          >
            {t('check_uscis')} <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
