import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyStudents from '@/components/tutor/MyStudents';
import MyTutor from '@/components/tutor/MyTutor';
import { GraduationCap, Users, School } from 'lucide-react';

export default function Tutor() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (e) {
        // handle not logged in
      }
    };
    loadUser();
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <School className="w-16 h-16 text-blue-200" />
        <h2 className="text-2xl font-bold text-slate-800">Sign in to access Tutor features</h2>
        <p className="text-slate-600">Connect with students or tutors to track progress together.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          Tutor Portal
        </h1>
        <p className="text-slate-600">Manage your learning relationships and track progress.</p>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> I am a Tutor
          </TabsTrigger>
          <TabsTrigger value="tutors" className="flex items-center gap-2">
            <School className="w-4 h-4" /> I am a Student
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="mt-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <MyStudents currentUserEmail={user.email} />
        </TabsContent>
        
        <TabsContent value="tutors" className="mt-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <MyTutor currentUserEmail={user.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}