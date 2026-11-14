// Colors as hex values, for places Tailwind classes can't reach (inline SVG
// fills, chart libraries, map layers). Every value comes from
// src/design/tokens.js; change it there, never here.
import { COLORS as TOKENS } from '@/design/tokens';

export const COLORS = {
  // Style-guide names.
  navy: TOKENS.navy,
  denim: TOKENS.denim,
  red: TOKENS.red,
  redText: TOKENS['red-text'],
  gold: TOKENS.gold,
  page: TOKENS.page,
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
  // Older names, kept for screens not yet redone.
  navy2: TOKENS['chip-navy'],
  navyLine: TOKENS['chip-navy'],
  road: TOKENS['chip-navy'], // unfilled road on navy
  cream: TOKENS.page,
  cardLine: TOKENS.line,
  sand: TOKENS.tint,
  ink: TOKENS.navy,
  ink2: TOKENS.muted,
  inkLabel: TOKENS.muted,
  onNavy: TOKENS.white, // main text and marks on navy
  onNavy2: TOKENS['on-navy'],
  onNavyLabel: TOKENS['on-navy'],
  star: TOKENS.red, // "you are here", the logo's dot
  sky: TOKENS.denim, // done stops and the filled road (the old light blue)
  notCorrect: TOKENS['not-yet'],
};
