import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { auth } from '@/api/auth';
import { courseProgress } from '@/api/course';
import { UNITS } from '@/lib/course';
import { canSeeDrafts } from '@/lib/journey';
import { N400_LESSONS, N400_LESSON_IDS, n400LessonVisible } from '@/lib/n400Lessons';
import { Card } from '@/components/pathways/ui';
import usePackLookup from '@/components/course/usePackLookup';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage from '@/hooks/useAppLanguage';
import { N400_LESSON_LINES } from '@/components/n400lesson/n400LessonStrings';

// "N-400 lessons" on the Interview tab: the lessons the learner may open
// (reviewed; admins also drafts), each with its unit, done check and stars.
// Reads only. Hidden while no lesson is open yet.
export default function N400LessonsCard() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(N400_LESSON_LINES, language, { cacheKey: 'n400_lesson_v2' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || N400_LESSON_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const tx = usePackLookup(language);
  const [state, setState] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      let user = null;
      try { user = await auth.me(); } catch { user = null; }
      let done = {};
      if (user) { try { done = (await courseProgress.load(N400_LESSON_IDS)).lessons; } catch { done = {}; } }
      if (active) setState({ drafts: canSeeDrafts(user), done });
    })();
    return () => { active = false; };
  }, []);

  if (!state) return null;
  const lessons = N400_LESSONS.filter((l) => n400LessonVisible(l, state.drafts));
  if (!lessons.length) return null;

  return (
    <Card padding="p-5" className="flex flex-col gap-3">
      <div>
        <h2 className="text-title font-bold text-navy">{t('lessons_title')}</h2>
        <p className="mt-1 text-base text-muted">{t('lessons_body')}</p>
      </div>
      <ul className="list-none m-0 p-0 flex flex-col gap-2">
        {lessons.map((l) => {
          const p = state.done[l.id];
          const finished = !!(p?.completed || p?.completed_at);
          const unit = UNITS.find((u) => u.id === l.unitId);
          return (
            <li key={l.id}>
              <Link to={`/course/n400/${l.id}`} className="min-h-[56px] flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
                <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-full ${finished ? 'bg-correct text-white' : 'bg-stop-n400 text-white'}`}>
                  {finished ? <Check className="w-5 h-5" strokeWidth={3} aria-label={t('lesson_done')} /> : <span className="text-small font-bold">{unit?.number}</span>}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-bold text-navy break-words" dir="auto">{tx ? tx(l.title) : l.title}</span>
                  <span className="block text-small text-muted">
                    {unit ? t('lesson_unit', { unit: unit.number }) : null}
                    {l.status === 'draft' ? ` · ${t('draft')}` : null}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
