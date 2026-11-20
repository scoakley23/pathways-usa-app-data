import React, { useState } from 'react';
import { auth } from '@/api/auth';
import { account } from '@/api/account';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/pathways/ui";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from "sonner";

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
    try {
      // src/api/account.js: Base44 deletes each kind of record and resets the
      // account; Supabase deletes the sign-in and everything with it.
      const { deletedLogin } = await account.deleteAllMyData({ onProgress: setProgress });
      clearDeviceData();
      setProgress('Done. Signing you out...');
      toast.success("Your data has been deleted. You are being signed out.");
      setTimeout(async () => {
        if (!deletedLogin) await auth.signOut();
        window.location.href = '/';
      }, 1500);
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
        <h2 className="text-lg font-bold text-navy">Delete all my data</h2>
        <p className="text-base text-muted">Erases everything, on our side and on this phone.</p>
      </div>
      <details className="group text-small text-muted">
        <summary className="min-h-tap flex items-center cursor-pointer font-semibold text-navy underline underline-offset-4 decoration-navy/40">What gets erased</summary>
        {account.deletesLogin ? (
          <p className="mt-1 leading-relaxed">
            Permanently erase your sign-in and everything tied to it: your questions to Amio, lesson notes, progress and quiz scores,
            mock interview scores, N-400 guide section completion, your program connection, notifications, saved places, your answers to the
            "Help us improve Amio" and check-in questions, the days you used the app, the record of reminder emails sent to you, and your
            profile (name, badges, tutor settings, quick check levels, state, app language and reminder settings). The app's data on this
            device (your target date, language, and settings) is cleared too. To use Amio again you would start fresh. This cannot be undone.
          </p>
        ) : (
          <p className="mt-1 leading-relaxed">
          Permanently erase everything tied to your email: your chat messages (including the copies in the other person's history),
          your questions to Amio, lesson notes, progress & quiz scores, mock interview scores, N-400 guide section completion, assignments,
          program connections, notifications, saved places, your answers to the "Help us improve Amio" and check-in questions, the days you used the app, the record of reminder emails sent to you, and your profile. Your points, badges, display name, tutor settings, quick check levels, state, program code, app language and reminder settings are reset, and the app's data on
          this device (your target date, language, and settings) is cleared. This cannot be undone.
        </p>
        )}
      </details>
      <div>
        {deleting ? (
          <p role="status" className="text-base font-bold text-not-yet flex items-center gap-2">
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
                <AlertDialogTitle className="text-not-yet">Delete all your data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes your chats, study history, notes, progress, interview scores, assignments, check-in answers, activity dates, and profile from Pathways USA, and clears the app's data on this device.
                  Your saved representatives information is included. This action cannot be undone — you'll be signed out afterwards.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); handleDelete(); }}
                  className="bg-not-yet text-white hover:bg-not-yet"
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