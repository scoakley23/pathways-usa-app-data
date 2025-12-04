import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, X, UserCheck, Clock } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MyTutor({ currentUserEmail }) {
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);

  useEffect(() => {
    fetchTutors();
  }, [currentUserEmail]);

  const fetchTutors = async () => {
    try {
      const rels = await base44.entities.TutorRelationship.list({
        query: { student_email: currentUserEmail }
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
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleResponse(rel.id, 'active')}>
                    <Check className="w-4 h-4 mr-2" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 flex-1" onClick={() => handleResponse(rel.id, 'rejected')}>
                    <X className="w-4 h-4 mr-2" /> Decline
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {tutors.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                No tutors yet. Ask your tutor to invite you using your email: <span className="font-bold text-slate-700">{currentUserEmail}</span>
            </div>
        )}
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