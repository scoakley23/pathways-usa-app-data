import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button, Card, Eyebrow } from '@/components/pathways/ui';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import VoiceSettings from '@/components/utils/VoiceSettings';
import TextSizePicker from '@/components/persona/TextSizePicker';
import TutorSetup from '@/components/persona/TutorSetup';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { useAutoReadSetting } from '@/components/persona/useAutoRead';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import PilotSettingsCard from '@/components/pilot/PilotSettingsCard';
import DeleteMyData from '@/components/profile/DeleteMyData';
import { StudyTogetherCard } from '@/components/home/StudyTogether';
import WhatWeSave, { WHAT_WE_SAVE_LINES } from '@/components/shell/WhatWeSave';
import { Switch } from '@/components/ui/switch';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { ensurePublicProfile } from '@/lib/profileService';

// Settings and privacy (frame R30Settings), under Me: everything that was a
// setting on the old Profile page, then "What we save" and "Delete all my
// data". Same settings, same saving as before. Left out: the frame's
// "Daily reminder · time" row (there is no reminder time; the in-app daily
// reminder keeps working on its own).
const LINES = {
  title: 'Settings and privacy',
  language: 'Language',
  speed: 'Amio’s speaking speed',
  read_aloud: 'Read everything out loud',
  read_aloud_help: 'Amio reads each message aloud in the quick check and lessons. Saved on this phone.',
  how_amio_talks: 'How Amio talks',
  your_name: 'Your name',
  your_name_help: 'Shown on your Me page.',
  save: 'Save',
  ...Object.fromEntries(Object.entries(WHAT_WE_SAVE_LINES).map(([k, v]) => [`wws_${k}`, v])),
};

function Row({ label, htmlFor, children, help }) {
  return (
    <div className="py-3 border-b border-line last:border-b-0">
      <div className="flex items-center justify-between gap-3 min-h-tap">
        {htmlFor
          ? <label htmlFor={htmlFor} className="text-base text-navy">{label}</label>
          : <span className="text-base text-navy">{label}</span>}
        {children}
      </div>
      {help && <p className="text-small text-muted">{help}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [language, setLanguage] = useAppLanguage();
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'settings_v1' });
  const t = (key) => (language !== 'en' && tr(key)) || LINES[key];
  const [readOn, setReadOn] = useAutoReadSetting();
  const { profile, loaded, saveProfile } = useTutorProfile();
  const [savingTutor, setSavingTutor] = useState(false);
  const [user, setUser] = useState(undefined);
  const [publicProfile, setPublicProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then(async (u) => {
        if (!active) return;
        setUser(u);
        const profiles = await base44.entities.PublicProfile.filter({ user_email: u.email.toLowerCase().trim() }).catch(() => []);
        if (!active) return;
        setPublicProfile(profiles[0] || null);
        setDisplayName(profiles[0]?.display_name || u.full_name || '');
      })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  // #settings / #delete-data (from the old Profile address) scroll there.
  useEffect(() => {
    if (user === undefined || !hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
  }, [user, hash]);

  const saveTutor = async (next) => {
    setSavingTutor(true);
    try {
      await saveProfile(next);
      toast.success('Saved.');
    } catch (e) {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setSavingTutor(false);
    }
  };

  // Same as the old Profile's "Edit Profile": the public display name and
  // the account's full name.
  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      if (publicProfile) {
        await base44.entities.PublicProfile.update(publicProfile.id, { display_name: displayName });
      } else {
        const { profile: created } = await ensurePublicProfile(user.email, {
          display_name: displayName,
          points: user.points || 0,
          badges_count: (user.badges || []).length,
        });
        setPublicProfile(created);
      }
      await base44.auth.updateMe({ full_name: displayName });
      toast.success('Saved.');
    } catch (error) {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/me'));
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <NavyBanner
        title={t('title')}
        left={(
          <button type="button" onClick={back} aria-label="Back" className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
        )}
      />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <Card id="settings" padding="px-5 py-2" className="scroll-mt-20">
          <Row label={t('language')}>
            <LanguageSelector compact language={language} onLanguageChange={setLanguage} />
          </Row>
          <div className="py-3 border-b border-line">
            <p className="text-base text-navy mb-2">{t('speed')}</p>
            <VoiceSettings />
          </div>
          <TextSizePicker className="py-3 border-b border-line" />
          <Row label={t('read_aloud')} htmlFor="read-aloud" help={t('read_aloud_help')}>
            <Switch id="read-aloud" checked={readOn} onCheckedChange={setReadOn} className="shrink-0" />
          </Row>
        </Card>

        {user && (
          <>
            <Card>
              <Eyebrow>{t('how_amio_talks')}</Eyebrow>
              <div className="mt-3">
                {loaded && <TutorSetup key="loaded" initialProfile={profile} onSave={saveTutor} saving={savingTutor} />}
              </div>
            </Card>

            <Card>
              <form onSubmit={saveName} className="space-y-2">
                <label htmlFor="display-name" className="block text-label uppercase text-ink-label">{t('your_name')}</label>
                <p className="text-small text-muted">{t('your_name_help')}</p>
                <div className="flex items-center gap-2">
                  <input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    className="flex-1 min-w-0 h-[52px] rounded-button border border-line bg-white px-4 text-base text-navy focus:outline-none focus:ring-2 focus:ring-denim"
                  />
                  <Button variant="second" type="submit" disabled={savingName} className="shrink-0 min-h-[52px] px-5">
                    {savingName && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />} {t('save')}
                  </Button>
                </div>
              </form>
            </Card>

            <PilotSettingsCard user={user} />
          </>
        )}

        <StudyTogetherCard />

        <WhatWeSave t={(k) => t(`wws_${k}`)} />

        {user?.email && (
          <div id="delete-data" className="scroll-mt-20">
            <DeleteMyData userEmail={user.email} />
          </div>
        )}
      </div>
    </div>
  );
}
