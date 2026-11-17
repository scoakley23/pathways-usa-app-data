import React from 'react';
import { picturesFor } from '@/lib/lessonPictures';
import { DRAWINGS } from '@/components/course/drawings';

// A lesson's pictures (src/lib/lessonPictures.js): public-domain photos and
// maps with a credit line, the app's own drawings, and officeholders' official
// portraits with today's name from the official list, and public-domain
// recordings (the anthem) that play only when tapped. Used by the lesson
// player's Listen step (Prompt 6). Captions are English content; the player
// translates them with the rest of the lesson.

function Credit({ p }) {
  if (!p.credit) return null;
  return (
    <span className="block text-small text-muted">
      {p.credit} ·{' '}
      <a href={p.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-navy">Public domain</a>
    </span>
  );
}

export function LessonPicture({ p, caption = p.caption }) {
  if (p.kind === 'drawing') {
    const Drawing = DRAWINGS[p.drawing];
    return (
      <figure className="m-0 rounded-card bg-white border border-line p-4">
        {Drawing && <Drawing />}
        <figcaption className="mt-3 text-base text-navy" dir="auto">{caption}</figcaption>
      </figure>
    );
  }
  if (p.kind === 'audio') {
    return (
      <figure className="m-0 rounded-card bg-white border border-line p-4 flex flex-col gap-3">
        <span className="text-lg font-bold text-navy">{p.title}</span>
        <audio
          controls
          preload="none"
          src={p.src}
          className="w-full min-h-tap"
          onPlay={() => { try { window.speechSynthesis?.cancel(); } catch { /* no read-aloud */ } }}
        >
          <a href={p.src}>{p.title}</a>
        </audio>
        <figcaption className="flex flex-col gap-1">
          <span className="text-base text-navy" dir="auto">{caption}</span>
          <Credit p={p} />
        </figcaption>
      </figure>
    );
  }
  if (p.kind === 'officeholder') {
    return (
      <figure className="m-0 flex items-center gap-4 rounded-card bg-white border border-line p-4">
        {p.src && <img src={p.src} alt={p.name ? `${p.name}, official portrait` : ''} loading="lazy" className="w-20 h-24 shrink-0 rounded-2xl object-cover bg-tint" />}
        <figcaption className="min-w-0">
          <span className="block text-small font-semibold uppercase tracking-wide text-muted">{p.title}</span>
          <span className="block text-lg font-bold text-navy break-words">{p.name || 'Not listed'}</span>
          <Credit p={p} />
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className="m-0 rounded-card bg-white border border-line overflow-hidden">
      <img src={p.src} alt={p.alt} loading="lazy" className="w-full h-auto max-h-80 object-contain bg-tint" />
      <figcaption className="p-4 flex flex-col gap-1">
        <span className="text-base text-navy" dir="auto">{caption}</span>
        <Credit p={p} />
      </figcaption>
    </figure>
  );
}

export default function LessonPictures({ lessonId, caption }) {
  const list = picturesFor(lessonId);
  if (!list.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {list.map((p, i) => <LessonPicture key={`${p.kind}-${p.file || p.drawing || p.office}-${i}`} p={p} caption={caption ? caption(p, i) : p.caption} />)}
    </div>
  );
}
