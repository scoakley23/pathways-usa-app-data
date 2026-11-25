import { describe, it, expect } from 'vitest';
import { languageFromPhone } from './welcomeLanguage';

const packs = new Set(['es', 'ar', 'zh', 'prs', 'fa']);
const packFor = (c) => packs.has(c);

describe('languageFromPhone', () => {
  it('picks the first phone language that has a pack', () => {
    expect(languageFromPhone(['es-MX', 'en-US'], { packFor })).toBe('es');
    expect(languageFromPhone(['ar'], { packFor })).toBe('ar');
    expect(languageFromPhone(['zh-CN'], { packFor })).toBe('zh');
  });
  it('stops at English when English comes first', () => {
    expect(languageFromPhone(['en-US', 'es'], { packFor })).toBe('en');
  });
  it('skips languages without a pack and falls back to English', () => {
    expect(languageFromPhone(['xx-YY', 'es'], { packFor })).toBe('es');
    expect(languageFromPhone(['de-DE'], { packFor })).toBe('en');
    expect(languageFromPhone([], { packFor })).toBe('en');
  });
  it('reads fa-AF as Dari', () => {
    expect(languageFromPhone(['fa-AF'], { packFor })).toBe('prs');
  });
});
