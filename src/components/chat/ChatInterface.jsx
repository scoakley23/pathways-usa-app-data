import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatInterface({ otherUserEmail, currentUserEmail }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [otherUserEmail]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!otherUserEmail || !currentUserEmail) return;
    try {
      // Fetch messages where (sender=me AND receiver=them) OR (sender=them AND receiver=me)
      // Since we can't do complex OR queries easily in one go efficiently without a specific index or backend support in some systems,
      // we might fetch all messages for the current user and filter.
      // Assuming Message entity has low volume for this demo.
      // Better: Fetch sent and received separately and merge.
      
      const sent = await base44.entities.Message.list({
        query: { sender_email: currentUserEmail, receiver_email: otherUserEmail },
        limit: 50,
        sort: { created_date: -1 } // Get newest
      });

      const received = await base44.entities.Message.list({
        query: { sender_email: otherUserEmail, receiver_email: currentUserEmail },
        limit: 50,
        sort: { created_date: -1 }
      });

      const all = [...sent, ...received].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );

      // Remove duplicates if any (unlikely with this logic but safe)
      const unique = all.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);

      setMessages(unique);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await base44.entities.Message.create({
        sender_email: currentUserEmail,
        receiver_email: otherUserEmail,
        content: newMessage,
        read: false
      });
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-xl bg-white shadow-sm">
      <div className="p-4 border-b bg-slate-50 rounded-t-xl">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <User className="w-4 h-4" /> Chat with {otherUserEmail}
        </h3>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center text-slate-400 mt-10">Loading chat...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">No messages yet. Say hi!</div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender_email === currentUserEmail;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                      {format(new Date(msg.created_date), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-white rounded-b-xl">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}