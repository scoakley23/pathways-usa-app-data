// Colors as hex values, for places Tailwind classes can't reach (inline SVG
// fills, chart libraries, map layers). Every value comes from
// src/design/tokens.js; change it there, never here.
import { COLORS as TOKENS } from '@/design/tokens';

export const COLORS = {
  // Style-guide names.
  navy: TOKENS.navy,
  denim: TOKENS.denim,
  red: TOKENS.red,
  amioRed: TOKENS['amio-red'],
  amioBlush: TOKENS['amio-blush'],
  amioTint: TOKENS['amio-tint'],
  sky: TOKENS.sky,
  redText: TOKENS['red-text'],
  gold: TOKENS.gold,
  paper: TOKENS.paper,
  tint: TOKENS.tint,
  mid: TOKENS.mid,
  line: TOKENS.line,
  chipNavy: TOKENS['chip-navy'],
  muted: TOKENS.muted,
  onNavyText: TOKENS['on-navy'],
  correct: TOKENS.correct,
  notYet: TOKENS['not-yet'],
  card: TOKENS.white,
  white: TOKENS.white,
};

// Confetti (Amio v2): gold, sky, denim and navy. Never red: red is Amio only.
// Red means Amio or a celebration: confetti is a celebration.
export const CONFETTI_COLORS = [COLORS.gold, COLORS.sky, COLORS.denim, COLORS.navy, COLORS.amioRed];
