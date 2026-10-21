import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TutorSetup from './TutorSetup';
import TutorAvatar from './TutorAvatar';
import TextSizePicker from './TextSizePicker';
import useTutorProfile from './useTutorProfile';
import { DEFAULT_TUTOR_PROFILE } from '@/lib/tutorPersona';

// Shown once to new learners after they pick the student role. Skipping saves
// the defaults so it doesn't come back.
export default function TutorOnboardingDialog({ onDone }) {
  const { profile, hasProfile, loaded, saveProfile } = useTutorProfile();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded && hasProfile) onDone();
  }, [loaded, hasProfile, onDone]);

  const finish = async (next) => {
    setSaving(true);
    try {
      await saveProfile(next); // hasProfile turns true, and the effect above closes the dialog
    } catch (e) {
      toast.error("Couldn't save your tutor. You can change it later in Profile.");
      onDone();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || hasProfile) return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) finish(DEFAULT_TUTOR_PROFILE); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <TutorAvatar avatar={profile.avatar} size={64} decorative expression="greeting" />
            <DialogTitle className="text-2xl font-extrabold text-pw-navy">Meet {profile.name}, your tutor</DialogTitle>
          </div>
          <DialogDescription className="text-base text-pw-muted">
            {profile.name} will be your teacher: explaining each step, practicing with you, and guiding you to your interview. You can change your tutor's name, picture, and way of talking now or any time in Profile.
          </DialogDescription>
        </DialogHeader>
        <TextSizePicker className="pb-4 border-b border-pw-line" />
        <TutorSetup
          initialProfile={profile}
          onSave={finish}
          onSkip={() => finish(DEFAULT_TUTOR_PROFILE)}
          saveLabel="Use these settings"
          saving={saving}
        />
      </DialogContent>
    </Dialog>
  );
}
