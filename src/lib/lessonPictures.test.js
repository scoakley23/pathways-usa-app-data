import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { UNITS } from './course';
import { AUDIO_SOURCES, LESSON_PICTURES, PHOTO_SOURCES, pictureProblems, picturesFor } from './lessonPictures';
import { CIVIL_WAR_SIDES, ELECTORS, STATE_TILES, WARS_1900S } from '../components/course/drawings';
import { getNational } from './officeholders';

const dir = path.resolve(__dirname, '../../public/course-pictures');
const files = fs.readdirSync(dir);
const audioDir = path.resolve(__dirname, '../../public/course-audio');
const audioFiles = fs.readdirSync(audioDir);
const lessonIds = UNITS.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).map((l) => l.id)));

describe('lesson pictures (content/course/pictures.json)', () => {
  it('have no problems: real lessons, files that exist, public domain only, credits, captions', () => {
    expect(pictureProblems({ lessonIds, files, audioFiles })).toEqual([]);
  });

  it('every picture file is listed (no stray, uncredited files)', () => {
    expect(files.filter((f) => !f.startsWith('.')).sort()).toEqual(Object.keys(PHOTO_SOURCES).sort());
  });

  it('files are small enough for a phone (pictures under 200 KB, recordings under 1 MB)', () => {
    for (const f of files) expect(fs.statSync(path.join(dir, f)).size, f).toBeLessThan(200 * 1024);
    for (const f of audioFiles) expect(fs.statSync(path.join(audioDir, f)).size, f).toBeLessThan(1024 * 1024);
  });

  it('every recording is listed with its source (no stray files)', () => {
    expect(audioFiles.filter((f) => !f.startsWith('.')).sort()).toEqual(Object.keys(AUDIO_SOURCES).sort());
  });

  it('round 2 review: the eight lessons get their new pictures and the anthem', () => {
    const kinds = (id) => LESSON_PICTURES[id].map((p) => p.drawing || p.file);
    expect(kinds('u2-s3-l3')).toContain('electorsMap');
    expect(kinds('u4-s1-l1')).toEqual(['navajo-woman.jpg', 'hopi-man.jpg', 'columbus.jpg']);
    expect(kinds('u5-s1-l1')).toEqual(['louisiana-purchase.jpg']);
    expect(kinds('u5-s2-l2')).toEqual(['civilWarMap']);
    expect(kinds('u5-s2-l3')).toEqual(['lincoln.jpg']);
    expect(kinds('u6-s1-l1')).toEqual(['warsTimeline']);
    expect(kinds('u6-s3-l1')).toEqual(['coldWar']);
    const [anthem] = picturesFor('u7-s1-l2');
    expect(anthem).toMatchObject({ kind: 'audio', src: '/course-audio/star-spangled-banner.mp3', license: 'Public domain' });
  });

  it('catches a recording that is not public domain or not listed', () => {
    const data = { photos: {}, audio: { 'x.mp3': { license: 'CC BY 4.0', source: 'https://example.test', credit: 'Someone' } }, lessons: {} };
    expect(pictureProblems({ lessonIds, files: [], audioFiles: [], data, photos: {} })).toEqual(['x.mp3: not in public/course-audio/', 'x.mp3: license must be public domain (is "CC BY 4.0")']);
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

describe('drawing data', () => {
  it('the tile map has every state and D.C. once, each on its own square', () => {
    expect(Object.keys(STATE_TILES)).toHaveLength(51);
    expect(new Set(Object.values(STATE_TILES).map((xy) => xy.join(','))).size).toBe(51);
  });

  it('electors add up to 538, 3 or more each', () => {
    expect(Object.keys(ELECTORS).sort()).toEqual(Object.keys(STATE_TILES).sort());
    expect(Object.values(ELECTORS).reduce((a, b) => a + b, 0)).toBe(538);
    expect(Math.min(...Object.values(ELECTORS))).toBe(3);
  });

  it('the Civil War map has 11 Confederate states and no state on two sides', () => {
    const { union, confederacy, border } = CIVIL_WAR_SIDES;
    expect(confederacy).toHaveLength(11);
    const all = [...union, ...confederacy, ...border];
    expect(new Set(all).size).toBe(all.length);
    for (const c of all) expect(STATE_TILES[c], c).toBeTruthy();
  });

  it('the timeline has the five wars of the 1900s, in order', () => {
    expect(WARS_1900S.map((w) => w.name)).toEqual(['World War I', 'World War II', 'Korean War', 'Vietnam War', 'Persian Gulf War']);
    for (const w of WARS_1900S) expect(w.from >= 1900 && w.to < 2000 && w.from <= w.to).toBe(true);
  });
});
