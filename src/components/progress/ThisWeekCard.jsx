import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { auth } from '@/api/auth';
import useTodayText from '@/components/persona/useTodayText';
import { Card } from '@/components/pathways/ui';
import { dayIndex } from '@/lib/studyPlan';
import { loadPlanSettings } from '@/lib/planSettings';
import { practiceDaysThisWeek, weekCircles, weeksToInterview } from '@/lib/todayView';

// On Progress (The Road): two number cards (2025 civics questions ready,
// days practiced this week), the week strip (seven circles: navy =
// practiced, star red = today, dashed = future) and "about N weeks" to the
// interview month (only when one is set on this device). Reads saved
// progress dates only; nothing new is stored.
export default function ThisWeekCard({ language = 'en' }) {
  const today = useMemo(() => new Date(), []);
  const { t } = useTodayText(language);
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await auth.me();
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
        setData({
          dates: [
            ...progress.map((p) => p.last_practiced),
            ...sessions.map((s) => s.created_date),
            ...lessons.map((l) => l.last_attempt_date),
            ...n400.map((s) => s.completed_date),
          ],
          ready: progress.filter((p) => p.content_type === 'civics_question' && p.status === 'mastered' && civicsIds.has(p.content_id)).length,
          civicsTotal: civics2025.length,
        });
      } catch (e) {
        if (active) setData({ dates: [], ready: 0, civicsTotal: 0 });
      }
    })();
    return () => { active = false; };
  }, []);

  if (!data) return null;

  const practiced = practiceDaysThisWeek(data.dates, today);
  const daysCount = practiced.size;
  const circles = weekCircles([...practiced], dayIndex(today), today.getDay());
  const weeks = weeksToInterview(loadPlanSettings(), today);
  const weeksKey = weeks === 0 ? 'weeks_left_none' : weeks === 1 ? 'weeks_left_one' : 'weeks_left';

  const locale = language === 'en' ? 'en-US' : language;
  const weekdayInitials = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(2024, 0, 1 + k); // Jan 1 2024 was a Monday
    try { return d.toLocaleDateString(locale, { weekday: 'narrow' }); } catch (e) { return ''; }
  });
  const number = 'font-display text-[34px] leading-none';

  return (
    <div className="space-y-4 text-ink">
      {/* Two numbers: civics questions ready, days practiced this week */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="p-4">
          <p className="text-label uppercase text-ink-label">Civics ready</p>
          <p className="mt-2"><span className={number}>{data.ready}</span><span className="text-lg text-ink-2">/{data.civicsTotal || 128}</span></p>
          <p className="mt-1 text-sm text-ink-2">2025 civics questions</p>
        </Card>
        <Card padding="p-4">
          <p className="text-label uppercase text-ink-label">{t('this_week')}</p>
          <p className="mt-2"><span className={number}>{daysCount}</span><span className="text-lg text-ink-2">/7</span></p>
          <p className="mt-1 text-sm text-ink-2">Days practiced</p>
        </Card>
      </div>

      {/* The week strip: navy = practiced, star red = today, dashed = future */}
      <Card padding="p-4">
        <ol className="grid grid-cols-7 gap-1.5" aria-label={t(daysCount === 0 ? 'days_week_none' : daysCount === 1 ? 'days_week_one' : 'days_week', { n: daysCount })}>
          {circles.map((c, k) => (
            <li key={k} className="flex flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`block w-8 h-8 rounded-full ${
                  c.state === 'today' ? 'bg-red'
                    : c.state === 'practiced' ? 'bg-navy'
                      : c.state === 'future' ? 'border-2 border-dashed border-ink-2'
                        : 'border-2 border-card-line'
                }`}
              />
              <span className={`text-[13px] ${c.state === 'today' ? 'font-semibold text-ink' : 'text-ink-2'}`} aria-hidden="true">{weekdayInitials[k]}</span>
            </li>
          ))}
        </ol>
        {weeks !== null && <p className="mt-3 text-[15px] text-ink-2">{t(weeksKey, { n: weeks })}</p>}
      </Card>
    </div>
  );
}
