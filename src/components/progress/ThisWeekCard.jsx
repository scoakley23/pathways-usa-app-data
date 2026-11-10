import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useTodayText from '@/components/persona/useTodayText';
import { Card } from '@/components/pathways/ui';
import { dayIndex } from '@/lib/studyPlan';
import { loadPlanSettings } from '@/lib/planSettings';
import { practiceDaysThisWeek, weekSquares, weeksToInterview } from '@/lib/todayView';

// "This week" (moved here from Today): the days practiced this week as seven
// squares, how many 2025 civics questions are ready, and "about N weeks" to
// the interview month (only when one is set on this device). Reads saved
// progress dates only; nothing new is stored.
export default function ThisWeekCard({ language = 'en' }) {
  const today = useMemo(() => new Date(), []);
  const { t } = useTodayText(language);
  const [data, setData] = useState(null);

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
  const daysKey = daysCount === 0 ? 'days_week_none' : daysCount === 1 ? 'days_week_one' : 'days_week';
  const squares = weekSquares([...practiced], dayIndex(today), today.getDay());
  const weeks = weeksToInterview(loadPlanSettings(), today);
  const weeksKey = weeks === 0 ? 'weeks_left_none' : weeks === 1 ? 'weeks_left_one' : 'weeks_left';

  const locale = language === 'en' ? 'en-US' : language;
  const weekdayInitials = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(2024, 0, 1 + k); // Jan 1 2024 was a Monday
    try { return d.toLocaleDateString(locale, { weekday: 'narrow' }); } catch (e) { return ''; }
  });

  return (
    <Card padding="p-5" className="space-y-3 text-ink">
      <h2 className="text-label uppercase text-ink-label">{t('this_week')}</h2>
      <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
        {squares.map((sq, k) => (
          <div key={k} className="flex flex-col items-center gap-1">
            <span className={`block w-full aspect-square max-h-9 rounded-md ${sq.filled ? 'bg-navy' : sq.today ? 'bg-white border-2 border-navy' : 'bg-sand'}`} />
            <span className="text-[13px] text-ink-2">{weekdayInitials[k]}</span>
          </div>
        ))}
      </div>
      <p className="text-base font-semibold">{t(daysKey, { n: daysCount })}</p>
      {data.civicsTotal > 0 && (
        <p className="border-t border-card-line pt-3 font-display text-[22px] leading-snug">{t('ready', { n: data.ready, t: data.civicsTotal })}</p>
      )}
      {weeks !== null && <p className="text-[15px] text-ink-2">{t(weeksKey, { n: weeks })}</p>}
    </Card>
  );
}
