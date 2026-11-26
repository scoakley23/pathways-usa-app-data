import React, { useEffect, useId, useState } from 'react';
import { ChevronDown, NotebookPen } from 'lucide-react';
import { Button } from '@/components/pathways/ui';
import { lessonNotes as lessonNotesApi } from '@/api/lessons';
import { olderNotesFor } from '@/lib/oldLessons';

export const NOTE_MAX_LENGTH = 2000;

// "My notes" on Lesson done: the learner's own notes for this Course lesson,
// saved to lesson_notes / LessonNotes under the Course lesson id. Only the
// learner can read them; they are never sent to the AI, and "Delete all my
// data" removes them. Notes written in the old Lessons tab stay under their
// old lesson ids and show here, read-only (the learner can delete them),
// under the Course lesson they point to (content/course/old-lessons.json).
export default function LessonNotes({ lesson, user, t }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState(null);
  const [text, setText] = useState('');
  const [older, setOlder] = useState([]);
  const [status, setStatus] = useState(null); // saving | saved | failed
  const panelId = useId();
  const fieldId = useId();

  useEffect(() => {
    if (!open || loaded || !user?.email) return undefined;
    let active = true;
    lessonNotesApi.list({ limit: 500 })
      .then((rows) => {
        if (!active) return;
        const mine = rows.find((r) => r.lesson_id === lesson.id) || null;
        setNote(mine);
        setText(mine?.content || '');
        setOlder(olderNotesFor(lesson.id, rows));
      })
      .catch(() => {})
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [open, loaded, user?.email, lesson.id]);

  if (!user?.email) return null;

  const save = async () => {
    const content = text.trim().slice(0, NOTE_MAX_LENGTH);
    if (!content && !note) return;
    setStatus('saving');
    try {
      if (note) {
        await lessonNotesApi.save(note, { content });
      } else {
        setNote(await lessonNotesApi.save(null, {
          user_email: user.email.toLowerCase().trim(),
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          lesson_topic: 'course',
          content,
        }));
      }
      setStatus('saved');
    } catch {
      setStatus('failed');
    }
  };

  const removeOlder = async (id) => {
    try {
      await lessonNotesApi.remove(id);
      setOlder((list) => list.filter((n) => n.id !== id));
    } catch {
      setStatus('failed');
    }
  };

  return (
    <section className="rounded-card bg-white border border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full min-h-tap flex items-center gap-3 px-4 py-3 text-start rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      >
        <NotebookPen className="w-5 h-5 shrink-0 text-navy" aria-hidden="true" />
        <span className="flex-1 text-base font-bold text-navy">{t('notes_title')}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-navy transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} className="px-4 pb-4 flex flex-col gap-3">
          <p className="text-small text-muted">{t('notes_private')}</p>
          {!loaded ? (
            <p className="text-base text-muted" role="status">{t('notes_loading')}</p>
          ) : (
            <>
              <label htmlFor={fieldId} className="text-base font-semibold text-navy">{t('notes_label')}</label>
              <textarea
                id={fieldId}
                value={text}
                maxLength={NOTE_MAX_LENGTH}
                rows={4}
                dir="auto"
                onChange={(e) => { setText(e.target.value); setStatus(null); }}
                className="w-full rounded-card border border-line bg-white px-3 py-2 text-base text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              />
              <Button variant="second" className="w-full" onClick={save} disabled={status === 'saving' || (!text.trim() && !note)}>
                {status === 'saving' ? t('notes_saving') : t('notes_save')}
              </Button>
              <p className="text-small text-muted min-h-[1.25rem]" role="status">
                {status === 'saved' && t('notes_saved')}
                {status === 'failed' && t('notes_failed')}
              </p>
              {older.map((n) => (
                <div key={n.id} className="rounded-card bg-paper border border-line p-3 flex flex-col gap-2">
                  <p className="text-small font-semibold text-muted">{t('notes_older', { title: n.title })}</p>
                  <p className="text-base text-navy whitespace-pre-wrap" dir="auto">{n.content}</p>
                  <Button variant="link" className="self-start" onClick={() => removeOlder(n.id)}>{t('notes_older_delete')}</Button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
