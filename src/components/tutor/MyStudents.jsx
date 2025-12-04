import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, Clock, UserX, MessageCircle, TrendingUp } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MyStudents({ currentUserEmail }) {
  const [students, setStudents] = useState([]);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [currentUserEmail]);

  const fetchStudents = async () => {
    try {
      const rels = await base44.entities.TutorRelationship.list({
        query: { tutor_email: currentUserEmail }
      });
      setStudents(rels);
    } catch (error) {
      console.error("Error fetching students", error);
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    if (!newStudentEmail) return;

    try {
        // Check if already exists
        const existing = students.find(s => s.student_email === newStudentEmail);
        if (existing) {
            toast.error("Student already added");
            return;
        }

      await base44.entities.TutorRelationship.create({
        tutor_email: currentUserEmail,
        student_email: newStudentEmail,
        status: 'pending' // In a real app, student should accept. Here we assume auto-add or pending until logic exists.
      });
      setNewStudentEmail("");
      toast.success("Invitation sent to student!");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to add student");
    }
  };

  const viewStudent = async (studentEmail) => {
    setSelectedStudent(studentEmail);
    // Fetch their progress
    try {
        const progress = await base44.entities.UserProgress.list({
            query: { user_email: studentEmail }
        });
        
        const stats = {
            mastered: progress.filter(p => p.status === 'mastered').length,
            practicing: progress.length,
            lastActive: progress.length > 0 ? progress.sort((a,b) => new Date(b.last_practiced) - new Date(a.last_practiced))[0].last_practiced : null
        };
        setStudentProgress(stats);
    } catch (e) {
        console.error("Error fetching student progress", e);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addStudent} className="flex gap-4">
            <Input
              placeholder="Student's Email Address"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              type="email"
              required
            />
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((rel) => (
          <Card key={rel.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewStudent(rel.student_email)}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{rel.student_email}</h3>
                <div className="flex items-center mt-2">
                    {rel.status === 'active' && <Badge className="bg-green-100 text-green-700"><UserCheck className="w-3 h-3 mr-1"/> Active</Badge>}
                    {rel.status === 'pending' && <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                    {rel.status === 'rejected' && <Badge variant="destructive"><UserX className="w-3 h-3 mr-1"/> Rejected</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {students.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
                No students yet. Add one above!
            </div>
        )}
      </div>

      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Student: {selectedStudent}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                <div className="md:col-span-1 space-y-4">
                    <Card className="bg-slate-50">
                        <CardHeader><CardTitle className="text-sm">Progress Snapshot</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500">Mastered Sentences</p>
                                <p className="text-2xl font-bold text-green-600">{studentProgress?.mastered || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Practiced</p>
                                <p className="text-2xl font-bold text-blue-600">{studentProgress?.practicing || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Last Active</p>
                                <p className="text-sm font-medium">
                                    {studentProgress?.lastActive ? new Date(studentProgress.lastActive).toLocaleDateString() : 'Never'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="md:col-span-2 h-full min-h-[400px]">
                    <ChatInterface 
                        currentUserEmail={currentUserEmail}
                        otherUserEmail={selectedStudent}
                    />
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}