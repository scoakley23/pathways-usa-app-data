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
};
