import { describe, it, expect } from 'vitest';
import {
  buildTutorInstructions,
  normalizeTutorProfile,
  spokenTutorName,
  tutorMessage,
  FIXED_RULES,
  TUTOR_TONES,
  ENGLISH_MIX,
  DEFAULT_TUTOR_PROFILE,
  fixedTutorLines,
  FIXED_LINES_ES,
  CUSTOM_AVATAR,
  MAX_TUTOR_NAME_LENGTH,
  SUGGESTED_TUTOR_NAMES,
} from './tutorPersona';

describe('normalizeTutorProfile', () => {
  it('fills defaults for a missing profile', () => {
    expect(normalizeTutorProfile(undefined)).toEqual(DEFAULT_TUTOR_PROFILE);
    expect(normalizeTutorProfile(null)).toEqual(DEFAULT_TUTOR_PROFILE);
  });

  it('falls back to Vía for a blank name', () => {
    expect(normalizeTutorProfile({ name: '   ' }).name).toBe('Vía');
    expect(normalizeTutorProfile({ name: '' }).name).toBe('Vía');
  });

  it('trims and limits the name to 20 characters', () => {
    expect(normalizeTutorProfile({ name: '  Ana  ' }).name).toBe('Ana');
    expect(normalizeTutorProfile({ name: 'x'.repeat(40) }).name).toHaveLength(20);
  });

  it('replaces unknown avatar, tone, and mix with defaults', () => {
    const p = normalizeTutorProfile({ avatar: 'zz', tone: 'angry', english_mix: 'all' });
    expect(p.avatar).toBe(DEFAULT_TUTOR_PROFILE.avatar);
    expect(p.tone).toBe(DEFAULT_TUTOR_PROFILE.tone);
    expect(p.english_mix).toBe(DEFAULT_TUTOR_PROFILE.english_mix);
  });
});

describe('custom tutor picture and suggested names', () => {
  it('keeps the custom (device photo) avatar', () => {
    expect(normalizeTutorProfile({ avatar: CUSTOM_AVATAR }).avatar).toBe(CUSTOM_AVATAR);
  });

  it('suggests short, unique names that fit the limit, starting with Vía', () => {
    expect(SUGGESTED_TUTOR_NAMES[0]).toBe('Vía');
    expect(new Set(SUGGESTED_TUTOR_NAMES.map((n) => n.toLowerCase())).size).toBe(SUGGESTED_TUTOR_NAMES.length);
    for (const n of SUGGESTED_TUTOR_NAMES) {
      expect(n.length).toBeLessThanOrEqual(MAX_TUTOR_NAME_LENGTH);
      expect(normalizeTutorProfile({ name: n }).name).toBe(n);
    }
  });
});

describe('buildTutorInstructions', () => {
  const languages = ['English', 'Spanish', 'Arabic', 'Vietnamese'];

  for (const tone of Object.keys(TUTOR_TONES)) {
    for (const mix of Object.keys(ENGLISH_MIX)) {
      for (const lang of languages) {
        it(`keeps every fixed rule (${tone}, ${mix}, ${lang})`, () => {
          const text = buildTutorInstructions({ tone, english_mix: mix }, lang);
          for (const rule of FIXED_RULES) expect(text).toContain(rule);
          expect(text).toContain(TUTOR_TONES[tone].label);
          expect(text).toContain(lang);
        });
      }
    }
  }

  it('covers the required rules', () => {
    const text = buildTutorInstructions(undefined, 'Spanish');
    expect(text).toMatch(/A2–B1/);
    expect(text).toMatch(/learner’s language first, then give the English/);
    expect(text).toMatch(/Never change, add, or invent official/);
    expect(text).toMatch(/Never ask about the learner’s immigration case/);
    expect(text).toMatch(/Talk to a lawyer first/);
    expect(text).toMatch(/under 120 words/);
  });

  it('uses the tutor name, with Vía for a blank name', () => {
    expect(buildTutorInstructions({ name: 'Ana' })).toContain('You are Ana,');
    expect(buildTutorInstructions({ name: ' ' })).toContain('You are Vía,');
  });

  it('includes the English mix only for non-English learners', () => {
    expect(buildTutorInstructions({ english_mix: 'half' }, 'Spanish')).toContain('Half and half');
    expect(buildTutorInstructions({ english_mix: 'half' }, 'English')).not.toContain('Half and half');
  });
});

describe('spokenTutorName', () => {
  it('says Vía as Vee-ah in English only', () => {
    expect(spokenTutorName('Vía', 'en')).toBe('Vee-ah');
    expect(spokenTutorName('vía', 'en-US')).toBe('Vee-ah');
    expect(spokenTutorName('Vía', 'es')).toBe('Vía');
  });

  it('reads other names as typed', () => {
    expect(spokenTutorName('Ana', 'en')).toBe('Ana');
  });
});

describe('tutorMessage', () => {
  it('returns the fixed message for the tone', () => {
    expect(tutorMessage({ tone: 'direct' }, 'tryAgain')).toBe('Not quite. Try again.');
    expect(tutorMessage(undefined, 'greeting')).toBe(TUTOR_TONES.warm.messages.greeting);
  });
});

describe('fixed lines', () => {
  it('has a Spanish line for every English line', () => {
    expect(Object.keys(FIXED_LINES_ES).sort()).toEqual(Object.keys(fixedTutorLines()).sort());
  });
});
