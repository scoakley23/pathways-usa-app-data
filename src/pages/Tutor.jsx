import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import MyStudents from '@/components/tutor/MyStudents';
import MyTutor from '@/components/tutor/MyTutor';
import { School, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Tutor({ cachedUser, cachedRole }) {
  const [user, setUser] = useState(cachedUser || null);
  const [role, setRole] = useState(cachedRole || null);
  // If we have cached data, we are not loading
  const [isLoading, setIsLoading] = useState(!cachedUser || (cachedUser && !cachedRole));

  const fetchUserData = async () => {
    try {
      // If we already have data from props, we can skip or just refresh quietly
      const me = await base44.auth.me();
      setUser(me);
      
      const normalizedEmail = me.email.toLowerCase().trim();
      const profiles = await base44.entities.PublicProfile.filter({ user_email: normalizedEmail });
      
      if (profiles.length > 0 && profiles[0].account_type) {
          setRole(profiles[0].account_type);
      } else {
          // Keep existing role if we have one from cache to prevent flashing
          if (!role) setRole(null);
      }
    } catch (e) {
      console.error("Error loading user data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cachedUser) setUser(cachedUser);
    if (cachedRole) setRole(cachedRole);

    // If we don't have cached data, fetch it
    if (!cachedUser || !cachedRole) {
        fetchUserData();
    }
  }, [cachedUser, cachedRole]);

  if (isLoading) {
      return (
          <div className="flex justify-center items-center min-h-[50vh]">
              <Loader2 className="w-8 h-8 animate-spin text-pw-navy" />
          </div>
      );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4">
        <div className="w-20 h-20 rounded-[14px] bg-pw-blue-soft flex items-center justify-center" aria-hidden="true">
          <School className="w-10 h-10 text-pw-blue-ink" />
        </div>
        <h2 className="text-[28px] font-display font-normal text-pw-navy">Sign in to access Tutor features</h2>
        <p className="text-base text-pw-muted">Connect with students or tutors to track progress together.</p>
      </div>
    );
  }

  if (!role) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-pw-navy/40" />
              <p className="text-base text-pw-muted">Setting up your profile...</p>
              <div className="flex flex-col gap-2 mt-4">
                  <button 
                    onClick={() => { setIsLoading(true); fetchUserData(); }} 
                    className="min-h-[44px] px-4 text-base font-bold text-pw-navy underline underline-offset-4 decoration-pw-navy/40 hover:decoration-pw-navy rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
                  >
                    Check again
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="min-h-[44px] px-4 text-sm font-semibold text-pw-muted hover:text-pw-navy rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
                  >
                    Reload Page
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        art="speech"
        title={role === 'tutor' ? 'Tutor Dashboard' : 'My Classroom'}
        subtitle={role === 'tutor'
            ? 'Manage your students, assign practice, and track their progress.'
            : 'Connect with your tutor and check your assignments.'}
        guide={role === 'tutor' ? undefined : 'This is for a human teacher, if you have one. They can send you practice and messages.'}
      />

      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {role === 'tutor' ? (
              <MyStudents currentUserEmail={user.email.toLowerCase().trim()} />
          ) : (
              <MyTutor currentUserEmail={user.email.toLowerCase().trim()} />
          )}
      </div>
    </div>
  );
}