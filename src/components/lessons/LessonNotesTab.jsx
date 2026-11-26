import React, { useState, useEffect, useRef } from 'react';
import { lessonNotes as lessonNotesApi } from '@/api/lessons';
import { Save, Loader2, CheckCircle } from 'lucide-react';
import { toast } from "sonner";
import { Button } from '@/components/pathways/ui';
import useDeckText from './useDeckText';

// The learner's notes for a lesson (Amio v2: a white card). Saved
// to LessonNotes, which only the learner can read; never sent to the AI.
// Amio's line here is a fixed tip, not a reply to what they wrote.
export default function LessonNotesTab({ lesson, userEmail }) {
  const { t } = useDeckText();
  const [content, setContent] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    if (!userEmail || !lesson?.id) return;
    const load = async () => {
      try {
        const existing = await lessonNotesApi.list({ lessonId: lesson.id, limit: 1 });
        if (existing.length > 0) {
          setContent(existing[0].content || '');
          setNoteId(existing[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lesson?.id, userEmail]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => saveNote(val), 2000);
  };

  const saveNote = async (contentToSave = content) => {
    if (!userEmail || !lesson?.id) return;
    const trimmed = (contentToSave || '').trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      const payload = {
        user_email: userEmail.toLowerCase().trim(),
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        lesson_topic: lesson.topic,
        content: trimmed
      };

      if (noteId) {
        await lessonNotesApi.save({ id: noteId }, { content: trimmed });
      } else {
        const created = await lessonNotesApi.save(null, payload);
        setNoteId(created.id);
      }
      setLastSaved(new Date());
    } catch (e) {
      toast.error(t('notes_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-6 h-6 animate-spin text-navy" aria-hidden="true" />
    </div>
  );

  return (
    <div className="rounded-card bg-white border-[1.5px] border-line p-4 text-navy">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <label htmlFor="lesson-notes" className="text-lg font-bold" dir="auto">
          {t('notes_title')}
        </label>
        <span className="flex items-center gap-2" aria-live="polite">
          {isSaving && <span className="text-sm font-semibold text-muted flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('notes_saving')}</span>}
          {!isSaving && lastSaved && <span className="text-sm font-semibold text-navy flex items-center gap-1"><CheckCircle className="w-4 h-4 text-correct" aria-hidden="true" /> {t('notes_saved')}</span>}
        </span>
      </div>
      <textarea
        id="lesson-notes"
        value={content}
        onChange={handleChange}
        placeholder={t('notes_placeholder')}
        rows={6}
        dir="auto"
        className="block w-full resize-y rounded-button border border-line bg-paper p-3 text-lg leading-relaxed text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-denim"
      />
      <p className="mt-2 text-base text-muted" dir="auto">{t('notes_tip')}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-small text-muted" dir="auto">{t('notes_only_you')}</span>
        <Button variant="second" onClick={() => saveNote()} disabled={isSaving}>
          <Save className="w-4 h-4" aria-hidden="true" /> {t('notes_save')}
        </Button>
      </div>
    </div>
  );
}
