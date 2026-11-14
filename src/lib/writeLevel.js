// Write it levels (Prompt 4; the screens come in Prompt 6). Level 1: tap the
// words from a word bank. Level 2: type the sentence. Each pass at level 1
// adds one to write_level1_passes; at 2 the learner moves to level 2. The
// database enforces the same rule (profiles_write_level trigger), so this is
// for showing the right screen and saving the right numbers.

export const PASSES_TO_LEVEL_2 = 2;

export function normalizeWriteLevel(profile = {}) {
  const passes = Math.min(PASSES_TO_LEVEL_2, Math.max(0, Number(profile?.write_level1_passes) || 0));
  const level = profile?.write_level === 2 || passes >= PASSES_TO_LEVEL_2 ? 2 : 1;
  return { write_level: level, write_level1_passes: passes };
}

// What to save after a Write it step. Only a pass at level 1 changes
// anything; level 2 and misses save nothing new.
export function afterWriteIt(profile, passed) {
  const now = normalizeWriteLevel(profile);
  if (!passed || now.write_level === 2) return now;
  const passes = now.write_level1_passes + 1;
  return { write_level: passes >= PASSES_TO_LEVEL_2 ? 2 : 1, write_level1_passes: passes };
}
