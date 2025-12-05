import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import MyStudents from '@/components/tutor/MyStudents';
import MyTutor from '@/components/tutor/MyTutor';
import { GraduationCap, Users, School, Loader2 } from 'lucide-react';

export default function Tutor() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserAndRole = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        
        // Fetch Role
        const profiles = await base44.entities.PublicProfile.list({
            query: { user_email: me.email }
        });
        
        if (profiles.length > 0 && profiles[0].account_type) {
            setRole(profiles[0].account_type);
        } else {
            setRole('student'); // Fallback
        }
      } catch (e) {
        // handle not logged in
      } finally {
        setIsLoading(false);
      }
    };
    loadUserAndRole();
  }, []);

  if (isLoading) {
      return (
          <div className="flex justify-center items-center min-h-[50vh]">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
      );
  }

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
          {role === 'tutor' ? <GraduationCap className="w-8 h-8 text-blue-600" /> : <School className="w-8 h-8 text-blue-600" />}
          {role === 'tutor' ? 'Tutor Dashboard' : 'My Classroom'}
        </h1>
        <p className="text-slate-600">
            {role === 'tutor' 
                ? 'Manage your students, assign practice, and track their progress.' 
                : 'Connect with your tutor and check your assignments.'}
        </p>
      </div>

      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {role === 'tutor' ? (
              <MyStudents currentUserEmail={user.email} />
          ) : (
              <MyTutor currentUserEmail={user.email} />
          )}
      </div>
    </div>
  );
}