import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { UNITS } from './course';
import { LESSON_PICTURES, PHOTO_SOURCES, pictureProblems, picturesFor } from './lessonPictures';
import { getNational } from './officeholders';

const dir = path.resolve(__dirname, '../../public/course-pictures');
const files = fs.readdirSync(dir);
const lessonIds = UNITS.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).map((l) => l.id)));

describe('lesson pictures (content/course/pictures.json)', () => {
  it('have no problems: real lessons, files that exist, public domain only, credits, captions', () => {
    expect(pictureProblems({ lessonIds, files })).toEqual([]);
  });

  it('every picture file is listed (no stray, uncredited files)', () => {
    expect(files.filter((f) => !f.startsWith('.')).sort()).toEqual(Object.keys(PHOTO_SOURCES).sort());
  });

  it('files are small enough for a phone (under 200 KB each)', () => {
    for (const f of files) expect(fs.statSync(path.join(dir, f)).size, f).toBeLessThan(200 * 1024);
  });

  it('catches a photo that is not public domain', () => {
    const data = { photos: { 'x.jpg': { license: 'CC BY-SA 4.0', source: 'https://example.test', credit: 'Someone' } }, lessons: {} };
    expect(pictureProblems({ lessonIds, files: ['x.jpg'], data, photos: {} })).toEqual(['x.jpg: license must be public domain (is "CC BY-SA 4.0")']);
  });

  it('lessons the owner asked for get their pictures', () => {
    for (const id of ['u2-s1-l1', 'u2-s2-l4', 'u2-s3-l3', 'u4-s1-l2', 'u6-s2-l1', 'u6-s4-l1', 'u6-s4-l4']) expect(LESSON_PICTURES[id]?.length, id).toBeGreaterThan(0);
  });
});

describe('officeholder portraits', () => {
  it('the name always comes from the official list', () => {
    const [speaker] = picturesFor('u2-s2-l10');
    expect(speaker.name).toBe(getNational().speaker.name);
    expect(speaker.src).toMatch(/^\/course-pictures\//);
  });

  it('a new officeholder never gets the old photo', () => {
    const national = { ...getNational(), speaker: { name: 'A. New Person' } };
    const [speaker] = picturesFor('u2-s2-l10', { national });
    expect(speaker.name).toBe('A. New Person');
    expect(speaker.src).toBeUndefined();
  });

  it('Today’s leaders shows the President and Vice President', () => {
    expect(picturesFor('u2-s3-l7').map((p) => p.office)).toEqual(['president', 'vicePresident']);
  });
});
