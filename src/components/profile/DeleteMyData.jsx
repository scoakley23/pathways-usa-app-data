import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/pathways/ui";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { deleteSteps, FUNCTION_STEPS, ACCOUNT_RESET } from '@/lib/deleteMyData';

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
      for (const [label, fn, body] of FUNCTION_STEPS) {
        setProgress(`Removing ${label}...`);
        await base44.functions.invoke(fn, body);
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
    <Card className="space-y-3">
      {/* Settings (frame R30Settings): the short line first, the full list
          on request. What it does is unchanged. */}
      <div>
        <h2 className="text-lg font-bold text-red-text">Delete all my data</h2>
        <p className="text-base text-muted">Erases everything, on our side and on this phone.</p>
      </div>
      <details className="group text-small text-muted">
        <summary className="min-h-tap flex items-center cursor-pointer font-semibold text-navy underline underline-offset-4 decoration-navy/40">What gets erased</summary>
        <p className="mt-1 leading-relaxed">
          Permanently erase everything tied to your email: your chat messages (including the copies in the other person's history),
          your questions to Amio, lesson notes, progress & quiz scores, mock interview scores, N-400 guide section completion, assignments,
          program connections, notifications, saved places, your answers to the "Help us improve Pathways" and check-in questions, the days you used the app, the record of reminder emails sent to you, and your profile. Your points, badges, display name, tutor settings, quick check levels, state, program code, app language and reminder settings are reset, and the app's data on
          this device (your target date, language, and settings) is cleared. This cannot be undone.
        </p>
      </details>
      <div>
        {deleting ? (
          <p role="status" className="text-base font-bold text-pw-red-ink flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> {progress}
          </p>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full min-h-tap">
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
      </div>
    </Card>
  );
}