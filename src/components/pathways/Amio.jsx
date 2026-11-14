import React from 'react';
import { COLORS } from '@/lib/theme';

// Amio, the Pathways tutor. Shapes copied exactly from the design canvas
// (docs/design/amio/Amio.tsx, viewBox 0 0 80 80); only the TypeScript types
// were removed and the colors come from the tokens. Don't redraw Amio.
//
// <Amio mood="curious" size={96} />
// mood: happy | wave | curious | listen | kind | cheer | proud
// hair: 'navy' (default) | 'white' (so it shows on navy). `onNavy` = white hair.
// title: set only when Amio carries meaning ("Amio · AI tutor"); otherwise
// Amio is decorative and hidden from screen readers.

export const AMIO_MOODS = ['happy', 'wave', 'curious', 'listen', 'kind', 'cheer', 'proud'];

const NAVY = COLORS.navy;
const DENIM = COLORS.denim;
const RED = COLORS.red;
const WHITE = COLORS.white;

export function Amio({ mood = 'happy', size = 80, hair, onNavy = false, title, className = '' }) {
  const arms = { both: 'M11 30L4 17M53 30l7-13', one: 'M53 30l7-13' };
  const openMouth = <path d="M32 48c4 6 12 6 16 0z" fill={NAVY} />;
  const hairColor = (hair ?? (onNavy ? 'white' : 'navy')) === 'white' ? WHITE : NAVY;

  let whites = (<><circle cx="31" cy="38" r="7" fill={WHITE} /><circle cx="49" cy="38" r="7" fill={WHITE} /></>);
  let pupils = (<><circle cx="32" cy="39" r="3.5" fill={NAVY} /><circle cx="50" cy="39" r="3.5" fill={NAVY} /></>);
  let mouth = <path d="M33 50c4 4 10 4 14 0" stroke={NAVY} strokeWidth="3" fill="none" strokeLinecap="round" />;
  let armPath = null;

  switch (mood) {
    case 'curious':
      whites = (<><circle cx="31" cy="38" r="8" fill={WHITE} /><circle cx="49" cy="38" r="8" fill={WHITE} /></>);
      pupils = (<><circle cx="33" cy="35.5" r="4" fill={NAVY} /><circle cx="51" cy="35.5" r="4" fill={NAVY} /></>);
      mouth = (<><circle cx="40" cy="51" r="3" fill={NAVY} />
        <path d="M66 12c0-4 6-4 6 0 0 3-3 3-3 6M69 23v.5" stroke={DENIM} strokeWidth="2.6" fill="none" strokeLinecap="round" /></>);
      break;
    case 'cheer':
      pupils = (<><circle cx="31" cy="37" r="3.5" fill={NAVY} /><circle cx="49" cy="37" r="3.5" fill={NAVY} /></>);
      mouth = openMouth; armPath = arms.both; break;
    case 'proud':
      whites = null;
      pupils = <path d="M25 38q6-6 12 0M43 38q6-6 12 0" stroke={WHITE} strokeWidth="3" fill="none" strokeLinecap="round" />;
      mouth = <path d="M32 47c4 6 12 6 16 0z" fill={NAVY} />; armPath = arms.both; break;
    case 'wave':
      mouth = openMouth; armPath = arms.one; break;
    case 'listen':
      mouth = <circle cx="40" cy="51" r="2.6" fill={NAVY} />; break;
    case 'kind':
      mouth = <path d="M34 50c4 3 8 3 12 0" stroke={NAVY} strokeWidth="3" fill="none" strokeLinecap="round" />; break;
    default:
      break;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className={`shrink-0 ${className}`}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      <path d="M29 9c4-5 7 2 11-1.5s7 2.5 11-1" stroke={hairColor} strokeWidth="4" fill="none" strokeLinecap="round" />
      {armPath && <path d={armPath} stroke={RED} strokeWidth="4" strokeLinecap="round" />}
      <path d="M40 16c17 0 28 10 28 24s-11 24-28 24c-3.5 0-6.8-.5-9.8-1.4L18 70l3.2-11.5C15.5 54 12 47.5 12 40c0-14 11-24 28-24z" fill={RED} />
      {whites}{pupils}{mouth}
    </svg>
  );
}

// Amio + ONE short line in a speech bubble (rule 3: one short line, never a
// paragraph, never a chat thread). White bubble, 2px red border, navy text.
// The small corner points at Amio and flips in right-to-left languages.
export function AmioSays({ mood = 'happy', size = 64, hair, onNavy = false, title, className = '', children }) {
  return (
    <div className={`flex items-end gap-2.5 ${className}`}>
      <Amio mood={mood} size={size} hair={hair} onNavy={onNavy} title={title} />
      <p className="min-w-0 rounded-2xl rounded-es-[4px] border-2 border-red bg-white px-3 py-2 text-[15px] font-semibold leading-snug text-navy">
        {children}
      </p>
    </div>
  );
}

export default Amio;
