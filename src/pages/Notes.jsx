import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Trash2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { toast } from "sonner";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const data = await base44.entities.LessonNotes.filter(
          { user_email: currentUser.email.toLowerCase().trim() },
          '-updated_date',
          200
        );
        setNotes(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    await base44.entities.LessonNotes.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Note deleted');
  };

  const filtered = notes.filter(n => {
    const q = searchQuery.toLowerCase();
    return (
      (n.lesson_title || '').toLowerCase().includes(q) ||
      (n.lesson_topic || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce((acc, note) => {
    const topic = note.lesson_topic || 'Uncategorized';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(note);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center p-16">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Notes</h1>
          <p className="text-sm text-slate-500">{notes.length} note{notes.length !== 1 ? 's' : ''} saved across all lessons</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search notes by lesson, topic, or content..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            {notes.length === 0
              ? 'No notes yet. Open a lesson and start writing!'
              : 'No notes match your search.'}
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([topic, topicNotes]) => (
          <div key={topic} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
              {topic}
            </h2>
            {topicNotes.map(note => (
              <Card key={note.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{note.lesson_title || 'Untitled Lesson'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(note.updated_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{topic}</Badge>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-500"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-slate-400"
                        onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                      >
                        {expandedId === note.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedId === note.id && (
                  <CardContent className="px-5 pb-5">
                    <div
                      className="prose prose-sm prose-slate max-w-none border border-slate-100 rounded-lg p-4 bg-slate-50"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  );
}