import { describe, it, expect } from 'vitest';
import { videoFor, videoEmbedUrl, videoProblems, shownWords } from './lessonVideo';
import { UNITS } from './course';

const video = { youtubeId: 'hltv8-nzcUc', title: 'A video', source: 'Someone (YouTube)', license: 'Embed only', status: 'reviewed', checkedOn: '2026-11-26' };
const lesson = (v) => ({ steps: { listen: { newWords: [], video: v } } });

describe('lesson videos (steps.listen.video)', () => {
  it('shows learners only reviewed videos; drafts only with showDrafts, marked', () => {
    expect(videoFor(lesson(video))).toMatchObject({ youtubeId: 'hltv8-nzcUc', draft: false });
    const draft = { ...video, status: 'draft' };
    expect(videoFor(lesson(draft))).toBeNull();
    expect(videoFor(lesson(draft), { showDrafts: true })).toMatchObject({ draft: true });
    expect(videoFor(lesson(undefined), { showDrafts: true })).toBeNull();
  });

  it('plays only from youtube-nocookie.com, and only a real id', () => {
    expect(videoEmbedUrl(video)).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/hltv8-nzcUc\?/);
    expect(videoEmbedUrl({ youtubeId: 'x"><script>' })).toBeNull();
  });

  it('finds problems: id, missing source or license, a reviewed video without a date, unknown fields', () => {
    expect(videoProblems(video)).toEqual([]);
    expect(videoProblems(undefined)).toEqual([]);
    expect(videoProblems({ ...video, youtubeId: 'nope' }).join()).toMatch(/youtubeId/);
    expect(videoProblems({ ...video, license: '' }).join()).toMatch(/license/);
    expect(videoProblems({ ...video, checkedOn: undefined }).join()).toMatch(/checkedOn/);
    expect(videoProblems({ ...video, status: 'draft', checkedOn: undefined })).toEqual([]);
    expect(videoProblems({ ...video, url: 'https://…' }).join()).toMatch(/unknown fields: url/);
  });

  it('every video in the course is a YouTube embed with its source and license', () => {
    const videos = UNITS.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).map((l) => l.steps.listen.video).filter(Boolean)));
    expect(videos.length).toBeGreaterThan(0);
    for (const v of videos) expect(videoProblems(v)).toEqual([]);
  });
});

describe('new words with a status', () => {
  const listen = { newWords: [{ word: 'a', meaning: 'x' }, { word: 'b', meaning: 'y', status: 'draft' }, { word: 'c', meaning: 'z', status: 'reviewed' }] };
  it('hides draft words from learners and keeps each word’s index for its translation', () => {
    expect(shownWords(listen).map((w) => [w.word, w.index])).toEqual([['a', 0], ['c', 2]]);
    expect(shownWords(listen, { showDrafts: true }).map((w) => [w.word, w.index, w.draft])).toEqual([['a', 0, false], ['b', 1, true], ['c', 2, false]]);
  });
});
