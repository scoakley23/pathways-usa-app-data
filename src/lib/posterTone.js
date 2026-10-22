// Poster colors for test questions and practice items (brand spec: posters
// alternate Red ink and Civics blue, card by card, with white text).
//
// Switch POSTER_SCHEME to 'subject' to use "red = civics, blue = English
// skills" instead of alternating.
export const POSTER_SCHEME = 'alternate';

export const POSTER_TONES = ['red', 'blue'];

// index: the card's position in the run (0-based). skill: civics | reading |
// writing | speaking | n400, used only by the 'subject' scheme.
export function posterTone(index = 0, skill) {
  if (POSTER_SCHEME === 'subject') return skill === 'civics' ? 'red' : 'blue';
  const i = Math.abs(Math.trunc(Number(index) || 0));
  return POSTER_TONES[i % POSTER_TONES.length];
}
