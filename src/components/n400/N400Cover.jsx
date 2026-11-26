import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, MessageSquareText } from 'lucide-react';
import { Card } from '@/components/pathways/ui';
import N400SectionList from './N400SectionList';
import useN400GuideText from './useN400GuideText';

// The guide's home (Amio v2): the reminder never to type answers, "n of 7
// sections read", the sections as cards, "N-400 lessons with Amio"
// (understanding only; the old coach address opens the next one), "Talk to a
// lawyer first" with a not-yet border and words, and "We never save your
// answers". (The file keeps its old name; it used to be the folder cover.)
export default function N400Cover({ sections, completedIds = [], countFor, onSelect }) {
  const { t } = useN400GuideText();
  const read = sections.filter((s) => completedIds.includes(s.id)).length;
  return (
    <div className="flex flex-col gap-5 text-navy">
      <Card padding="p-4" className="border-[2.5px] border-not-yet">
        <p className="text-base leading-relaxed" dir="auto">
          <strong>{t('never_type')}</strong> {t('never_type_body')}
        </p>
      </Card>
      <h2 className="text-lg font-bold" dir="auto">{t('read_count', { n: read, total: sections.length })}</h2>
      <N400SectionList sections={sections} completedIds={completedIds} countFor={countFor} onSelect={onSelect} />

      <Link
        to="/n400-coach"
        className="block rounded-card bg-white border-[1.5px] border-line p-4 hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
      >
        <span className="flex items-start gap-3">
          <span className="w-11 h-11 shrink-0 rounded-full bg-navy text-white grid place-items-center">
            <MessageSquareText className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight" dir="auto">{t('lessons_title')}</span>
            <span className="mt-1 block text-base text-muted" dir="auto">{t('lessons_body')}</span>
          </span>
          <ArrowRight className="w-5 h-5 shrink-0 mt-1 text-muted rtl:rotate-180" aria-hidden="true" />
        </span>
      </Link>

      <Link
        to="/lawyer-first"
        className="block rounded-card bg-white border-[2.5px] border-not-yet p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
      >
        <span className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0 text-not-yet" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight" dir="auto">{t('lawyer_title')}</span>
            <span className="mt-1 block text-base text-muted" dir="auto">{t('lawyer_body')}</span>
          </span>
          <ArrowRight className="w-5 h-5 shrink-0 mt-1 text-muted rtl:rotate-180" aria-hidden="true" />
        </span>
      </Link>

      <p className="text-center text-base text-muted" dir="auto">{t('never_save')}</p>
    </div>
  );
}
