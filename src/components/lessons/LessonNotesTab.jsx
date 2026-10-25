import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Loader2, CheckCircle } from 'lucide-react';
import { toast } from "sonner";
import { PillButton, RuledPaper } from '@/components/pathways/ui';

// The learner's notes for a lesson, on ruled paper (their own page). Saved
// to LessonNotes, which only the learner can read; never sent to the AI.
// Vía's line here is a fixed tip, not a reply to what they wrote.
export default function LessonNotesTab({ lesson, userEmail, tutorName = 'Vía' }) {
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
        const existing = await base44.entities.LessonNotes.filter(
          { user_email: userEmail.toLowerCase().trim(), lesson_id: lesson.id },
          null, 1
        );
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
        await base44.entities.LessonNotes.update(noteId, { content: trimmed });
      } else {
        const created = await base44.entities.LessonNotes.create(payload);
        setNoteId(created.id);
      }
      setLastSaved(new Date());
    } catch (e) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-6 h-6 animate-spin text-pw-navy" />
    </div>
  );

  return (
    <RuledPaper className="pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label htmlFor="lesson-notes" className="text-[13px] font-semibold uppercase tracking-[0.14em] leading-[36px] text-pw-muted">
          My notes
        </label>
        <span className="flex items-center gap-2" aria-live="polite">
          {isSaving && <span className="text-sm font-semibold text-pw-muted flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Saving…</span>}
          {!isSaving && lastSaved && <span className="text-sm font-semibold text-pw-writing flex items-center gap-1"><CheckCircle className="w-4 h-4" aria-hidden="true" /> Saved</span>}
        </span>
      </div>
      <textarea
        id="lesson-notes"
        value={content}
        onChange={handleChange}
        placeholder="Write it in your own words…"
        rows={7}
        className="block w-full resize-y bg-transparent text-[19px] leading-[36px] text-pw-navy placeholder:text-pw-muted focus:outline-none"
      />
      <p className="mt-1 -rotate-1 font-hand font-semibold text-[23px] leading-tight text-pw-civics">Your own words help you remember. — {tutorName}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[15px] text-pw-muted">Only you see these.</span>
        <PillButton onClick={() => saveNote()} disabled={isSaving}>
          <Save className="w-4 h-4" aria-hidden="true" /> Save
        </PillButton>
      </div>
    </RuledPaper>
  );
}
