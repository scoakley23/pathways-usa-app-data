import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/pathways/ui';
import { videoEmbedUrl } from '@/lib/lessonVideo';

// The lesson's optional video (steps.listen.video, src/lib/lessonVideo.js),
// on the Listen step. Nothing loads until the learner taps Play: only then
// does the browser contact YouTube (youtube-nocookie.com). The video itself
// is in English; its title stays English.
export default function LessonVideo({ video, t }) {
  const [playing, setPlaying] = useState(false);
  const src = videoEmbedUrl(video);
  if (!src) return null;
  return (
    <section className="rounded-card bg-white border border-line p-5 flex flex-col gap-3" aria-labelledby="lesson-video-heading">
      <div className="flex items-start justify-between gap-3">
        <h2 id="lesson-video-heading" className="text-base font-bold text-navy">{t('video_heading')}</h2>
        {video.draft && <span className="shrink-0 rounded-button bg-tint px-3 py-1 text-small font-semibold text-navy">{t('video_draft')}</span>}
      </div>
      <p className="text-base text-navy" lang="en" dir="ltr">{video.title}</p>
      <p className="text-small text-muted">{t('video_from', { source: video.source })}</p>
      {playing ? (
        <div className="relative w-full aspect-video overflow-hidden rounded-card bg-navy">
          <iframe
            src={src}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <Button variant="second" className="w-full" onClick={() => setPlaying(true)}>
          <PlayCircle className="w-5 h-5 me-2" aria-hidden="true" />
          {t('video_play')}
        </Button>
      )}
      <p className="text-small text-muted">{t('video_note')}</p>
    </section>
  );
}
