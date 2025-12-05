import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, X, UserCheck, Clock, Plus, Hash, Mail } from 'lucide-react';
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
      const rels = await base44.entities.TutorRelationship.list({
        query: { student_email: normalizedEmail }
      });
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
          // 1. Find tutor by invite code
          let cleanCode = inviteCode.replace(/\s+/g, '').toUpperCase();
          
          let profiles = await base44.entities.PublicProfile.list({
              query: { invite_code: cleanCode }
          });

          // Fallback: Handle 0 vs O confusion
          if (profiles.length === 0) {
              // Try replacing 0 with O
              const codeWithO = cleanCode.replace(/0/g, 'O');
              if (codeWithO !== cleanCode) {
                  profiles = await base44.entities.PublicProfile.list({ query: { invite_code: codeWithO } });
              }
              
              // Try replacing O with 0
              if (profiles.length === 0) {
                  const codeWithZero = cleanCode.replace(/O/g, '0');
                  if (codeWithZero !== cleanCode) {
                      profiles = await base44.entities.PublicProfile.list({ query: { invite_code: codeWithZero } });
                  }
              }
          }

          if (profiles.length === 0) {
              toast.error("Invalid invite code. Please check and try again.");
              setIsJoining(false);
              return;
          }

          const tutorProfile = profiles[0];
          // Verify this is actually a tutor account
          if (tutorProfile.account_type !== 'tutor') {
               toast.error("This code belongs to a student account, not a tutor.");
               setIsJoining(false);
               return;
          }

          const tutorEmail = tutorProfile.user_email;
          await connectWithTutor(tutorEmail, 'active'); // Auto-accept for code
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
      const existing = await base44.entities.TutorRelationship.list({
          query: { student_email: studentEmailNormalized, tutor_email: tutorEmailNormalized }
      });

      if (existing.length > 0) {
          toast.error("You are already connected with this tutor.");
          return;
      }

      // Create relationship
      await base44.entities.TutorRelationship.create({
          student_email: studentEmailNormalized,
          tutor_email: tutorEmailNormalized,
          status: initialStatus
      });

      if (initialStatus === 'active') {
         toast.success(`Successfully joined class!`);
      } else {
         toast.success(`Request sent to ${tutorEmailNormalized}`);
      }
      fetchTutors();
  };

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800">My Tutors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tutors.map((rel) => (
          <Card key={rel.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-lg">{rel.tutor_email}</h3>
                    <div className="mt-1">
                         {rel.status === 'active' && <Badge className="bg-green-100 text-green-700"><UserCheck className="w-3 h-3 mr-1"/> Active Tutor</Badge>}
                        {rel.status === 'pending' && <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1"/> Request Pending</Badge>}
                    </div>
                </div>
                
                {rel.status === 'active' && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedTutor(rel.tutor_email)}>
                        <MessageCircle className="w-4 h-4 mr-2" /> Chat
                    </Button>
                )}
              </div>

              {rel.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  {rel.created_by === currentUserEmail ? (
                      <div className="w-full text-center text-sm text-slate-500 bg-slate-100 py-2 rounded-md">
                          Request Sent
                      </div>
                  ) : (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleResponse(rel.id, 'active')}>
                            <Check className="w-4 h-4 mr-2" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 flex-1" onClick={() => handleResponse(rel.id, 'rejected')}>
                            <X className="w-4 h-4 mr-2" /> Decline
                        </Button>
                      </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {tutors.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="mb-2">No tutors yet.</p>
                <p className="text-sm">Ask your tutor for their <span className="font-semibold text-indigo-600">Invite Code</span> or ask them to invite you by email.</p>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Join by Code Section */}
          <Card className="border-indigo-100 bg-indigo-50/50">
              <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                      <Hash className="w-5 h-5" /> Join with Code
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <form onSubmit={joinByCode} className="flex gap-4">
                      <Input 
                          placeholder="7-char code" 
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          className="bg-white font-mono uppercase"
                      />
                      <Button type="submit" disabled={isJoining || !inviteCode} className="bg-indigo-600 hover:bg-indigo-700">
                          Join
                      </Button>
                  </form>
                  <p className="text-xs text-slate-500 mt-2">
                      Enter the code provided by your tutor.
                  </p>
              </CardContent>
          </Card>

          {/* Join by Email Section */}
          <Card className="border-blue-100 bg-blue-50/50">
              <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                      <Mail className="w-5 h-5" /> Request by Email
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <form onSubmit={addTutorByEmail} className="flex gap-4">
                      <Input 
                          placeholder="Tutor's Email" 
                          value={tutorEmailInput}
                          onChange={(e) => setTutorEmailInput(e.target.value)}
                          type="email"
                          className="bg-white"
                      />
                      <Button type="submit" disabled={isJoining || !tutorEmailInput} className="bg-blue-600 hover:bg-blue-700">
                          Request
                      </Button>
                  </form>
                  <p className="text-xs text-slate-500 mt-2">
                      Send a connection request to your tutor's email.
                  </p>
              </CardContent>
          </Card>
      </div>

      <Dialog open={!!selectedTutor} onOpenChange={(open) => !open && setSelectedTutor(null)}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
            <DialogHeader>
                <DialogTitle>Chat with Tutor</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
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