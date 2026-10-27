import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from "sonner";
import { deleteSteps, ACCOUNT_RESET } from '@/lib/deleteMyData';

// Everything the app keeps in this browser: language, target date, voice
// settings, cached translations, civics version, reminders, role cache.
const isAppStorageKey = (key) =>
  key.startsWith('pathways_') ||
  key.startsWith('daily_reminder_') ||
  key.startsWith('role_') ||
  key === 'civicsVersion' ||
  key === 'pending_tutor_invite';

function clearDeviceData() {
  try {
    Object.keys(localStorage).filter(isAppStorageKey).forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    // Storage blocked: nothing to clear.
  }
}

export default function DeleteMyData({ userEmail }) {
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    const steps = deleteSteps(userEmail);

    try {
      for (let i = 0; i < steps.length; i++) {
        setProgress(`Removing ${steps[i][0]} (${i + 1}/${steps.length})...`);
        await base44.entities[steps[i][1]].deleteMany(steps[i][2]);
      }
      // The sign-in account itself can't be deleted from the app, so reset
      // the learner fields stored on it.
      setProgress('Resetting your account details...');
      await base44.auth.updateMe(ACCOUNT_RESET);
      clearDeviceData();
      setProgress('Done. Signing you out...');
      toast.success("Your data has been deleted. You are being signed out.");
      setTimeout(async () => { await base44.auth.logout(); }, 1500);
    } catch (err) {
      console.error("Error deleting user data", err);
      toast.error("Something went wrong while deleting your data. Please try again.");
      setDeleting(false);
      setProgress('');
    }
  };

  return (
    <Card className="border-2 border-pw-red-ink/40 bg-pw-red-soft/40">
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-xl text-pw-red-ink">
          <span className="w-10 h-10 rounded-2xl bg-pw-red-soft text-pw-red-ink grid place-items-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </span>
          Delete My Data
        </CardTitle>
        <CardDescription className="text-pw-navy">
          Permanently erase everything tied to your email: your chat messages (including the copies in the other person's history),
          AI study buddy history, lesson notes, progress & quiz scores, mock interview scores, N-400 guide section completion, assignments,
          tutor connections, notifications, saved places, your answers to the "Help us improve Pathways" questions, the days you used the app, and your profile. Your points, badges, display name, tutor settings, quick check levels, state, program code and reminder setting are reset, and the app's data on
          this device (your target date, language, and settings) is cleared. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
        {deleting ? (
          <p role="status" className="text-base font-bold text-pw-red-ink flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> {progress}
          </p>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete all my data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-pw-red-ink">Delete all your data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes your chats, study history, notes, progress, interview scores, assignments, check-in answers, activity dates, and profile from Pathways USA, and clears the app's data on this device.
                  Your saved representatives information is included. This action cannot be undone — you'll be signed out afterwards.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); handleDelete(); }}
                  className="bg-pw-red-ink text-white hover:bg-pw-red-deep"
                >
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}