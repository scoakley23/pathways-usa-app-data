import React, { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { joinClassByEmail } from '@/lib/tutorLinks';

const STORAGE_KEY = 'pending_tutor_invite';

function readPending() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function clearPending() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // device storage unavailable; nothing to clear
  }
  const params = new URLSearchParams(window.location.search);
  if (params.has('tutor_invite')) {
    params.delete('tutor_invite');
    const query = params.toString();
    window.history.replaceState({}, document.title, window.location.pathname + (query ? `?${query}` : ''));
  }
}

// A tutor's invite link (?tutor_invite=<tutor email>) asks the student before
// joining, so a forwarded link can't connect them to someone without asking.
export default function TutorInvitePrompt({ search }) {
  const [tutorEmail, setTutorEmail] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(search).get('tutor_invite') || '';
    const email = (fromUrl || readPending()).toLowerCase().trim();
    if (fromUrl) {
      try {
        localStorage.setItem(STORAGE_KEY, email);
      } catch {
        // device storage unavailable; the prompt still shows for this visit
      }
    }
    setTutorEmail(email);
  }, [search]);

  const close = () => {
    clearPending();
    setTutorEmail('');
  };

  const join = async () => {
    setIsJoining(true);
    try {
      const { already } = await joinClassByEmail(tutorEmail);
      toast.success(already ? "You are already in this class." : "You joined the class.");
      close();
    } catch (error) {
      toast.error(error.message || "We couldn't join this class. Please try again.");
      if (error.status === 404) close();
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <AlertDialog open={!!tutorEmail} onOpenChange={(open) => { if (!open && !isJoining) close(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Join this tutor's class?</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            <span className="font-bold text-pw-navy break-all">{tutorEmail}</span> invited you to their class.
            If you join, they can see your practice progress, send you practice, and message you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={isJoining}>Not now</Button>
          <Button onClick={join} disabled={isJoining}>{isJoining ? 'Joining...' : 'Join class'}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
