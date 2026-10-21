import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { MessageCircle, Check, X, Clock, Hash, Mail, RefreshCw } from 'lucide-react';
import { Tag, RaisedCard } from '@/components/pathways/ui';
import { Input } from "@/components/ui/input";
import ChatInterface from '@/components/chat/ChatInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MyTutor({ currentUserEmail }) {
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [tutorEmailInput, setTutorEmailInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchTutors();
  }, [currentUserEmail]);

  const fetchTutors = async () => {
    try {
      const normalizedEmail = currentUserEmail.toLowerCase().trim();
      const rels = await base44.entities.TutorRelationship.filter({ student_email: normalizedEmail });
      setTutors(rels);
    } catch (error) {
      console.error("Error fetching tutors", error);
    }
  };

  const handleResponse = async (id, status) => {
    try {
      await base44.entities.TutorRelationship.update(id, { status });
      toast.success(`Tutor request ${status}`);
      fetchTutors();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const joinByCode = async (e) => {
      e.preventDefault();
      if (!inviteCode) return;
      setIsJoining(true);

      try {
          const cleanCode = inviteCode.replace(/\s+/g, '').toUpperCase();

          // Fetch ALL tutor profiles and do a client-side case-insensitive match
          // (query-filter on invite_code is unreliable across backends)
          const allProfiles = await base44.entities.PublicProfile.list('-created_date', 1000);

          // Try exact match first, then O/0 swap fallbacks
          const variants = [cleanCode, cleanCode.replace(/0/g, 'O'), cleanCode.replace(/O/g, '0')];
          
          const tutorProfile = allProfiles.find(p =>
              p.account_type === 'tutor' &&
              p.invite_code &&
              variants.includes(p.invite_code.toUpperCase())
          );

          if (!tutorProfile) {
              toast.error("Invalid invite code. Please check and try again.");
              return;
          }

          await connectWithTutor(tutorProfile.user_email, 'active');
          setInviteCode("");

      } catch (error) {
          console.error("Join error", error);
          toast.error("Failed to join class. Please try again.");
      } finally {
          setIsJoining(false);
      }
  };

  const addTutorByEmail = async (e) => {
      e.preventDefault();
      if (!tutorEmailInput) return;
      setIsJoining(true);
      
      try {
        const email = tutorEmailInput.toLowerCase().trim();
        await connectWithTutor(email, 'pending');
        setTutorEmailInput("");
      } catch (e) {
          console.error(e);
      } finally {
          setIsJoining(false);
      }
  };

  const connectWithTutor = async (tutorEmail, initialStatus = 'pending') => {
      const studentEmailNormalized = currentUserEmail.toLowerCase().trim();
      const tutorEmailNormalized = tutorEmail.toLowerCase().trim();

      if (tutorEmailNormalized === studentEmailNormalized) {
          toast.error("You cannot add yourself as a tutor.");
          return;
      }

      // Check if relationship already exists
      const existing = await base44.entities.TutorRelationship.filter({
          student_email: studentEmailNormalized, tutor_email: tutorEmailNormalized
      });

      if (existing.length > 0) {
          toast.error("You are already connected with this tutor.");
          return;
      }

      // Create relationship
      await base44.entities.TutorRelationship.create({
          student_email: studentEmailNormalized,
          tutor_email: tutorEmailNormalized,
          status: initialStatus,
          created_by: studentEmailNormalized
      });

      if (initialStatus === 'active') {
         toast.success(`Successfully joined class!`);
      } else {
         // Send email notification to the Tutor
         const appUrl = window.location.origin;
         const emailSubject = "New Student Request - Citizenship Learning Hub";
         const emailBody = `Hello! \n\n${studentEmailNormalized} has requested to join your class on the Citizenship Learning Hub. \n\nPlease log in to your Tutor Dashboard to accept or decline this request:\n${appUrl}/Tutor\n\nBest regards,\nThe Citizenship Hub Team`;
         
         try {
             base44.integrations.Core.SendEmail({
                from_name: "Citizenship Learning Hub",
                to: tutorEmailNormalized,
                subject: emailSubject,
                body: emailBody
             }).catch(err => console.error("Failed to send email notification", err));
             
             // In-App Notification
             await base44.entities.Notification.create({
                 user_email: tutorEmailNormalized,
                 type: 'request',
                 title: 'New Student Request',
                 message: `${studentEmailNormalized} wants to join your class.`,
                 link: '/Tutor'
             });

         } catch (e) {
             console.error("Email dispatch error", e);
         }

         toast.success(`Request sent to ${tutorEmailNormalized}`);
      }
      fetchTutors();
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center gap-3">
            <h2 className="text-2xl font-extrabold text-pw-navy">My Tutors</h2>
            <Button variant="ghost" size="icon" onClick={fetchTutors} title="Refresh" aria-label="Refresh">
                <RefreshCw className="w-5 h-5 text-pw-muted" />
            </Button>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tutors.map((rel) => (
          <RaisedCard key={rel.id}>
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="min-w-0">
                    <h3 className="font-extrabold text-lg text-pw-navy break-all">{rel.tutor_email}</h3>
                    <div className="mt-2">
                        {rel.status === 'active' && <Tag tone="green">Active Tutor</Tag>}
                        {rel.status === 'pending' && (
                            rel.created_by === currentUserEmail 
                            ? <Tag tone="blue">Request Sent</Tag>
                            : <Tag tone="teal">Invite Received</Tag>
                        )}
                    </div>
                </div>
                
                {rel.status === 'active' && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedTutor(rel.tutor_email)}>
                        <MessageCircle className="w-4 h-4" /> Chat
                    </Button>
                )}
              </div>

              {rel.status === 'pending' && (
                <div className="mt-4">
                  {rel.created_by === currentUserEmail ? (
                      <div className="w-full flex items-center justify-center gap-2 text-base font-semibold text-pw-blue-ink bg-pw-blue-soft py-3 px-4 rounded-2xl">
                          <Clock className="w-4 h-4" aria-hidden="true" /> Request Pending Approval
                      </div>
                  ) : (
                      <div className="bg-pw-teal-soft p-4 rounded-2xl">
                          <span className="text-sm font-bold text-pw-teal-ink block mb-3">Tutor invited you</span>
                          <div className="flex gap-2">
                            <Button className="flex-1" onClick={() => handleResponse(rel.id, 'active')}>
                                <Check className="w-4 h-4" /> Accept
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => handleResponse(rel.id, 'rejected')}>
                                <X className="w-4 h-4" /> Decline
                            </Button>
                          </div>
                      </div>
                  )}
                </div>
              )}
          </RaisedCard>
        ))}
        {tutors.length === 0 && (
            <div className="col-span-full text-center py-10 px-5 text-pw-muted bg-white rounded-3xl border border-dashed border-pw-line">
                <p className="mb-2 text-lg font-bold text-pw-navy">No tutors yet.</p>
                <p className="text-base">Ask your tutor for their <span className="font-bold text-pw-navy">Invite Code</span> or ask them to invite you by email.</p>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {/* Join by Code Section */}
          <RaisedCard>
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-pw-navy mb-4">
                  <span className="w-10 h-10 rounded-xl bg-pw-blue-soft text-pw-blue-ink flex items-center justify-center" aria-hidden="true"><Hash className="w-5 h-5" /></span>
                  Join with Code
              </h3>
              <form onSubmit={joinByCode} className="flex gap-3">
                  <Input 
                      placeholder="7-char code" 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="bg-white font-mono uppercase min-w-0"
                      aria-label="Invite code"
                  />
                  <Button type="submit" disabled={isJoining || !inviteCode}>
                      Join
                  </Button>
              </form>
              <p className="text-sm text-pw-muted mt-3">
                  Enter the code provided by your tutor.
              </p>
          </RaisedCard>

          {/* Join by Email Section */}
          <RaisedCard>
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-pw-navy mb-4">
                  <span className="w-10 h-10 rounded-xl bg-pw-teal-soft text-pw-teal-ink flex items-center justify-center" aria-hidden="true"><Mail className="w-5 h-5" /></span>
                  Request by Email
              </h3>
              <form onSubmit={addTutorByEmail} className="flex gap-3">
                  <Input 
                      placeholder="Tutor's Email" 
                      value={tutorEmailInput}
                      onChange={(e) => setTutorEmailInput(e.target.value)}
                      type="email"
                      className="bg-white min-w-0"
                      aria-label="Tutor's Email"
                  />
                  <Button type="submit" disabled={isJoining || !tutorEmailInput}>
                      Request
                  </Button>
              </form>
              <p className="text-sm text-pw-muted mt-3">
                  Send a connection request to your tutor's email.
              </p>
          </RaisedCard>
      </div>

      <Dialog open={!!selectedTutor} onOpenChange={(open) => !open && setSelectedTutor(null)}>
        <DialogContent className="max-w-2xl h-[600px] max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Chat with Tutor</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
                <ChatInterface 
                    currentUserEmail={currentUserEmail}
                    otherUserEmail={selectedTutor}
                />
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}