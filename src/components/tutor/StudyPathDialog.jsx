import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, CheckCircle, AlertTriangle, Wand2 } from 'lucide-react';
import { toast } from "sonner";

const TOPICS = [
  'Principles of American Democracy',
  'System of Government',
  'Rights and Responsibilities',
  'U.S. History',
  'Geography and Symbols',
];

const TOPIC_COLORS = {
  'Principles of American Democracy': 'bg-pw-blue-soft text-pw-blue-ink',
  'System of Government': 'bg-pw-soft text-pw-navy',
  'Rights and Responsibilities': 'bg-pw-green-soft text-pw-green-ink',
  'U.S. History': 'bg-pw-highlight text-pw-navy',
  'Geography and Symbols': 'bg-pw-teal-soft text-pw-teal-ink',
};

export default function StudyPathDialog({ isOpen, onClose, student, tutorEmail }) {
  const [lessons, setLessons] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState('topic'); // 'topic' or 'lesson'

  useEffect(() => {
    if (isOpen) {
      loadLessons();
      // Pre-select weak topics
      if (student?.weakTopics?.length > 0) {
        setSelectedTopics(student.weakTopics.map(t => t.topic));
      } else {
        setSelectedTopics([]);
      }
      setSelectedLessons([]);
      setNote('');
    }
  }, [isOpen, student]);

  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const all = await base44.entities.Lesson.list('order', 200);
      setLessons(all);
    } catch (e) {
      toast.error('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const toggleLesson = (lessonId) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleAssign = async () => {
    const studentEmail = student.student_email;
    let lessonsToAssign = [];

    if (mode === 'topic') {
      if (selectedTopics.length === 0) { toast.error('Select at least one topic'); return; }
      lessonsToAssign = lessons.filter(l => selectedTopics.includes(l.topic));
    } else {
      if (selectedLessons.length === 0) { toast.error('Select at least one lesson'); return; }
      lessonsToAssign = lessons.filter(l => selectedLessons.includes(l.id));
    }

    if (lessonsToAssign.length === 0) { toast.error('No lessons found for the selected criteria'); return; }

    setIsAssigning(true);
    try {
      // Create custom assignments for each lesson
      const assignments = lessonsToAssign.map(lesson => ({
        tutor_email: tutorEmail,
        student_email: studentEmail,
        content_type: 'custom',
        custom_type: 'sentence',
        custom_content: `Study Path: ${lesson.title}`,
        custom_data: {
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          topic: lesson.topic,
          study_path: true,
          note: note || null,
        },
        status: 'pending',
        assigned_date: new Date().toISOString(),
      }));

      await base44.entities.Assignment.bulkCreate(assignments);

      // Notify student
      const topicList = [...new Set(lessonsToAssign.map(l => l.topic))].join(', ');
      await base44.entities.Notification.create({
        user_email: studentEmail,
        type: 'assignment',
        title: 'New Study Path Assigned',
        message: `Your tutor has assigned a study path covering: ${topicList}. ${note ? `Note: ${note}` : ''}`,
        link: '/Tutor',
      });

      toast.success(`Study path assigned: ${lessonsToAssign.length} lessons sent to ${student.student_email.split('@')[0]}`);
      onClose();
    } catch (e) {
      toast.error('Failed to assign study path');
    } finally {
      setIsAssigning(false);
    }
  };

  const lessonsByTopic = TOPICS.reduce((acc, topic) => {
    acc[topic] = lessons.filter(l => l.topic === topic);
    return acc;
  }, {});

  const totalSelected = mode === 'topic'
    ? lessons.filter(l => selectedTopics.includes(l.topic)).length
    : selectedLessons.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-pw-navy" aria-hidden="true" />
            Assign Study Path
          </DialogTitle>
          <p className="text-base text-pw-muted mt-1">
            For <span className="font-bold text-pw-navy">{student?.student_email?.split('@')[0]}</span>
          </p>
        </DialogHeader>

        {/* Weak topics hint */}
        {student?.weakTopics?.length > 0 && (
          <div className="flex items-start gap-2 bg-pw-red-soft rounded-2xl p-4 text-base">
            <AlertTriangle className="w-4 h-4 text-pw-red-ink shrink-0 mt-1" aria-hidden="true" />
            <div>
              <span className="font-bold text-pw-red-ink">Struggling areas pre-selected: </span>
              <span className="text-pw-navy">{student.weakTopics.map(t => `${t.topic} (${t.avg}%)`).join(', ')}</span>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex bg-white border border-pw-line rounded-2xl p-1 gap-1">
          <button
            onClick={() => setMode('topic')}
            aria-pressed={mode === 'topic'}
            className={`flex-1 min-h-[44px] rounded-xl text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${mode === 'topic' ? 'bg-pw-navy text-white' : 'text-pw-muted hover:bg-pw-soft'}`}
          >
            By Topic
          </button>
          <button
            onClick={() => setMode('lesson')}
            aria-pressed={mode === 'lesson'}
            className={`flex-1 min-h-[44px] rounded-xl text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${mode === 'lesson' ? 'bg-pw-navy text-white' : 'text-pw-muted hover:bg-pw-soft'}`}
          >
            Pick Lessons
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-pw-navy" /></div>
          ) : mode === 'topic' ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-pw-muted uppercase tracking-widest">Select topics to include in the study path</p>
              {TOPICS.map(topic => {
                const count = lessonsByTopic[topic]?.length || 0;
                const isSelected = selectedTopics.includes(topic);
                const isWeak = student?.weakTopics?.some(t => t.topic === topic);
                return (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    aria-pressed={isSelected}
                    className={`w-full min-h-[52px] flex items-center justify-between gap-2 p-3 rounded-2xl border-2 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${
                      isSelected
                        ? 'border-pw-navy bg-pw-soft'
                        : 'border-pw-line bg-white hover:border-pw-navy/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-pw-navy border-pw-navy' : 'border-pw-line'}`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-bold text-pw-navy text-base">{topic}</span>
                      {isWeak && <span className="text-sm px-2 py-0.5 bg-pw-red-soft text-pw-red-ink rounded-full font-bold">Weak</span>}
                    </div>
                    <span className="text-sm text-pw-muted shrink-0">{count} lesson{count !== 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-pw-muted uppercase tracking-widest">Select specific lessons</p>
              {TOPICS.map(topic => {
                const topicLessons = lessonsByTopic[topic] || [];
                if (topicLessons.length === 0) return null;
                return (
                  <div key={topic}>
                    <p className={`text-sm font-bold px-3 py-1 rounded-full inline-block mb-2 ${TOPIC_COLORS[topic] || 'bg-pw-soft text-pw-navy'}`}>
                      {topic}
                    </p>
                    <div className="space-y-1.5">
                      {topicLessons.map(lesson => {
                        const isSelected = selectedLessons.includes(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => toggleLesson(lesson.id)}
                            aria-pressed={isSelected}
                            className={`w-full min-h-[48px] flex items-center gap-3 p-3 rounded-2xl border-2 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${
                              isSelected ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy/40'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-pw-navy border-pw-navy' : 'border-pw-line'}`}>
                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-pw-navy font-semibold">{lesson.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Optional Note */}
          <div className="mt-2">
            <label htmlFor="study-path-note" className="text-sm font-bold text-pw-navy block mb-1">Optional Message to Student</label>
            <textarea
              id="study-path-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Focus on the dates in U.S. History before your interview next month..."
              className="w-full border-2 border-pw-line rounded-2xl p-3 text-base text-pw-navy placeholder:text-pw-muted/70 resize-none focus:outline-none focus:border-pw-navy focus-visible:ring-2 focus-visible:ring-pw-red/40"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-pw-line">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
            <p className="text-base text-pw-muted">
              {totalSelected > 0 ? (
                <span className="font-bold text-pw-navy">{totalSelected} lesson{totalSelected !== 1 ? 's' : ''} will be assigned</span>
              ) : (
                'No lessons selected'
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Cancel</Button>
              <Button
                onClick={handleAssign}
                disabled={isAssigning || totalSelected === 0}
                className="flex-1 sm:flex-none"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Assign Study Path
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}