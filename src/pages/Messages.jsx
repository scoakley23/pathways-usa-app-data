import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, User, Loader2 } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { Input } from "@/components/ui/input";

export default function Messages() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Fetch relationships where user is tutor OR student
      // Since we can't do OR queries easily in one go usually, we might need two queries or fetch list and filter.
      // Assuming list returns all for now or we make two calls.
      
      const [asTutor, asStudent] = await Promise.all([
        base44.entities.TutorRelationship.list({ query: { tutor_email: user.email } }),
        base44.entities.TutorRelationship.list({ query: { student_email: user.email } })
      ]);

      // Combine and deduplicate
      const allRels = [...asTutor, ...asStudent];
      const uniqueContacts = [];
      const seen = new Set();

      allRels.forEach(rel => {
        const otherEmail = rel.tutor_email === user.email ? rel.student_email : rel.tutor_email;
        const role = rel.tutor_email === user.email ? 'Student' : 'Tutor';
        
        if (!seen.has(otherEmail)) {
          seen.add(otherEmail);
          uniqueContacts.push({
            email: otherEmail,
            role: role,
            status: rel.status,
            lastActive: new Date().toISOString() // Mock for sort
          });
        }
      });

      setContacts(uniqueContacts);
      if (uniqueContacts.length > 0) {
        setSelectedContact(uniqueContacts[0]);
      }
    } catch (error) {
      console.error("Error fetching messages", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.email.toLowerCase().includes(filter.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Contacts List */}
      <Card className="md:col-span-1 flex flex-col h-full">
        <CardHeader className="px-4 py-4 border-b">
          <CardTitle className="text-xl mb-4">Messages</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search contacts..." 
              className="pl-8"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
            {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No contacts found.</p>
                </div>
            ) : (
                <div className="flex flex-col">
                {filteredContacts.map(contact => (
                    <button
                    key={contact.email}
                    onClick={() => setSelectedContact(contact)}
                    className={`flex items-center gap-3 p-4 text-left transition-colors border-b border-slate-50
                        ${selectedContact?.email === contact.email ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}
                    `}
                    >
                    <Avatar className="w-10 h-10 border">
                        <AvatarFallback className="bg-slate-100 text-slate-600">
                        {contact.email[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{contact.email}</p>
                        <p className="text-xs text-slate-500">{contact.role}</p>
                    </div>
                    </button>
                ))}
                </div>
            )}
            </ScrollArea>
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-2 flex flex-col h-full overflow-hidden">
        {selectedContact ? (
            <>
                <div className="px-6 py-4 border-b bg-white flex items-center gap-3 shadow-sm z-10">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedContact.email[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-slate-900">{selectedContact.email}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden bg-slate-50/50">
                    <ChatInterface 
                        currentUserEmail={currentUser.email}
                        otherUserEmail={selectedContact.email}
                    />
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a contact to start messaging</p>
            </div>
        )}
      </Card>
    </div>
  );
}