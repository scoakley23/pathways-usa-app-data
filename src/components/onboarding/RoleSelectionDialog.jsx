import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, School, Check } from 'lucide-react';
import { toast } from "sonner";

export default function RoleSelectionDialog({ isOpen, onComplete, userEmail, userName }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safety check: if profile exists, auto-complete
  React.useEffect(() => {
      const checkExisting = async () => {
          if (!isOpen || !userEmail) return;
          try {
              const normalizedEmail = userEmail.toLowerCase().trim();
              const existing = await base44.entities.PublicProfile.list({
                  query: { user_email: normalizedEmail }
              });
              
              if (existing.length > 0 && existing[0].account_type) {
                  // User already has a role, just use it
                  onComplete(existing[0].account_type);
              }
          } catch (e) {
              console.error("Error checking existing role", e);
          }
      };
      checkExisting();
  }, [isOpen, userEmail, onComplete]);

  const handleSubmit = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);

    const normalizedEmail = userEmail.toLowerCase().trim();

    try {
      // 1. NUKE STRATEGY: Fetch ALL existing profiles for this email
      const existing = await base44.entities.PublicProfile.list({
          query: { user_email: normalizedEmail }
      });

      // 2. Delete ALL of them to ensure a clean slate (fixes "both student and tutor" bug)
      if (existing.length > 0) {
          await Promise.all(existing.map(p => base44.entities.PublicProfile.delete(p.id)));
      }

      // 3. Prepare new clean profile data
      const profileData = {
          user_email: normalizedEmail,
          display_name: userName || normalizedEmail.split('@')[0],
          account_type: selectedRole
      };

      // Generate invite code for tutors
      if (selectedRole === 'tutor') {
           // Attempt to find an existing invite code from the profiles we are about to delete
           // This preserves the code if the user is re-registering or fixing their account
           const existingCode = existing.find(p => p.invite_code)?.invite_code;
           
           if (existingCode) {
               profileData.invite_code = existingCode;
           } else {
               const prefix = normalizedEmail.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X'); 
               const random = Math.floor(1000 + Math.random() * 9000);
               profileData.invite_code = `${prefix}${random}`;
           }
      }

      // 4. Create ONE single source of truth
      await base44.entities.PublicProfile.create(profileData);

      toast.success(`Profile set to: ${selectedRole === 'tutor' ? 'Tutor' : 'Student'}`);
      
      // 5. Update parent state immediately (Optimistic UI) to prevent buffering loop
      if (onComplete) {
          onComplete(selectedRole);
      }
      
    } catch (error) {
      console.error("Error saving role", error);
      toast.error("Failed to save role. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-slate-900">Welcome to Citizenship Learning Hub</h1>
                <p className="text-xl text-slate-600">To get started, please select your role.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={() => setSelectedRole('student')}
                    className={`relative group p-8 rounded-2xl border-2 transition-all duration-300 text-left hover:shadow-lg
                        ${selectedRole === 'student' 
                            ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100 scale-[1.02]' 
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}`}
                >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors
                        ${selectedRole === 'student' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        <School className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">I am a Student</h3>
                    <p className="text-slate-600">I want to practice reading, writing, and civics for my test.</p>
                    {selectedRole === 'student' && (
                        <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                        </div>
                    )}
                </button>

                <button 
                    onClick={() => setSelectedRole('tutor')}
                    className={`relative group p-8 rounded-2xl border-2 transition-all duration-300 text-left hover:shadow-lg
                        ${selectedRole === 'tutor' 
                            ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100 scale-[1.02]' 
                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'}`}
                >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors
                        ${selectedRole === 'tutor' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">I am a Tutor</h3>
                    <p className="text-slate-600">I want to manage my students, assign practice, and track progress.</p>
                     {selectedRole === 'tutor' && (
                        <div className="absolute top-4 right-4 bg-indigo-600 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                        </div>
                    )}
                </button>
            </div>

            <div className="flex flex-col items-center gap-4 pt-8">
                <Button 
                    size="lg" 
                    className="w-full max-w-md h-14 text-lg font-semibold bg-slate-900 hover:bg-slate-800 transition-all"
                    disabled={!selectedRole || isSubmitting}
                    onClick={handleSubmit}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            Setting up your profile...
                        </span>
                    ) : (
                        `Continue as ${selectedRole ? (selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)) : '...'}`
                    )}
                </Button>
                
                <button 
                    onClick={async () => {
                        await base44.auth.logout();
                        window.location.reload();
                    }}
                    className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                >
                    Signed in as {userEmail} • Sign Out
                </button>
            </div>
        </div>
    </div>
  );
}