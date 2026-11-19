// The story player (Listen as a short "video"): one idea per scene, read
// aloud in the learner's language with captions, and a quick check every
// few scenes. Stories are reviewed course content (content/course/sections,
// a lesson's `steps.listen.story`), never AI-written live. A story has its
// own `storyStatus`: until it is "reviewed" learners keep the facts list;
// admins (and the dev switch) see draft stories, marked.
//
// A story item is either a scene { say, picture? } or { check }.
// picture: { drawing, focus? } (src/components/course/drawings.jsx; `focus`
// lights up one part), { photo } (a file listed in pictures.json) or
// { officeholder } (the name always from src/data/officeholders.json) or
// { senators: true } (the learner's two senators from the state saved in
// Who Represents Me?, names from the official list, photos from
// src/lib/senatorPhotos.js).
// check: { kind: 'tf', statement, answer: true|false } or
//        { kind: 'pick', prompt, choices: [3], answer: index }.
// Checks are practice only: no stars, nothing saved.
import { DRAWING_IDS, OFFICES, PHOTO_SOURCES } from '@/lib/lessonPictures';

export const MAX_SAY = 140; // characters: one or two short lines

/** The story the player shows for this lesson, or null (then the facts list). */
export function storyFor(lesson, { showDrafts = false } = {}) {
  const listen = lesson?.steps?.listen;
  if (!listen?.story?.length) return null;
  if (listen.storyStatus !== 'reviewed' && !showDrafts) return null;
  return { items: listen.story, draft: listen.storyStatus !== 'reviewed' };
}

/** A story picture as a lesson picture (src/lib/lessonPictures.js resolvePicture). */
export function storyPicture(picture) {
  if (!picture) return null;
  if (picture.drawing) return { kind: 'drawing', drawing: picture.drawing, focus: picture.focus || null };
  if (picture.photo) return { kind: 'photo', file: picture.photo, alt: '' };
  if (picture.officeholder) return { kind: 'officeholder', office: picture.officeholder };
  if (picture.senators) return { kind: 'senators' };
  return null;
}

/** Every English text in a story, for the translation pack. */
export function storyTexts(story = []) {
  return story.flatMap((item) => (item.check
    ? [item.check.statement, item.check.prompt, ...(item.check.choices || [])]
    : [item.say])).filter((t) => typeof t === 'string' && t.trim());
}

/**
 * Problems with the course's stories, as sentences ([] = all good).
 * `focusFor` = DRAWING_FOCUS (the parts each drawing can light up);
 * `officeholderNames` = names that must never be written into a story.
 */
export function storyProblems(units, { focusFor = {}, officeholderNames = [] } = {}) {
  const problems = [];
  const names = officeholderNames.filter(Boolean).map((n) => n.toLowerCase());
  for (const u of units) for (const s of u.sections) for (const l of s.lessons || []) {
    const listen = l.steps?.listen;
    if (!listen?.story) continue;
    const at = `${l.id}/story`;
    if (!['draft', 'reviewed'].includes(listen.storyStatus)) problems.push(`${at}: storyStatus must be draft or reviewed`);
    if (!Array.isArray(listen.story) || !listen.story.length) { problems.push(`${at}: empty`); continue; }
    let sinceCheck = 0;
    let scenes = 0;
    listen.story.forEach((item, i) => {
      const w = `${at}[${i}]`;
      const text = JSON.stringify(item).toLowerCase();
      for (const n of names) if (text.includes(n)) problems.push(`${w}: names a current officeholder`);
      if (item.check) {
        const c = item.check;
        sinceCheck = 0;
        if (c.kind === 'tf') {
          if (!c.statement) problems.push(`${w}: a true/false check needs a statement`);
          if (typeof c.answer !== 'boolean') problems.push(`${w}: a true/false answer is true or false`);
        } else if (c.kind === 'pick') {
          if (!c.prompt) problems.push(`${w}: a pick check needs a prompt`);
          if (c.choices?.length !== 3 || new Set(c.choices).size !== 3) problems.push(`${w}: needs 3 different choices`);
          if (!(c.answer >= 0 && c.answer < (c.choices?.length || 0))) problems.push(`${w}: answer must point to a choice`);
        } else problems.push(`${w}: unknown check "${c.kind}"`);
        return;
      }
      scenes++;
      sinceCheck++;
      if (sinceCheck > 3) problems.push(`${w}: a check is needed at least every 3 scenes`);
      if (!item.say || !item.say.trim()) problems.push(`${w}: a scene needs a line`);
      else if (item.say.length > MAX_SAY) problems.push(`${w}: the line is too long (${item.say.length} > ${MAX_SAY})`);
      const p = item.picture;
      if (p) {
        if (p.drawing) {
          if (!DRAWING_IDS.includes(p.drawing)) problems.push(`${w}: unknown drawing "${p.drawing}"`);
          if (p.focus && !(focusFor[p.drawing] || []).includes(p.focus)) problems.push(`${w}: ${p.drawing} has no part "${p.focus}"`);
        } else if (p.photo) {
          if (!PHOTO_SOURCES[p.photo]) problems.push(`${w}: ${p.photo} is not in pictures.json`);
        } else if (p.officeholder) {
          if (!OFFICES.includes(p.officeholder)) problems.push(`${w}: unknown office "${p.officeholder}"`);
        } else if (p.senators !== true) problems.push(`${w}: unknown picture`);
      }
    });
    if (scenes < 3) problems.push(`${at}: needs at least 3 scenes`);
    if (!listen.story.some((x) => x.check)) problems.push(`${at}: needs at least one check`);
  }
  return problems;
}
