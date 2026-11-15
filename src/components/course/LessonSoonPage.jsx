import React from 'react';
import { Link, useParams } from 'react-router-dom';
import NavyBanner from '@/components/pathways/NavyBanner';
import { AmioSays } from '@/components/pathways/Amio';
import { findLesson } from '@/lib/course';
import { useCourseText } from '@/components/course/courseShared';

// Start on a lesson (/course/lesson/:lessonId) until the lesson player
// (Prompt 6) replaces this page. Saves nothing.
export default function LessonSoonPage() {
  const { lessonId } = useParams();
  const { t, rtl } = useCourseText();
  const found = findLesson(lessonId);
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-page">
      <NavyBanner title={found?.lesson.title || t('lesson_soon_title')} subtitle={found ? `${t('unit_n', { n: found.unit.number })} · ${found.section.title}` : null} />
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
        <AmioSays mood="kind" size={64}>{t('lesson_soon_title')}</AmioSays>
        <p className="text-base text-navy">{t('lesson_soon_body')}</p>
        <Link
          to={found ? `/course?unit=${found.unit.id}` : '/course'}
          className="min-h-main inline-flex items-center justify-center rounded-button bg-denim px-6 text-base font-bold text-white shadow-lip hover:bg-denim-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
        >
          {t('back_to_road')}
        </Link>
      </div>
    </div>
  );
}
