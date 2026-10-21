import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import TutorAvatar from './TutorAvatar';
import TutorSetup from './TutorSetup';
import useTutorProfile from './useTutorProfile';
import useTextSize from './useTextSize';
import { TEXT_SIZES } from '@/lib/textSize';

// "Your tutor" card on the Profile page.
export default function YourTutorCard() {
  const { profile, loaded, saveProfile } = useTutorProfile();
  const [saving, setSaving] = useState(false);
  const textSize = useTextSize();

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
        <CardTitle className="flex items-center gap-3 text-xl">
          <TutorAvatar avatar={profile.avatar} size={40} /> Your tutor
        </CardTitle>
        <CardDescription>Choose your tutor's name, picture, and way of talking.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
        {loaded && <TutorSetup key="loaded" initialProfile={profile} onSave={handleSave} saving={saving} />}

        <div role="group" aria-labelledby="text-size-label" className="mt-6 pt-6 border-t border-pw-line space-y-2 text-pw-navy">
          <p id="text-size-label" className="font-bold text-base">Text size in lessons</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TEXT_SIZES).map(([id, t]) => (
              <button
                key={id}
                type="button"
                aria-pressed={textSize.size === id}
                onClick={() => textSize.changeSize(id)}
                className={`min-h-[44px] rounded-2xl border-2 px-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 ${
                  textSize.size === id ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-muted'
                }`}
                style={{ fontSize: t.px }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-pw-muted">Saved on this device. Takes effect right away.</p>
        </div>
      </CardContent>
    </Card>
  );
}
