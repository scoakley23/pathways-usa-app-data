import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import officeholders from '../data/officeholders.json';
import { SENATOR_PHOTOS, senatorsFor } from './senatorPhotos';

const dir = path.resolve(__dirname, '../../public/senator-photos');
const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
const listed = Object.values(SENATOR_PHOTOS.photos).flat();

describe('senator photos (src/data/senatorPhotos.json)', () => {
  it('every photo is a file, and every file is listed (no strays)', () => {
    expect(files.sort()).toEqual(listed.map((p) => p.file).sort());
  });

  it('small enough for a phone (under 30 KB each)', () => {
    for (const f of files) expect(fs.statSync(path.join(dir, f)).size, f).toBeLessThan(30 * 1024);
  });

  it('every name is copied from the official list, in the right state', () => {
    for (const [state, list] of Object.entries(SENATOR_PHOTOS.photos)) {
      const names = (officeholders.places[state]?.senators || []).map((s) => s.name);
      for (const p of list) expect(names, `${state}: ${p.name}`).toContain(p.name);
    }
  });

  it('shows the learner\'s two senators, names from the official list', () => {
    const two = senatorsFor({ state: 'California' });
    expect(two.map((s) => s.name)).toEqual(officeholders.places.California.senators.map((s) => s.name));
    expect(two.every((s) => s.src?.startsWith('/senator-photos/'))).toBe(true);
  });

  it('a new senator never gets the old photo', () => {
    const officials = () => ({ place: 'California', senators: [{ name: 'A. New Person' }, { name: officeholders.places.California.senators[1].name }] });
    const two = senatorsFor({ state: 'CA' }, { officials });
    expect(two[0]).toEqual({ name: 'A. New Person' });
    expect(two[1].src).toBeTruthy();
  });

  it('nothing without a saved state, or for a place without senators', () => {
    expect(senatorsFor(null)).toEqual([]);
    expect(senatorsFor({ state: 'District of Columbia' })).toEqual([]);
  });
});
