import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import TutorAvatar from './TutorAvatar';
import TutorSetup from './TutorSetup';
import useTutorProfile from './useTutorProfile';

// "Your tutor" card on the Profile page.
export default function YourTutorCard() {
  const { profile, loaded, saveProfile } = useTutorProfile();
  const [saving, setSaving] = useState(false);

  const handleSave = async (next) => {
    setSaving(true);
    try {
      const saved = await saveProfile(next);
      toast.success(`Saved. Your tutor is ${saved.name}.`);
    } catch (e) {
      toast.error("Couldn't save your tutor. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <TutorAvatar avatar={profile.avatar} size={40} /> Your tutor
        </CardTitle>
        <CardDescription>Choose your tutor's name, picture, and way of talking.</CardDescription>
      </CardHeader>
      <CardContent>
        {loaded && <TutorSetup key="loaded" initialProfile={profile} onSave={handleSave} saving={saving} />}
      </CardContent>
    </Card>
  );
}
