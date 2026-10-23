import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from '@/components/pathways/ui';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from "sonner";
import { getStudentProgress } from '@/lib/tutorLinks';

export default function StudentProgressReport({ isOpen, onClose, studentEmail }) {
  const [progress, setProgress] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPracticed: 0,
    mastered: 0,
    weaknesses: [],
    strengths: []
  });
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedAssignmentForFeedback, setSelectedAssignmentForFeedback] = useState(null);

  useEffect(() => {
    if (isOpen && studentEmail) {
      fetchReport();
    }
  }, [isOpen, studentEmail]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      // Fetch UserProgress (only returned when this tutor has an active link)
      const byStudent = await getStudentProgress([studentEmail]);
      const studentProgress = byStudent[studentEmail.toLowerCase().trim()]?.userProgress || [];
      
      // Fetch Assignments
      const studentAssignments = await base44.entities.Assignment.filter({ student_email: studentEmail }, '-assigned_date', 500);

      // Get content details to enrich progress
      // Optimization: In a real app, we'd query specific IDs, but here we list all for simplicity
      const [sentences, vocab, questions] = await Promise.all([
        base44.entities.Sentence.list(),
        base44.entities.VocabularyWord.list(),
        base44.entities.CivicsQuestion.list()
      ]);

      const contentMap = {
        sentence: sentences.reduce((acc, i) => ({...acc, [i.id]: i}), {}),
        vocabulary: vocab.reduce((acc, i) => ({...acc, [i.id]: i}), {}),
        civics_question: questions.reduce((acc, i) => ({...acc, [i.id]: i}), {})
      };

      const enrichedProgress = studentProgress.map(p => ({
        ...p,
        content: contentMap[p.content_type || 'sentence']?.[p.content_id] || { text: 'Unknown Content' }
      }));

      setProgress(enrichedProgress);
      setAssignments(studentAssignments);

      // Calculate Stats
      const mastered = enrichedProgress.filter(p => p.status === 'mastered');
      
      // Identify Weaknesses (practicing but not mastered recently)
      const weaknesses = enrichedProgress
        .filter(p => p.status === 'practicing')
        .slice(0, 5); // Top 5 pending

      const strengths = mastered.slice(0, 5);

      setStats({
        totalPracticed: enrichedProgress.length,
        mastered: mastered.length,
        weaknesses,
        strengths
      });

    } catch (error) {
      console.error("Error fetching report", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLabel = (item) => {
    return item.content?.text || item.content?.word || item.content?.question || 'Unknown';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[85vh] overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle className="break-all pr-8">Progress Report: {studentEmail}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-pw-navy" />
          </div>
        ) : (
          <div className="space-y-6 min-w-0">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-pw-blue-soft text-pw-blue-ink rounded-2xl" aria-hidden="true">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-pw-muted">Total Practiced</p>
                    <p className="text-2xl font-extrabold text-pw-navy">{stats.totalPracticed}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-pw-green-soft text-pw-green-ink rounded-2xl" aria-hidden="true">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-pw-muted">Mastered</p>
                    <p className="text-2xl font-extrabold text-pw-navy">{stats.mastered}</p>
                  </div>
                </CardContent>
              </Card>
               <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-pw-soft text-pw-navy rounded-2xl" aria-hidden="true">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-pw-muted">Assignments</p>
                    <p className="text-2xl font-extrabold text-pw-navy">{assignments.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weaknesses / To Improve */}
              <Card className="bg-pw-red-soft border-transparent shadow-none">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-xs font-bold text-pw-red-ink uppercase tracking-widest">Needs Practice</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {stats.weaknesses.length > 0 ? (
                    <ul className="space-y-2">
                      {stats.weaknesses.map((item, idx) => (
                         <li key={idx} className="text-base text-pw-navy flex items-start gap-2">
                           <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-pw-navy flex-shrink-0" aria-hidden="true" />
                           {getLabel(item)}
                         </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-base text-pw-muted">No specific weaknesses identified yet.</p>
                  )}
                </CardContent>
              </Card>

               {/* Strengths */}
              <Card className="bg-pw-green-soft border-transparent shadow-none">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-xs font-bold text-pw-green-ink uppercase tracking-widest">Mastered Content</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {stats.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {stats.strengths.map((item, idx) => (
                         <li key={idx} className="text-base text-pw-navy flex items-start gap-2">
                           <CheckCircle className="w-4 h-4 text-pw-green-ink mt-1 flex-shrink-0" aria-hidden="true" />
                           {getLabel(item)}
                         </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-base text-pw-muted">Keep practicing to master content!</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assignment History */}
            <div>
              <h4 className="text-lg font-extrabold text-pw-navy mb-3">Recent Assignments</h4>
              {assignments.length > 0 ? (
                 <div className="rounded-2xl border border-pw-line overflow-x-auto">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap text-pw-muted">{format(new Date(a.assigned_date), 'MMM d')}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                           {a.content_type === 'custom' ? `Custom: ${a.custom_content}` : (
                                a.content_type.replace('_', ' ')
                           )}
                        </TableCell>
                        <TableCell>
                          <Tag tone={a.status === 'completed' ? 'green' : 'blue'} className="capitalize whitespace-nowrap">
                            {a.status}
                          </Tag>
                        </TableCell>
                        <TableCell>
                            {a.status === 'completed' && (
                                a.tutor_feedback ? (
                                    <span className="text-sm text-pw-green-ink font-bold whitespace-nowrap" title={a.tutor_feedback}>
                                        <CheckCircle className="w-4 h-4 inline mr-1" aria-hidden="true" />
                                        Sent
                                    </span>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="whitespace-nowrap"
                                        onClick={() => setSelectedAssignmentForFeedback(a)}
                                    >
                                        Give Feedback
                                    </Button>
                                )
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-pw-line rounded-2xl bg-white text-pw-muted text-base">
                  No assignments given yet.
                </div>
              )}
            </div>
            
            {/* Feedback Dialog Overlay */}
            <Dialog open={!!selectedAssignmentForFeedback} onOpenChange={(open) => !open && setSelectedAssignmentForFeedback(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Provide Feedback</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-base text-pw-muted">
                            Add a note for the student regarding their assignment.
                        </p>
                        <Input
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Great job! Work on..."
                        />
                        <Button 
                            onClick={async () => {
                                if (!selectedAssignmentForFeedback) return;
                                try {
                                    await base44.entities.Assignment.update(selectedAssignmentForFeedback.id, {
                                        tutor_feedback: feedbackText,
                                        feedback_date: new Date().toISOString()
                                    });
                                    toast.success("Feedback sent!");
                                    setFeedbackText("");
                                    setSelectedAssignmentForFeedback(null);
                                    fetchReport(); // Refresh
                                } catch(e) {
                                    toast.error("Failed to send feedback");
                                }
                            }}
                            className="w-full"
                        >
                            Send Feedback
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}