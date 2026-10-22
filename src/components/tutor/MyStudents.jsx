import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MessageCircle, FileText, BarChart, MoreHorizontal, Check, X, Link, RefreshCw } from 'lucide-react';
import { Tag, RaisedCard } from '@/components/pathways/ui';
import ChatInterface from '@/components/chat/ChatInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AssignContentDialog from './AssignContentDialog';
import StudentProgressReport from './StudentProgressReport';
import TutorDashboard from './TutorDashboard';
import StudentActivityMonitor from './StudentActivityMonitor';
import { LayoutDashboard, Users, Activity } from 'lucide-react';
import { toast } from "sonner";
import { inviteStudent, respondToLink, requesterOf } from '@/lib/tutorLinks';

export default function MyStudents({ currentUserEmail }) {
  const [view, setView] = useState('list'); // 'list', 'dashboard', or 'monitor'
  const [students, setStudents] = useState([]);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  
  // Dialog States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchInviteCode();
  }, [currentUserEmail]);

  const fetchInviteCode = async () => {
      try {
          const normalizedEmail = currentUserEmail.toLowerCase().trim();

          // This tutor's own profiles; use the one with account_type=tutor
          const allProfiles = await base44.entities.PublicProfile.filter({ user_email: normalizedEmail }, '-created_date', 100);
          const profile = allProfiles.find(p => p.user_email === normalizedEmail && p.account_type === 'tutor')
              || allProfiles.find(p => p.user_email === normalizedEmail);
          
          if (profile) {
              if (profile.invite_code) {
                  setInviteCode(profile.invite_code);
              } else {
                  // Generate and persist code for tutors without one
                  const newCode = generateInviteCode(normalizedEmail);
                  await base44.entities.PublicProfile.update(profile.id, { invite_code: newCode });
                  setInviteCode(newCode);
              }
          }
      } catch (e) {
          console.error("Error with invite code", e);
      }
  };

  const generateInviteCode = (email) => {
      const prefix = email.substring(0, 3).toUpperCase();
      const random = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}${random}`;
  };

  const fetchStudents = async () => {
    try {
      const normalizedEmail = currentUserEmail.toLowerCase().trim();
      const rels = await base44.entities.TutorRelationship.filter({ tutor_email: normalizedEmail });
      setStudents(rels);
    } catch (error) {
      console.error("Error fetching students", error);
    }
  };

  const addStudent = async (e) => {
  e.preventDefault();
  if (!newStudentEmail) return;
  setIsSubmitting(true);

  const studentEmailLower = newStudentEmail.toLowerCase().trim();

  if (studentEmailLower === currentUserEmail.toLowerCase().trim()) {
      toast.error("You cannot add yourself as a student");
      setIsSubmitting(false);
      return;
  }

  try {
      const existing = students.find(s => s.student_email.toLowerCase() === studentEmailLower);
      if (existing) {
          toast.error("Student already added");
          setIsSubmitting(false);
          return;
      }

    const newRel = await inviteStudent(studentEmailLower);

    setStudents(prev => [...prev, newRel]);
    setNewStudentEmail("");
    toast.success("Invitation sent!");

    // Send email with BOTH invite link AND code
    const appUrl = window.location.origin;
    const inviteLink = `${appUrl}/?tutor_invite=${encodeURIComponent(currentUserEmail)}`;
    const emailSubject = "Invitation to join Citizenship Learning Hub";
    const emailBody = `Hello!

${currentUserEmail} has invited you to connect as a student on the Citizenship Learning Hub.

You have TWO ways to join:

OPTION 1 - Click this link to join automatically:
${inviteLink}

OPTION 2 - Sign up and enter this class code: ${inviteCode}

Best regards,
The Citizenship Hub Team`;

    base44.integrations.Core.SendEmail({
          from_name: "Citizenship Learning Hub",
          to: studentEmailLower,
          subject: emailSubject,
          body: emailBody
    }).catch((emailError) => {
        console.error("Email failed", emailError);
    });
  } catch (error) {
    console.error("Add student error", error);
    toast.error(`Failed to add student: ${error.message || "Unknown error"}`);
  } finally {
      setIsSubmitting(false);
  }
};

  const handleResponse = async (id, status) => {
    try {
      await respondToLink(id, status === 'active');
      
      // Notify Student
      const rel = students.find(s => s.id === id);
      if (rel) {
          await base44.entities.Notification.create({
              user_email: rel.student_email,
              type: 'request',
              title: `Request ${status === 'active' ? 'Accepted' : 'Declined'}`,
              message: `Your tutor request was ${status}.`,
              link: '/Tutor'
          });
      }

      toast.success(`Request ${status}`);
      fetchStudents();
    } catch (error) {
      toast.error(error.message || "Action failed");
    }
  };

  const handleAction = (student, action) => {
    setSelectedStudent(student);
    if (action === 'chat') setIsChatOpen(true);
    if (action === 'assign') setIsAssignOpen(true);
    if (action === 'report') setIsReportOpen(true);
  };

  const viewBtn = (active) => `flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-h-[44px] px-2 sm:px-4 py-1.5 rounded-xl text-sm sm:text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy ${active ? 'bg-pw-navy text-white' : 'text-pw-muted hover:text-pw-navy hover:bg-pw-soft'}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2 mb-4">
        <div className="grid grid-cols-3 flex-1 sm:flex-none bg-white border border-pw-line p-1 rounded-2xl gap-1">
            <button 
                onClick={() => { setView('list'); fetchStudents(); }}
                className={viewBtn(view === 'list')}
                aria-pressed={view === 'list'}
            >
                <Users className="w-4 h-4" aria-hidden="true" /> My Students
            </button>
            <button 
                onClick={() => setView('dashboard')}
                className={viewBtn(view === 'dashboard')}
                aria-pressed={view === 'dashboard'}
            >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Dashboard
            </button>
            <button 
                onClick={() => setView('monitor')}
                className={viewBtn(view === 'monitor')}
                aria-pressed={view === 'monitor'}
            >
                <Activity className="w-4 h-4" aria-hidden="true" /> Activity
            </button>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchStudents} title="Refresh List" aria-label="Refresh List" className="shrink-0">
            <RefreshCw className="w-5 h-5 text-pw-muted" />
        </Button>
      </div>

      {view === 'dashboard' ? (
          <TutorDashboard currentUserEmail={currentUserEmail} students={students} />
      ) : view === 'monitor' ? (
          <StudentActivityMonitor currentUserEmail={currentUserEmail} students={students} />
      ) : (
        <>
          <RaisedCard>
              <h2 className="text-2xl font-display font-normal text-pw-navy mb-4">Add New Student</h2>
               {/* Invite Code Section */}
               <div className="mb-6 bg-pw-blue-soft rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                       <h3 className="text-base font-bold text-pw-navy mb-1">Your Class Invite Code</h3>
                       <p className="text-sm text-pw-blue-ink">Share this code with your students. They can enter it to join your class instantly.</p>
                   </div>
                   <div className="flex items-center gap-2 flex-wrap">
                       <code className="bg-white px-4 py-2 rounded-xl border border-pw-line text-xl font-mono font-extrabold text-pw-navy tracking-wider">
                           {inviteCode || "..."}
                       </code>
                       <Button 
                           size="sm" 
                           variant="outline" 
                           onClick={() => {
                               navigator.clipboard.writeText(inviteCode);
                               toast.success("Code copied!");
                           }}
                       >
                           Copy Code
                       </Button>
                       <Button
                           size="sm"
                           variant="outline"
                           onClick={() => {
                               const link = `${window.location.origin}/?tutor_invite=${encodeURIComponent(currentUserEmail)}`;
                               navigator.clipboard.writeText(link);
                               toast.success("Invite link copied!");
                           }}
                       >
                           <Link className="w-4 h-4" /> Copy Link
                       </Button>
                   </div>
               </div>

               <div className="relative my-6">
                   <div className="absolute inset-0 flex items-center">
                       <span className="w-full border-t border-pw-line" />
                   </div>
                   <div className="relative flex justify-center">
                       <span className="bg-white px-3 text-xs font-bold uppercase tracking-widest text-pw-muted">Or invite by email</span>
                   </div>
               </div>

              <p className="mb-4 text-base text-pw-muted">
                  Enter your student's email address below. They will receive an invitation email.
              </p>
              <form onSubmit={addStudent} className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Student's Email Address"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  type="email"
                  required
                  aria-label="Student's Email Address"
                />
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> {isSubmitting ? 'Adding...' : 'Add Student'}
                </Button>
              </form>
          </RaisedCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      
        {students.map((rel) => (
          <RaisedCard key={rel.id}>
              <div className="flex justify-between items-start gap-2 mb-4">
                 <div className="min-w-0">
                    <h3 className="font-extrabold text-lg text-pw-navy truncate" title={rel.student_email}>
                        {rel.student_email.split('@')[0]}
                    </h3>
                    <p className="text-sm text-pw-muted truncate">{rel.student_email}</p>
                 </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Actions">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAction(rel, 'chat')} className="min-h-[44px] text-base">
                            <MessageCircle className="mr-2 h-4 w-4" /> Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(rel, 'assign')} className="min-h-[44px] text-base">
                            <FileText className="mr-2 h-4 w-4" /> Assign Practice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(rel, 'report')} className="min-h-[44px] text-base">
                            <BarChart className="mr-2 h-4 w-4" /> View Report
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>
              
              <div className="mt-4 pt-4 border-t border-pw-line">
                 {rel.status === 'pending' ? (
                    requesterOf(rel) !== currentUserEmail.toLowerCase().trim() ? (
                     <div className="bg-pw-teal-soft p-4 rounded-2xl">
                         <span className="text-sm font-bold text-pw-teal-ink block mb-3">Student requested to join</span>
                         <div className="flex gap-2">
                             <Button className="flex-1" onClick={() => handleResponse(rel.id, 'active')}>
                                 <Check className="w-4 h-4" /> Accept
                             </Button>
                             <Button variant="outline" className="flex-1" onClick={() => handleResponse(rel.id, 'rejected')}>
                                 <X className="w-4 h-4" /> Reject
                             </Button>
                         </div>
                     </div>
                    ) : (
                     <div className="flex flex-wrap items-center justify-between gap-2">
                         <Tag tone="blue">Invitation Sent</Tag>
                         <span className="text-sm text-pw-muted">Pending acceptance</span>
                     </div>
                    )
                 ) : (
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center">
                            {rel.status === 'active' && <Tag tone="green">Active</Tag>}
                            {rel.status === 'rejected' && <Tag tone="red">Rejected</Tag>}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleAction(rel, 'assign')} disabled={rel.status !== 'active'}>
                                Assign
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleAction(rel, 'chat')} disabled={rel.status !== 'active'} aria-label="Chat">
                                <MessageCircle className="w-5 h-5 text-pw-muted" />
                            </Button>
                        </div>
                    </div>
                 )}
              </div>
          </RaisedCard>
              ))}
        {students.length === 0 && (
            <div className="col-span-full text-center py-10 px-5 text-base text-pw-muted bg-white rounded-[14px] border border-dashed border-pw-line">
                No students yet. Add one above!
            </div>
        )}
      </div>
      </>
      )}

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-pw-line">
                <DialogHeader>
                    <DialogTitle className="break-all pr-8">Chat with {selectedStudent?.student_email}</DialogTitle>
                </DialogHeader>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden p-3">
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