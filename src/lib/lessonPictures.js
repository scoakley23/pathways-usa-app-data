// Pictures for course lessons: public-domain photos and maps, the app's own
// drawings, and current officeholders' official portraits. Reviewed content,
// like the lessons: content/course/pictures.json lists them by lesson id.
//
// - photo: a file in public/course-pictures/ with its source, author and
//   license (public domain only), shown with a credit line.
// - drawing: one of DRAWING_IDS (inline SVG in src/components/course/drawings.jsx).
// - officeholder: the current President, Vice President, Speaker or Chief
//   Justice. The NAME always comes from src/data/officeholders.json; the
//   portrait (src/data/officeholderPhotos.json) shows only while its name
//   matches that list, so a new officeholder never gets the old photo.
// - audio: a recording in public/course-audio/ (public domain only, listed in
//   "audio" with its source), played only when the learner taps Play.
import pictures from '../../content/course/pictures.json';
import officeholderPhotos from '../data/officeholderPhotos.json';
import { getNational } from '@/lib/officeholders';

export const DRAWING_IDS = ['threeBranches', 'termLengths', 'congressNumbers', 'electoralCollege', 'supremeCourt', 'electorsMap', 'civilWarMap', 'warsTimeline', 'coldWar', 'billToLaw', 'seatsByPopulation', 'stateDistricts', 'greatCompromise', 'amendments', 'powerFromPeople', 'checksBalances', 'documentsToConstitution', 'sharedPower'];
export const OFFICES = ['president', 'vicePresident', 'speaker', 'chiefJustice'];
export const OFFICE_TITLES = {
  president: 'President of the United States',
  vicePresident: 'Vice President of the United States',
  speaker: 'Speaker of the House of Representatives',
  chiefJustice: 'Chief Justice of the United States',
};
export const PICTURE_DIR = '/course-pictures/';
export const AUDIO_DIR = '/course-audio/';

export const LESSON_PICTURES = pictures.lessons;
export const PHOTO_SOURCES = pictures.photos;
export const AUDIO_SOURCES = pictures.audio || {};

/** One picture, ready to show. Officeholders resolve to today's name. */
export function resolvePicture(p, { national = getNational(), photos = officeholderPhotos } = {}) {
  if (p.kind === 'photo') return { ...p, ...PHOTO_SOURCES[p.file], src: PICTURE_DIR + p.file };
  if (p.kind === 'audio') return { ...p, ...AUDIO_SOURCES[p.file], src: AUDIO_DIR + p.file };
  if (p.kind === 'officeholder') {
    const name = national?.[p.office]?.name || null;
    const photo = photos[p.office];
    const matches = name && photo && photo.name === name;
    return {
      ...p,
      name,
      title: OFFICE_TITLES[p.office],
      ...(matches ? { src: PICTURE_DIR + photo.file, ...PHOTO_SOURCES[photo.file] } : {}),
    };
  }
  return p;
}

/** A lesson's pictures, ready to show. Officeholders resolve to today's name. */
export function picturesFor(lessonId, opts = {}) {
  return (LESSON_PICTURES[lessonId] || []).map((p) => resolvePicture(p, opts));
}

/** Problems with the picture list, as sentences ([] = all good). */
export function pictureProblems({ lessonIds, files, audioFiles = [], data = pictures, photos = officeholderPhotos }) {
  const problems = [];
  const known = new Set(lessonIds);
  const sources = [...Object.entries(data.photos).map(([f, s]) => [f, s, files, 'public/course-pictures/']), ...Object.entries(data.audio || {}).map(([f, s]) => [f, s, audioFiles, 'public/course-audio/'])];
  for (const [file, src, present, dir] of sources) {
    if (!present.includes(file)) problems.push(`${file}: not in ${dir}`);
    if (!/public domain/i.test(src.license || '')) problems.push(`${file}: license must be public domain (is "${src.license}")`);
    for (const k of ['source', 'credit']) if (!src[k]) problems.push(`${file}: missing ${k}`);
  }
  for (const [lessonId, list] of Object.entries(data.lessons)) {
    if (!known.has(lessonId)) problems.push(`${lessonId}: no such lesson`);
    for (const p of list) {
      const at = `${lessonId}/${p.kind}`;
      if (p.kind === 'photo') {
        if (!data.photos[p.file]) problems.push(`${at}: ${p.file} is not in "photos"`);
        if (!p.alt || !p.caption) problems.push(`${at}: needs alt and caption`);
      } else if (p.kind === 'drawing') {
        if (!DRAWING_IDS.includes(p.drawing)) problems.push(`${at}: unknown drawing "${p.drawing}"`);
        if (!p.caption) problems.push(`${at}: needs a caption`);
      } else if (p.kind === 'audio') {
        if (!(data.audio || {})[p.file]) problems.push(`${at}: ${p.file} is not in "audio"`);
        if (!p.title || !p.caption) problems.push(`${at}: needs title and caption`);
      } else if (p.kind === 'officeholder') {
        if (!OFFICES.includes(p.office)) problems.push(`${at}: unknown office "${p.office}"`);
      } else problems.push(`${at}: unknown kind`);
    }
  }
  for (const [office, photo] of Object.entries(photos)) {
    if (!OFFICES.includes(office)) problems.push(`officeholderPhotos: unknown office "${office}"`);
    if (!data.photos[photo.file]) problems.push(`officeholderPhotos.${office}: ${photo.file} is not in "photos"`);
  }
  return problems;
}
