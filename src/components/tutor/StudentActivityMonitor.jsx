import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { RaisedCard } from '@/components/pathways/ui';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, AlertTriangle, BookOpen, TrendingUp, TrendingDown, Loader2, Users, Star, Target } from 'lucide-react';
import { toast } from "sonner";
import StudyPathDialog from './StudyPathDialog';

const TOPIC_COLORS = {
  'Principles of American Democracy': 'bg-pw-blue-soft text-pw-blue-ink',
  'System of Government': 'bg-pw-soft text-pw-navy',
  'Rights and Responsibilities': 'bg-pw-green-soft text-pw-green-ink',
  'U.S. History': 'bg-pw-highlight text-pw-navy',
  'Geography and Symbols': 'bg-pw-teal-soft text-pw-teal-ink',
};

export default function StudentActivityMonitor({ currentUserEmail, students }) {
  const [lessonProgress, setLessonProgress] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [n400Progress, setN400Progress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudyPathOpen, setIsStudyPathOpen] = useState(false);

  const activeStudents = students.filter(s => s.status === 'active');

  useEffect(() => {
    if (activeStudents.length > 0) loadData();
    else setIsLoading(false);
  }, [students]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const emails = activeStudents.map(s => s.student_email);
      // Fetch lesson progress for all students
      const allProgress = await Promise.all(
        emails.map(email =>
          base44.entities.LessonProgress.filter({ user_email: email }, null, 200)
        )
      );
      const flatProgress = allProgress.flat();
      setLessonProgress(flatProgress);

      // Fetch UserProgress (civics/sentence/vocab practice)
      const allUserProgress = await Promise.all(
        emails.map(email =>
          base44.entities.UserProgress.filter({ user_email: email }, null, 200)
        )
      );
      setUserProgress(allUserProgress.flat());

      // Fetch N-400 guide section completion (section level only)
      const allN400 = await Promise.all(
        emails.map(email =>
          base44.entities.N400SectionProgress.filter({ user_email: email }, null, 200)
        )
      );
      setN400Progress(allN400.flat());
    } catch (e) {
      toast.error('Failed to load student activity');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Leaderboard ---
  const leaderboard = useMemo(() => {
    return activeStudents.map(s => {
      const sProgress = lessonProgress.filter(p => p.user_email === s.student_email);
      const quizzed = sProgress.filter(p => p.quiz_attempts > 0);
      const avgScore = quizzed.length > 0
        ? Math.round(quizzed.reduce((acc, p) => acc + (p.best_score || 0), 0) / quizzed.length)
        : null;
      const completed = sProgress.filter(p => p.completed).length;
      const masteredPractice = userProgress.filter(p => p.user_email === s.student_email && p.status === 'mastered').length;
      const n400Sections = n400Progress.filter(p => p.user_email === s.student_email && p.completed).length;
      return {
        email: s.student_email,
        name: s.student_email.split('@')[0],
        avgScore,
        lessonsCompleted: completed,
        n400Sections,
        quizzesTaken: quizzed.length,
        masteredItems: masteredPractice,
        totalPoints: (completed * 10) + (quizzed.length * 5) + (masteredPractice * 3) + (avgScore || 0),
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [activeStudents, lessonProgress, userProgress, n400Progress]);

  // --- Struggling Students ---
  const strugglingStudents = useMemo(() => {
    return activeStudents.map(s => {
      const sProgress = lessonProgress.filter(p => p.user_email === s.student_email);
      
      // Find weak topics (avg score < 60)
      const topicScores = {};
      sProgress.filter(p => p.quiz_attempts > 0).forEach(p => {
        if (!topicScores[p.topic]) topicScores[p.topic] = [];
        topicScores[p.topic].push(p.best_score || 0);
      });

      const weakTopics = Object.entries(topicScores)
        .map(([topic, scores]) => ({
          topic,
          avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        }))
        .filter(t => t.avg < 60)
        .sort((a, b) => a.avg - b.avg);

      // Flag students with zero activity or weak scores
      const noActivity = sProgress.length === 0;
      const needsReviewCount = sProgress.filter(p => p.needs_review).length;

      return {
        email: s.student_email,
        name: s.student_email.split('@')[0],
        weakTopics,
        noActivity,
        needsReviewCount,
        isStruggling: noActivity || weakTopics.length > 0 || needsReviewCount >= 2,
      };
    }).filter(s => s.isStruggling);
  }, [activeStudents, lessonProgress]);

  const handleAssignStudyPath = (studentEmail) => {
    const student = activeStudents.find(s => s.student_email === studentEmail);
    const struggling = strugglingStudents.find(s => s.email === studentEmail);
    setSelectedStudent({ ...student, weakTopics: struggling?.weakTopics || [] });
    setIsStudyPathOpen(true);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-pw-navy" />
    </div>
  );

  if (activeStudents.length === 0) return (
    <div className="text-center py-12 px-5 text-pw-muted bg-white rounded-3xl border border-dashed border-pw-line">
      <Users className="w-12 h-12 mx-auto mb-3 text-pw-muted opacity-50" aria-hidden="true" />
      <p className="font-bold text-lg text-pw-navy">No active students yet.</p>
      <p className="text-base mt-1">Add students and they'll appear here once they're active.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryTile icon={Users} tone="bg-pw-blue-soft text-pw-blue-ink" value={activeStudents.length} label="Active Students" />
        <SummaryTile icon={AlertTriangle} tone="bg-pw-red-soft text-pw-red-ink" value={strugglingStudents.length} label="Need Attention" />
        <SummaryTile
          icon={Star}
          tone="bg-pw-green-soft text-pw-green-ink"
          value={leaderboard[0]?.avgScore != null ? `${leaderboard[0].avgScore}%` : '—'}
          label="Top Quiz Score"
        />
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="leaderboard" className="flex-col sm:flex-row gap-1 sm:gap-1.5 px-1 text-sm sm:text-base"><Trophy className="w-4 h-4" aria-hidden="true" />Leaderboard</TabsTrigger>
          <TabsTrigger value="struggling" className="flex-col sm:flex-row gap-1 sm:gap-1.5 px-1 text-sm sm:text-base">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            <span className="inline-flex items-center gap-1">
              Struggling
              {strugglingStudents.length > 0 && (
                <span className="px-1.5 py-0.5 bg-pw-red text-white text-xs rounded-full leading-none">{strugglingStudents.length}</span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="studypaths" className="flex-col sm:flex-row gap-1 sm:gap-1.5 px-1 text-sm sm:text-base"><BookOpen className="w-4 h-4" aria-hidden="true" />Study Paths</TabsTrigger>
        </TabsList>

        {/* LEADERBOARD TAB */}
        <TabsContent value="leaderboard" className="mt-4 space-y-3">
          {leaderboard.map((student, idx) => (
            <LeaderboardRow key={student.email} student={student} rank={idx + 1} />
          ))}
        </TabsContent>

        {/* STRUGGLING TAB */}
        <TabsContent value="struggling" className="mt-4 space-y-4">
          {strugglingStudents.length === 0 ? (
            <div className="text-center py-12 px-5 text-pw-muted bg-white rounded-3xl border border-dashed border-pw-line">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 text-pw-green-ink" aria-hidden="true" />
              <p className="font-bold text-base text-pw-navy">All students are performing well!</p>
            </div>
          ) : (
            strugglingStudents.map(student => (
              <StrugglingCard
                key={student.email}
                student={student}
                onAssign={() => handleAssignStudyPath(student.email)}
              />
            ))
          )}
        </TabsContent>

        {/* STUDY PATHS TAB */}
        <TabsContent value="studypaths" className="mt-4 space-y-3">
          <p className="text-base text-pw-muted mb-4">Select a student to assign a customized study path focused on specific topics.</p>
          {leaderboard.map(student => {
            const struggling = strugglingStudents.find(s => s.email === student.email);
            return (
              <RaisedCard key={student.email} padding="p-4" className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Initial name={student.name} />
                    <div className="min-w-0">
                      <p className="font-bold text-pw-navy">{student.name}</p>
                      <p className="text-sm text-pw-muted truncate">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {struggling && (
                      <div className="hidden sm:flex flex-wrap gap-1 max-w-xs">
                        {struggling.weakTopics.slice(0, 2).map(t => (
                          <span key={t.topic} className={`text-sm px-3 py-1 rounded-full font-bold ${TOPIC_COLORS[t.topic] || 'bg-pw-soft text-pw-navy'}`}>
                            {t.topic.split(' ').slice(0, 2).join(' ')} · {t.avg}%
                          </span>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleAssignStudyPath(student.email)}
                      className="shrink-0 w-full sm:w-auto"
                    >
                      <Target className="w-4 h-4" /> Assign Path
                    </Button>
                  </div>
              </RaisedCard>
            );
          })}
        </TabsContent>
      </Tabs>

      {selectedStudent && (
        <StudyPathDialog
          isOpen={isStudyPathOpen}
          onClose={() => setIsStudyPathOpen(false)}
          student={selectedStudent}
          tutorEmail={currentUserEmail}
        />
      )}
    </div>
  );
}

function SummaryTile({ icon: Icon, tone, value, label }) {
  return (
    <RaisedCard padding="p-3 sm:p-4" className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${tone}`} aria-hidden="true">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-pw-navy leading-tight">{value}</p>
        <p className="text-sm text-pw-muted font-bold leading-tight">{label}</p>
      </div>
    </RaisedCard>
  );
}

function Initial({ name, tone = 'bg-pw-navy text-white' }) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${tone}`} aria-hidden="true">
      {name[0].toUpperCase()}
    </div>
  );
}

function LeaderboardRow({ student, rank }) {

  const scoreColor = (s) => {
    if (s == null) return 'text-pw-muted';
    return s >= 80 ? 'text-pw-green-ink' : s >= 60 ? 'text-pw-navy' : 'text-pw-red-ink';
  };

  return (
    <RaisedCard padding="p-4" className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${rank <= 3 ? 'border-pw-navy/40' : ''}`}>
        <div className="w-8 text-center shrink-0">
          {rank <= 3 ? <Star className="w-6 h-6 mx-auto text-pw-red" aria-label={`#${rank}`} /> : <span className="text-lg font-extrabold text-pw-muted">#{rank}</span>}
        </div>
        <Initial name={student.name} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-pw-navy">{student.name}</p>
          <p className="text-sm text-pw-muted truncate">{student.email}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center w-full sm:w-auto shrink-0 rounded-2xl bg-pw-soft sm:bg-transparent py-2 sm:py-0">
          <div>
            <p className={`font-extrabold text-lg ${scoreColor(student.avgScore)}`}>
              {student.avgScore != null ? `${student.avgScore}%` : '—'}
            </p>
            <p className="text-sm text-pw-muted">Avg Score</p>
          </div>
          <div>
            <p className="font-extrabold text-lg text-pw-navy">{student.lessonsCompleted}</p>
            <p className="text-sm text-pw-muted">Lessons</p>
          </div>
          <div>
            <p className="font-extrabold text-lg text-pw-navy">{student.n400Sections}</p>
            <p className="text-sm text-pw-muted">N-400</p>
          </div>
          <div>
            <p className="font-extrabold text-lg text-pw-navy">{student.totalPoints}</p>
            <p className="text-sm text-pw-muted">Points</p>
          </div>
        </div>
    </RaisedCard>
  );
}

function StrugglingCard({ student, onAssign }) {
  return (
    <RaisedCard className="border-pw-red/30">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Initial name={student.name} tone="bg-pw-red-soft text-pw-red-ink" />
            <div className="min-w-0">
              <p className="font-bold text-pw-navy">{student.name}</p>
              <p className="text-sm text-pw-muted truncate">{student.email}</p>
            </div>
          </div>
          <Button size="sm" onClick={onAssign} className="shrink-0 w-full sm:w-auto">
            <BookOpen className="w-4 h-4" /> Assign Study Path
          </Button>
        </div>

        <div className="space-y-2">
          {student.noActivity && (
            <div className="flex items-center gap-2 text-base text-pw-red-ink bg-pw-red-soft px-4 py-3 rounded-2xl">
              <TrendingDown className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>No lesson activity recorded yet</span>
            </div>
          )}
          {student.needsReviewCount > 0 && (
            <div className="flex items-center gap-2 text-base text-pw-red-ink bg-pw-red-soft px-4 py-3 rounded-2xl">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{student.needsReviewCount} lesson{student.needsReviewCount > 1 ? 's' : ''} flagged for review</span>
            </div>
          )}
          {student.weakTopics.length > 0 && (
            <div className="bg-pw-soft px-4 py-3 rounded-2xl">
              <p className="text-xs font-bold text-pw-muted uppercase tracking-widest mb-2">Weak Topics</p>
              <div className="flex flex-wrap gap-2">
                {student.weakTopics.map(t => (
                  <div key={t.topic} className="flex items-center gap-1.5">
                    <span className={`text-sm px-3 py-1 rounded-full font-bold ${TOPIC_COLORS[t.topic] || 'bg-white text-pw-navy'}`}>
                      {t.topic}
                    </span>
                    <span className="text-sm font-extrabold text-pw-red-ink">{t.avg}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
    </RaisedCard>
  );
}