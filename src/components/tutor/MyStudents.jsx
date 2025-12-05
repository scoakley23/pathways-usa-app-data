import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, Clock, UserX, MessageCircle, FileText, BarChart, MoreHorizontal } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AssignContentDialog from './AssignContentDialog';
import StudentProgressReport from './StudentProgressReport';
import { toast } from "sonner";

export default function MyStudents({ currentUserEmail }) {
  const [students, setStudents] = useState([]);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Dialog States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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

    const studentEmailLower = newStudentEmail.toLowerCase().trim();

    if (studentEmailLower === currentUserEmail.toLowerCase().trim()) {
        toast.error("You cannot add yourself as a student");
        return;
    }

    try {
        const existing = students.find(s => s.student_email.toLowerCase() === studentEmailLower);
        if (existing) {
            toast.error("Student already added");
            return;
        }

      await base44.entities.TutorRelationship.create({
        tutor_email: currentUserEmail,
        student_email: studentEmailLower,
        status: 'pending' 
      });

      // Send email invitation
      await base44.integrations.Core.SendEmail({
        to: studentEmailLower,
        subject: "Invitation to connect on Citizenship Learning Hub",
        body: `Hello! \n\n${currentUserEmail} has invited you to connect as a student on the Citizenship Learning Hub. \n\nPlease log in to the app to accept the invitation and start practicing together. \n\nBest regards,\nThe Citizenship Hub Team`
      });

      setNewStudentEmail("");
      toast.success("Invitation sent to student!");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to add student");
    }
  };

  const handleAction = (student, action) => {
    setSelectedStudent(student);
    if (action === 'chat') setIsChatOpen(true);
    if (action === 'assign') setIsAssignOpen(true);
    if (action === 'report') setIsReportOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-slate-600 bg-blue-50 p-3 rounded-md border border-blue-100">
              <p><strong>How it works:</strong> Enter your student's email address below. They will receive an invitation email and see a request in their Tutor Portal.</p>
              <p className="mt-1">Once they accept, you can assign them practice exercises and track their progress.</p>
          </div>
          <form onSubmit={addStudent} className="flex gap-4">
            <Input
              placeholder="Student's Email Address"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              type="email"
              required
            />
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((rel) => (
          <Card key={rel.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="font-semibold text-lg truncate max-w-[180px]" title={rel.student_email}>
                        {rel.student_email.split('@')[0]}
                    </h3>
                    <p className="text-xs text-slate-500 truncate max-w-[180px]">{rel.student_email}</p>
                 </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAction(rel, 'chat')}>
                            <MessageCircle className="mr-2 h-4 w-4" /> Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(rel, 'assign')}>
                            <FileText className="mr-2 h-4 w-4" /> Assign Practice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(rel, 'report')}>
                            <BarChart className="mr-2 h-4 w-4" /> View Report
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                 <div className="flex items-center">
                    {rel.status === 'active' && <Badge className="bg-green-100 text-green-700"><UserCheck className="w-3 h-3 mr-1"/> Active</Badge>}
                    {rel.status === 'pending' && <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                    {rel.status === 'rejected' && <Badge variant="destructive"><UserX className="w-3 h-3 mr-1"/> Rejected</Badge>}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAction(rel, 'assign')}>
                        Assign
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleAction(rel, 'chat')}>
                        <MessageCircle className="w-4 h-4 text-slate-500" />
                    </Button>
                </div>
              </div>
              </CardContent>
              </Card>
              ))}
        {students.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
                No students yet. Add one above!
            </div>
        )}
      </div>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
            <div className="px-6 py-4 border-b">
                <DialogHeader>
                    <DialogTitle>Chat with {selectedStudent?.student_email}</DialogTitle>
                </DialogHeader>
            </div>
            <div className="flex-1 overflow-hidden">
                {selectedStudent && (
                    <ChatInterface 
                        currentUserEmail={currentUserEmail}
                        otherUserEmail={selectedStudent.student_email}
                    />
                )}
            </div>
        </DialogContent>
      </Dialog>

      {/* Assignments Dialog */}
      {selectedStudent && (
        <AssignContentDialog 
            isOpen={isAssignOpen}
            onClose={() => setIsAssignOpen(false)}
            studentEmail={selectedStudent.student_email}
            tutorEmail={currentUserEmail}
        />
      )}

      {/* Report Dialog */}
      {selectedStudent && (
        <StudentProgressReport
             isOpen={isReportOpen}
             onClose={() => setIsReportOpen(false)}
             studentEmail={selectedStudent.student_email}
        />
      )}
    </div>
  );
}