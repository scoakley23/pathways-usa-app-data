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
  TUTOR_NAME,
  tutorProfileToSave,
} from './tutorPersona';

describe('normalizeTutorProfile', () => {
  it('fills defaults for a missing profile', () => {
    expect(normalizeTutorProfile(undefined)).toEqual(DEFAULT_TUTOR_PROFILE);
    expect(normalizeTutorProfile(null)).toEqual(DEFAULT_TUTOR_PROFILE);
  });

  it('the tutor is always Amio: any saved name is ignored', () => {
    expect(TUTOR_NAME).toBe('Amio');
    for (const name of ['Vía', 'vía', 'Ana', '', '   ', 'x'.repeat(40), undefined, 42]) {
      expect(normalizeTutorProfile({ name }).name).toBe('Amio');
    }
    expect(normalizeTutorProfile(undefined).name).toBe('Amio');
  });

  it('replaces unknown avatar, tone, and mix with defaults', () => {
    const p = normalizeTutorProfile({ avatar: 'zz', tone: 'angry', english_mix: 'all' });
    expect(p.avatar).toBe(DEFAULT_TUTOR_PROFILE.avatar);
    expect(p.tone).toBe(DEFAULT_TUTOR_PROFILE.tone);
    expect(p.english_mix).toBe(DEFAULT_TUTOR_PROFILE.english_mix);
  });
});

describe('old saved tutor profiles', () => {
  it('keeps the custom (device photo) avatar value', () => {
    expect(normalizeTutorProfile({ avatar: CUSTOM_AVATAR }).avatar).toBe(CUSTOM_AVATAR);
  });

  it('saving changes only the tone and English mix, and never saves a new name', () => {
    expect(tutorProfileToSave({ name: 'Amio', tone: 'coach', english_mix: 'half' }, null))
      .toEqual({ tone: 'coach', english_mix: 'half' });
    expect(tutorProfileToSave({ name: 'Amio', tone: 'direct', english_mix: 'bad' }, { name: 'Vía', avatar: 'a1', tone: 'warm', english_mix: 'half' }))
      .toEqual({ name: 'Vía', avatar: 'a1', tone: 'direct', english_mix: 'mostly_mine' });
    expect(tutorProfileToSave({ name: 'Somebody' }, { name: 'Ana' }).name).toBe('Ana');
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

  it('is always Amio, whatever name was saved (only the name changed)', () => {
    const first = 'You are Amio, a tutor in Pathways USA, a free app that helps adults prepare for the U.S. citizenship test (civics, reading, writing, and speaking English).';
    for (const name of ['Ana', ' ', 'Vía', undefined]) {
      const text = buildTutorInstructions({ name }, 'Spanish');
      expect(text.split('\n')[0]).toBe(first);
      expect(text).not.toMatch(/Ana|Vía/);
    }
  });

  it('includes the English mix only for non-English learners', () => {
    expect(buildTutorInstructions({ english_mix: 'half' }, 'Spanish')).toContain('Half and half');
    expect(buildTutorInstructions({ english_mix: 'half' }, 'English')).not.toContain('Half and half');
  });
});

describe('spokenTutorName', () => {
  it('reads Amio as written', () => {
    expect(spokenTutorName('Amio', 'en')).toBe('Amio');
    expect(spokenTutorName('Amio', 'es')).toBe('Amio');
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
