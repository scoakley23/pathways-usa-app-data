import React, { useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CONFETTI_COLORS } from '@/lib/theme';
import { Amio } from '@/components/pathways/Amio';
import { useJourney } from '@/components/course/courseShared';
import { unitComplete, unitStats } from '@/lib/checkpoints';
import { useCheckpointText } from '@/components/checkpoint/checkpointParts';
import { MAIN_PRESS } from '@/components/pathways/ui';
import RedStop from '@/components/pathways/RedStop';

// Unit complete (Prompt 8, /course/unit/:unitId/done, frame R33UnitDone):
// confetti (reduced motion respected), Amio cheering, the unit's numbers
// (lessons, test questions, sentences read and written) and a button to the
// unit practice interview (always open; no badge, no "Unlocked"). Shown right after the unit's last Speak it! is
// passed, or any time later for a finished unit. Saves nothing.

function Stat({ value, label }) {
  return (
    <div className="flex-1 min-w-0 rounded-card bg-chip-navy px-2 py-4 text-center">
      <p className="text-[1.625rem] font-extrabold text-white tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-small text-on-navy">{label}</p>
    </div>
  );
}

export default function UnitDonePage() {
  const { unitId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, rtl } = useCheckpointText();
  const journey = useJourney();
  const unit = journey.course.find((u) => u.id === unitId);
  const show = !!unit && (location.state?.justFinished || unitComplete(unitId, journey.stops));

  useEffect(() => {
    if (journey.loading || !show) return;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 }, colors: CONFETTI_COLORS, disableForReducedMotion: true });
  }, [journey.loading, show]);

  if (journey.loading) return <div className="min-h-screen bg-navy" />;
  if (!show) return <Navigate to={unit ? `/course/unit/${unit.id}` : '/course'} replace />;

  const stats = unitStats(unit);
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-navy text-white flex flex-col">
      <div className="flex-1 max-w-lg w-full mx-auto px-4 pt-10 pb-6 flex flex-col items-center gap-5 text-center">
        <p className="text-small font-bold text-gold">{t('unit_complete', { n: unit.number })}</p>
        <Amio mood="cheer" size={110} onNavy />
        <h1 className="text-celebrate font-extrabold leading-tight" dir="auto"><RedStop>{t('unit_done_title', { unit: unit.title })}</RedStop></h1>
        <div className="w-full flex gap-2">
          <Stat value={stats.lessons} label={t('stat_lessons')} />
          <Stat value={stats.questions} label={t('stat_questions')} />
          <Stat value={stats.sentences} label={t('stat_sentences')} />
        </div>
      </div>
      <div className="px-4 pb-8 max-w-lg w-full mx-auto flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/course/unit/${unit.id}/interview`)}
          className={`w-full min-h-main mb-[5px] rounded-button bg-gold px-6 text-lg font-bold text-navy ${MAIN_PRESS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy`}
        >
          {t('try_interview')}
        </button>
        <Link to={`/course?unit=${unit.id}`} className="min-h-tap inline-flex items-center px-3 text-base font-semibold text-white underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">
          {t('see_journey')}
        </Link>
      </div>
    </div>
  );
}
