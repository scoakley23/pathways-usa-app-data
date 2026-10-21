import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookA, PenLine, GraduationCap, Check } from 'lucide-react';

const STEPS = [
  {
    key: 'sentence',
    label: 'Reading',
    desc: 'Read aloud',
    Icon: BookA,
  },
  {
    key: 'vocabulary',
    label: 'Writing',
    desc: 'Vocab & dictation',
    Icon: PenLine,
  },
  {
    key: 'civics_question',
    label: 'Civics',
    desc: 'Test questions',
    Icon: GraduationCap,
  },
];

export default function PracticePathProgress({ userEmail }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    const fetchProgress = async () => {
      try {
        const records = await base44.entities.UserProgress.filter({
          user_email: userEmail,
        });
        const counts = {};
        records.forEach((p) => {
          if (!counts[p.content_type])
            counts[p.content_type] = { mastered: 0, practiced: 0 };
          counts[p.content_type].practiced++;
          if (p.status === 'mastered') counts[p.content_type].mastered++;
        });
        setStats(counts);
      } catch (e) {
        console.error('Failed to load path progress', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [userEmail]);

  const currentKey = STEPS.find((s) => !stats[s.key] || stats[s.key].practiced === 0)?.key;

  return (
    <div className="bg-white rounded-3xl border border-pw-line shadow-raised p-5 text-pw-navy">
      <h2 className="text-xs font-bold text-pw-muted uppercase tracking-widest mb-5">
        Your Learning Path
      </h2>
      <div className="flex items-start justify-between">
        {STEPS.map((step, idx) => {
          const data = stats[step.key] || { mastered: 0, practiced: 0 };
          const isActive = data.practiced > 0;
          const { Icon } = step;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center text-center flex-1 min-w-0">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ring-2 transition-all ${
                    isActive
                      ? 'bg-pw-green-soft text-pw-green-ink ring-transparent'
                      : step.key === currentKey
                        ? 'bg-pw-red-soft text-pw-red-ink ring-pw-red/30'
                        : 'bg-pw-soft text-pw-muted ring-transparent'
                  }`}
                >
                  {isActive ? <Check className="w-6 h-6" aria-hidden="true" /> : <Icon className="w-6 h-6" aria-hidden="true" />}
                </div>
                <p className="font-bold text-base">{step.label}</p>
                <p className="text-sm text-pw-muted leading-tight mb-1">{step.desc}</p>
                <p className="text-sm font-semibold text-pw-navy">
                  {loading ? '—' : `${data.mastered} mastered`}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 bg-pw-line mx-1 mt-7 rounded-full overflow-hidden max-w-[2rem]">
                  <div
                    className={`h-full ${isActive ? 'bg-pw-green-ink' : ''}`}
                    style={{ width: isActive ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}