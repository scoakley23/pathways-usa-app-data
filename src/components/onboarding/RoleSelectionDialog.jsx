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

  const handleSubmit = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);

    try {
      // Create or update profile
      // We use list to check existence first since we might need to update if it was auto-created elsewhere
      const existing = await base44.entities.PublicProfile.list({
          query: { user_email: userEmail }
      });

      const profileData = {
          user_email: userEmail,
          display_name: userName || userEmail.split('@')[0],
          account_type: selectedRole
      };

      // Generate invite code for tutors immediately
      if (selectedRole === 'tutor') {
           const prefix = userEmail.substring(0, 3).toUpperCase();
           const random = Math.floor(1000 + Math.random() * 9000);
           profileData.invite_code = `${prefix}${random}`;
      }

      if (existing.length > 0) {
          await base44.entities.PublicProfile.update(existing[0].id, profileData);
      } else {
          await base44.entities.PublicProfile.create(profileData);
      }

      toast.success(`Welcome, ${selectedRole === 'tutor' ? 'Tutor' : 'Student'}!`);
      onComplete(selectedRole);
    } catch (error) {
      console.error("Error saving role", error);
      toast.error("Failed to save role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden"> 
        {/* Hidden close button to force selection */}
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome to Citizenship Learning Hub</DialogTitle>
          <DialogDescription className="text-center text-lg mt-2">
            How will you be using the app?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          <div 
            className={`cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center text-center transition-all hover:border-blue-400 hover:bg-blue-50
              ${selectedRole === 'student' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-offset-2' : 'border-slate-200'}`}
            onClick={() => setSelectedRole('student')}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
               <School className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">I am a Student</h3>
            <p className="text-sm text-slate-500 mt-2">I want to practice for my citizenship test.</p>
          </div>

          <div 
            className={`cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center text-center transition-all hover:border-indigo-400 hover:bg-indigo-50
              ${selectedRole === 'tutor' ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-offset-2' : 'border-slate-200'}`}
            onClick={() => setSelectedRole('tutor')}
          >
             <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
               <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">I am a Tutor</h3>
            <p className="text-sm text-slate-500 mt-2">I want to manage students and assign work.</p>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full text-lg h-12" 
          disabled={!selectedRole || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Setting up...' : `Continue as ${selectedRole ? (selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)) : '...'}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}