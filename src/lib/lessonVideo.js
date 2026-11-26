// A Course lesson's optional video (steps.listen.video): reviewed content,
// like the lesson itself. Format in content/course/README.md.
//
//   { "youtubeId": "hltv8-nzcUc", "title": "…", "source": "HISTORY (YouTube)",
//     "license": "…", "status": "draft" | "reviewed", "checkedOn": "2026-11-26" }
//
// Learners see only reviewed videos; admins (and the dev switch) also see
// drafts, marked. The video loads from youtube-nocookie.com only after the
// learner taps Play: nothing is sent to YouTube before that.

export const VIDEO_STATUSES = ['draft', 'reviewed'];
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The video to show for a lesson, or null. `{ ...video, draft }`. */
export function videoFor(lesson, { showDrafts = false } = {}) {
  const video = lesson?.steps?.listen?.video;
  if (!video?.youtubeId) return null;
  if (video.status !== 'reviewed' && !showDrafts) return null;
  return { ...video, draft: video.status !== 'reviewed' };
}

/** The embed address, loaded only after a tap (no autoplay before it). */
export function videoEmbedUrl(video) {
  if (!YOUTUBE_ID.test(video?.youtubeId || '')) return null;
  return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&cc_load_policy=1`;
}

/** Problems with one lesson's video, as plain sentences ([] = fine or none). */
export function videoProblems(video, at = 'video') {
  if (video == null) return [];
  const problems = [];
  if (!YOUTUBE_ID.test(video.youtubeId || '')) problems.push(`${at}: video.youtubeId must be an 11-character YouTube id`);
  for (const k of ['title', 'source', 'license']) if (!String(video[k] || '').trim()) problems.push(`${at}: video.${k} is missing`);
  if (!VIDEO_STATUSES.includes(video.status)) problems.push(`${at}: video.status must be "draft" or "reviewed"`);
  if (video.status === 'reviewed' && !DAY.test(video.checkedOn || '')) problems.push(`${at}: a reviewed video needs checkedOn (YYYY-MM-DD)`);
  const extra = Object.keys(video).filter((k) => !['youtubeId', 'title', 'source', 'license', 'status', 'checkedOn', 'note'].includes(k));
  if (extra.length) problems.push(`${at}: video has unknown fields: ${extra.join(', ')}`);
  return problems;
}

/**
 * The new words to show, each with its index in the full list (the index
 * keys the translation). A word with `"status": "draft"` shows only with
 * showDrafts; a word with no status is reviewed with its lesson.
 */
export function shownWords(listen, { showDrafts = false } = {}) {
  return (listen?.newWords || [])
    .map((w, i) => ({ ...w, index: i, draft: w.status === 'draft' }))
    .filter((w) => !w.draft || showDrafts);
}
