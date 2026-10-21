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
    const email = userEmail.toLowerCase().trim();
    const variants = [...new Set([email, userEmail])];

    const steps = [
      ['chat messages', 'Message', { $or: variants.flatMap(v => [{ sender_email: v }, { receiver_email: v }]) }],
      ['AI study buddy history', 'AIStudyLog', { user_email: { $in: variants } }],
      ['lesson notes', 'LessonNotes', { user_email: { $in: variants } }],
      ['lesson progress & quiz history', 'LessonProgress', { user_email: { $in: variants } }],
      ['practice progress', 'UserProgress', { user_email: { $in: variants } }],
      ['assignments', 'Assignment', { $or: variants.flatMap(v => [{ student_email: v }, { tutor_email: v }]) }],
      ['tutor connections', 'TutorRelationship', { $or: variants.flatMap(v => [{ tutor_email: v }, { student_email: v }]) }],
      ['notifications', 'Notification', { user_email: { $in: variants } }],
      ['interview history', 'InterviewSession', { user_email: { $in: variants } }],
      ['profile', 'PublicProfile', { user_email: { $in: variants } }],
      ['N-400 guide progress', 'N400SectionProgress', { user_email: { $in: variants } }],
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setProgress(`Removing ${steps[i][0]} (${i + 1}/${steps.length})...`);
        await base44.entities[steps[i][1]].deleteMany(steps[i][2]);
      }
      // The sign-in account itself can't be deleted from the app, so reset
      // the learner fields stored on it.
      setProgress('Resetting your account details...');
      await base44.auth.updateMe({ display_name: 'Learner', points: 0, badges: [], max_streak: 0, tutor_profile: null });
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
    <Card className="border-red-200 bg-red-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" /> Delete My Data
        </CardTitle>
        <CardDescription>
          Permanently erase everything tied to your email: your chat messages (including the copies in the other person's history),
          AI study buddy history, lesson notes, progress & quiz scores, mock interview scores, N-400 guide section completion, assignments,
          tutor connections, notifications, and your profile. Your points, badges, display name, and tutor settings are reset, and the app's data on
          this device (your target date, language, and settings) is cleared. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {deleting ? (
          <p className="text-sm text-red-700 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> {progress}
          </p>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete all my data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all your data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes your chats, study history, notes, progress, interview scores, assignments, and profile from Pathways USA, and clears the app's data on this device.
                  Your saved representatives information is included. This action cannot be undone — you'll be signed out afterwards.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); handleDelete(); }}
                  className="bg-red-600 hover:bg-red-700"
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