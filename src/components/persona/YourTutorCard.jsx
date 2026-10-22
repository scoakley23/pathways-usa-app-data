import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import TutorSetup from './TutorSetup';
import useTutorProfile from './useTutorProfile';
import TextSizePicker from './TextSizePicker';
import { Switch } from '@/components/ui/switch';
import { useAutoReadSetting } from './useAutoRead';

// "Your tutor" card on the Profile page.
export default function YourTutorCard() {
  const { profile, loaded, saveProfile } = useTutorProfile();
  const [saving, setSaving] = useState(false);
  const [readOn, setReadOn] = useAutoReadSetting();

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
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="text-xl">Your tutor</CardTitle>
        <CardDescription>Choose your tutor's name and way of talking.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
        {loaded && <TutorSetup key="loaded" initialProfile={profile} onSave={handleSave} saving={saving} />}

        <div className="mt-6 pt-6 border-t border-pw-line flex items-start justify-between gap-4 text-pw-navy">
          <div>
            <label htmlFor="auto-read" className="font-bold text-base">Read out loud for me</label>
            <p className="text-sm text-pw-muted">Your tutor reads each message aloud in the quick check and lessons. Saved on this device.</p>
          </div>
          <Switch id="auto-read" checked={readOn} onCheckedChange={setReadOn} className="mt-1 shrink-0" />
        </div>
        <TextSizePicker className="mt-6 pt-6 border-t border-pw-line" />
      </CardContent>
    </Card>
  );
}
