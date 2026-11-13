// Amio, the Pathways tutor. Copied exactly from the design canvas (viewBox 0 0 80 80).
// Usage: <Amio mood="curious" size={96} />   On navy backgrounds: <Amio onNavy />
import React from 'react';

export type AmioMood = 'happy' | 'curious' | 'cheer' | 'proud' | 'wave' | 'listen' | 'kind';

const NAVY = '#1E2B45';
const DENIM = '#3B5B92';
const RED = '#F0503C';

type Props = {
  mood?: AmioMood;
  size?: number;
  onNavy?: boolean; // white hair so it shows on navy
  title?: string;   // set only when Amio carries meaning; otherwise it's decorative
};

export function Amio({ mood = 'happy', size = 80, onNavy = false, title }: Props) {
  const arms = { both: 'M11 30L4 17M53 30l7-13', one: 'M53 30l7-13' };
  const openMouth = <path d="M32 48c4 6 12 6 16 0z" fill={NAVY} />;

  let whites: React.ReactNode = (<><circle cx="31" cy="38" r="7" fill="#FFF" /><circle cx="49" cy="38" r="7" fill="#FFF" /></>);
  let pupils: React.ReactNode = (<><circle cx="32" cy="39" r="3.5" fill={NAVY} /><circle cx="50" cy="39" r="3.5" fill={NAVY} /></>);
  let mouth: React.ReactNode = <path d="M33 50c4 4 10 4 14 0" stroke={NAVY} strokeWidth="3" fill="none" strokeLinecap="round" />;
  let armPath: string | null = null;

  switch (mood) {
    case 'curious':
      whites = (<><circle cx="31" cy="38" r="8" fill="#FFF" /><circle cx="49" cy="38" r="8" fill="#FFF" /></>);
      pupils = (<><circle cx="33" cy="35.5" r="4" fill={NAVY} /><circle cx="51" cy="35.5" r="4" fill={NAVY} /></>);
      mouth = (<><circle cx="40" cy="51" r="3" fill={NAVY} />
        <path d="M66 12c0-4 6-4 6 0 0 3-3 3-3 6M69 23v.5" stroke={DENIM} strokeWidth="2.6" fill="none" strokeLinecap="round" /></>);
      break;
    case 'cheer':
      pupils = (<><circle cx="31" cy="37" r="3.5" fill={NAVY} /><circle cx="49" cy="37" r="3.5" fill={NAVY} /></>);
      mouth = openMouth; armPath = arms.both; break;
    case 'proud':
      whites = null;
      pupils = <path d="M25 38q6-6 12 0M43 38q6-6 12 0" stroke="#FFF" strokeWidth="3" fill="none" strokeLinecap="round" />;
      mouth = <path d="M32 47c4 6 12 6 16 0z" fill={NAVY} />; armPath = arms.both; break;
    case 'wave':
      mouth = openMouth; armPath = arms.one; break;
    case 'listen':
      mouth = <circle cx="40" cy="51" r="2.6" fill={NAVY} />; break;
    case 'kind':
      mouth = <path d="M34 50c4 3 8 3 12 0" stroke={NAVY} strokeWidth="3" fill="none" strokeLinecap="round" />; break;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0 }}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d="M29 9c4-5 7 2 11-1.5s7 2.5 11-1" stroke={onNavy ? '#FFF' : NAVY} strokeWidth="4" fill="none" strokeLinecap="round" />
      {armPath && <path d={armPath} stroke={RED} strokeWidth="4" strokeLinecap="round" />}
      <path d="M40 16c17 0 28 10 28 24s-11 24-28 24c-3.5 0-6.8-.5-9.8-1.4L18 70l3.2-11.5C15.5 54 12 47.5 12 40c0-14 11-24 28-24z" fill={RED} />
      {whites}{pupils}{mouth}
    </svg>
  );
}

// Amio + one short line in a speech bubble (rule 3: one short line, never a chat thread).
export function AmioSays({ mood = 'happy', size = 64, children }: { mood?: AmioMood; size?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      <Amio mood={mood} size={size} />
      <div style={{ background: '#FFF', border: `2px solid ${RED}`, borderRadius: '16px 16px 16px 4px',
        padding: '9px 12px', fontSize: 14, fontWeight: 600, lineHeight: 1.35, color: NAVY }}>{children}</div>
    </div>
  );
}
