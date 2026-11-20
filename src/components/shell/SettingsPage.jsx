import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/api/auth';
import { Button } from '@/components/pathways/ui';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import VoiceSettings from '@/components/utils/VoiceSettings';
import TextSizePicker from '@/components/persona/TextSizePicker';
import TutorSetup from '@/components/persona/TutorSetup';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { useAutoReadSetting } from '@/components/persona/useAutoRead';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import PilotSettingsCard from '@/components/pilot/PilotSettingsCard';
import DeleteMyData from '@/components/profile/DeleteMyData';
import ProgramCard from '@/components/partners/ProgramCard';
import TalkToPerson from '@/components/ai/TalkToPerson';
import { StudyTogetherCard } from '@/components/home/StudyTogether';
import WhatWeSave from '@/components/shell/WhatWeSave';
import { openNotifications } from '@/components/notifications/NotificationCenter';
import { Switch } from '@/components/ui/switch';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { profile as profileApi } from '@/api/profile';
import { dailyReminderOn, setDailyReminder } from '@/lib/reminderSetting';
import { listPartners, loadMembership, normalizeCode, staffPrograms } from '@/lib/partners';
import { PROCESSING_TIMES, canSeeSampleOffices, savedRange } from '@/lib/interviewEstimate';
import { SETTINGS_LINKS } from '@/lib/shellRoutes';
import { reviewedFaq } from '@/lib/faq';

// Settings (Amio v2, frame MeSettings), from the button on Me. A paper header:
// Back, Amio beside the learner's name, and "Edit name". Then white groups of rows:
//   Language · Daily reminder (On / Off) · Your interview · My tutor · Your plan
//   Sound and voice · How Amio talks
//   Questions and answers (hidden until an entry is reviewed) · How Amio works
//   · Contact us · Help us improve Amio
//   What we save · AI policy · Delete all my data (navy, never red)
//   More: history, notifications, partner (staff), admin (admins) · Sign out
// Every setting from the old Settings and Me pages is here; saving is the
// same as before. #program, #delete-data, #what-we-save and #settings (from
// old addresses) open and scroll to that row.
import { SETTINGS_LINES as LINES } from './shellStrings';
import { Amio } from '@/components/pathways/Amio';

const ROW = 'w-full min-h-[3.25rem] flex items-center gap-3 px-4 py-2 text-start text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-denim';

function Group({ children, label }) {
  return <section aria-label={label} className="rounded-card bg-white border-[1.5px] border-line overflow-hidden divide-y divide-line">{children}</section>;
}

function Label({ children }) {
  return <span className="flex-1 min-w-0 text-base font-semibold break-words">{children}</span>;
}

function Value({ children }) {
  return <span className="shrink-0 max-w-[45%] text-end text-base text-muted break-words" dir="auto">{children}</span>;
}

function LinkRow({ to, label, value, external = false }) {
  const inner = (
    <>
      <Label>{label}</Label>
      {value && <Value>{value}</Value>}
      <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
    </>
  );
  return external
    ? <a href={to} className={ROW}>{inner}</a>
    : <Link to={to} className={ROW}>{inner}</Link>;
}

function ButtonRow({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className={ROW}>
      <Label>{label}</Label>
      <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
    </button>
  );
}

/** A row that opens its setting under it. */
function OpenRow({ id, label, value, open, onToggle, children }) {
  return (
    <div id={id} className="scroll-mt-20">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${id}-panel`} className={ROW}>
        <Label>{label}</Label>
        {value && <Value>{value}</Value>}
        <ChevronDown className={`w-5 h-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <div id={`${id}-panel`} className="px-4 pb-4 pt-1 bg-paper">{children}</div>}
    </div>
  );
}

const HASH_OPENS = { program: 'program', 'delete-data': 'delete-data', 'what-we-save': 'what-we-save' };

export default function SettingsPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [language, setLanguage] = useAppLanguage();
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'settings_v2' });
  const t = (key) => (language !== 'en' && tr(key)) || LINES[key];
  const [readOn, setReadOn] = useAutoReadSetting();
  const [reminderOn, setReminderOn] = useState(dailyReminderOn);
  const { profile, loaded, saveProfile } = useTutorProfile();
  const [savingTutor, setSavingTutor] = useState(false);
  const [user, setUser] = useState(undefined);
  const [publicProfile, setPublicProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [editing, setEditing] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [program, setProgram] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [open, setOpen] = useState(() => new Set(hash ? [HASH_OPENS[decodeURIComponent(hash.slice(1))]].filter(Boolean) : []));
  const toggle = (id) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const faq = reviewedFaq();

  useEffect(() => {
    let active = true;
    auth.me()
      .then(async (u) => {
        if (!active) return;
        setUser(u);
        const found = await profileApi.getPublic().catch(() => null);
        if (!active) return;
        setPublicProfile(found);
        const name = found?.display_name || u.full_name || '';
        setDisplayName(name);
        setSavedName(name);
        const [membership, partners, staff] = await Promise.all([
          loadMembership(u).catch(() => null),
          listPartners().catch(() => []),
          staffPrograms().catch(() => []),
        ]);
        if (!active) return;
        if (membership && membership.status !== 'removed') {
          const p = (partners || []).find((x) => normalizeCode(x.code) === normalizeCode(membership.partner_code));
          setProgram(p?.name || membership.partner_code);
        }
        setIsStaff((staff || []).length > 0);
      })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  // Old addresses (#settings, #program, #delete-data, #what-we-save) scroll there.
  useEffect(() => {
    if (user === undefined || !hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
  }, [user, hash]);

  const saveTutor = async (next) => {
    setSavingTutor(true);
    try {
      await saveProfile(next);
      toast.success('Saved.');
    } catch {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setSavingTutor(false);
    }
  };

  // The public display name and the account's full name, as before.
  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      if (publicProfile) {
        await profileApi.updatePublic(publicProfile.id, { display_name: displayName });
      } else {
        const { profile: created } = await profileApi.savePublic({ display_name: displayName }, {
          points: user.points || 0,
          badges_count: (user.badges || []).length,
        });
        setPublicProfile(created);
      }
      await auth.updateMe({ full_name: displayName });
      setSavedName(displayName);
      setEditing(false);
      toast.success('Saved.');
    } catch {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/me'));
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const range = savedRange(PROCESSING_TIMES, { showSamples: canSeeSampleOffices(user) });
  const monthName = (d) => d.toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'short', year: 'numeric' });
  const links = SETTINGS_LINKS.filter((l) => (l.when === 'staff' ? isStaff : l.when === 'admin' ? user?.role === 'admin' : !!user));

  return (
    <div dir={dir} className="min-h-full bg-paper text-navy">
      {/* The paper header (frame MeSettings): Back, Amio beside the name,
          "Edit name" as a small link; the name form opens under it. */}
      <section aria-labelledby="settings-name">
        <div className="max-w-lg mx-auto px-4 pt-3">
          <button type="button" onClick={back} aria-label={t('back')} className="w-11 h-11 -ms-2 grid place-items-center rounded-button text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
            <ChevronLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
          <div className="mt-1 flex items-center gap-3.5">
            <Amio mood="hello" size={60} className="shrink-0" />
            <div className="min-w-0">
              <p className="sr-only">{t('title')}</p>
              <h1 id="settings-name" className="font-display text-[1.875rem] leading-none tracking-tight text-navy break-words" dir="auto">{savedName || t('title')}</h1>
              {user && !editing && (
                <button type="button" onClick={() => setEditing(true)} className="mt-1 min-h-tap inline-flex items-center px-1 -ms-1 text-[0.875rem] font-semibold text-denim hover:text-navy rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
                  {t('edit_name')}
                </button>
              )}
            </div>
          </div>
          {user && editing && (
            <form onSubmit={saveName} className="mt-3 rounded-card bg-white border-[1.5px] border-line p-4 flex flex-col gap-2">
              <label htmlFor="display-name" className="text-base font-semibold text-navy">{t('your_name')}</label>
              <input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                className="w-full h-[3.25rem] rounded-button border border-line bg-white px-4 text-base text-navy focus:outline-none focus:ring-2 focus:ring-denim"
              />
              <p className="text-small text-muted">{t('your_name_help')}</p>
              <div className="flex gap-2">
                <Button variant="main" type="submit" disabled={savingName} className="px-6">
                  {savingName && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />} {t('save')}
                </Button>
                <button type="button" onClick={() => { setDisplayName(savedName); setEditing(false); }} className="min-h-tap px-4 text-base font-semibold text-denim underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
                  {t('cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">
        <div id="settings" className="scroll-mt-20" />
        <Group label={t('title')}>
          <div className="min-h-[3.25rem] flex items-center gap-3 px-4 py-2">
            <Label>{t('language')}</Label>
            <LanguageSelector compact language={language} onLanguageChange={setLanguage} />
          </div>
          <div className="px-4 py-2">
            <div className="min-h-[2.75rem] flex items-center gap-3">
              <label htmlFor="daily-reminder" className="flex-1 min-w-0 text-base font-semibold">{t('reminder')}</label>
              <span className="text-base text-muted" aria-hidden="true">{reminderOn ? t('on') : t('off')}</span>
              <Switch id="daily-reminder" checked={reminderOn} onCheckedChange={(v) => { setDailyReminder(v); setReminderOn(v); }} className="shrink-0" />
            </div>
            <p className="text-small text-muted">{t('reminder_help')}</p>
          </div>
          <LinkRow to="/interview/when" label={t('your_interview')} value={range ? `${monthName(range.from)} – ${monthName(range.to)}` : t('find_out')} />
          {user && (
            <OpenRow id="program" label={t('my_tutor')} value={program || t('add_code')} open={open.has('program')} onToggle={() => toggle('program')}>
              <ProgramCard user={user} />
            </OpenRow>
          )}
          {user && <LinkRow to="/plan" label={t('your_plan')} />}
        </Group>

        <Group label={t('sound')}>
          <OpenRow id="sound" label={t('sound')} open={open.has('sound')} onToggle={() => toggle('sound')}>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-base font-semibold mb-2">{t('speed')}</p>
                <VoiceSettings />
              </div>
              <TextSizePicker />
              <div>
                <div className="flex items-center gap-3 min-h-tap">
                  <label htmlFor="read-aloud" className="flex-1 min-w-0 text-base font-semibold">{t('read_aloud')}</label>
                  <Switch id="read-aloud" checked={readOn} onCheckedChange={setReadOn} className="shrink-0" />
                </div>
                <p className="text-small text-muted">{t('read_aloud_help')}</p>
              </div>
            </div>
          </OpenRow>
          {user && (
            <OpenRow id="amio-talks" label={t('how_amio_talks')} open={open.has('amio-talks')} onToggle={() => toggle('amio-talks')}>
              {loaded && <TutorSetup key="loaded" initialProfile={profile} onSave={saveTutor} saving={savingTutor} />}
            </OpenRow>
          )}
        </Group>

        <Group label={t('faq')}>
          {faq.length > 0 && (
            <OpenRow id="faq" label={t('faq')} open={open.has('faq')} onToggle={() => toggle('faq')}>
              <dl className="flex flex-col gap-3" lang="en" dir="ltr">
                {faq.map((x) => (
                  <div key={x.id}>
                    <dt className="text-base font-bold">{x.q}</dt>
                    <dd className="text-base">{x.a}</dd>
                  </div>
                ))}
              </dl>
            </OpenRow>
          )}
          <OpenRow id="how-amio-works" label={t('how_amio_works')} open={open.has('how-amio-works')} onToggle={() => toggle('how-amio-works')}>
            <StudyTogetherCard headingLevel={3} />
          </OpenRow>
          {user && <ButtonRow label={t('contact_us')} onClick={() => setTalkOpen(true)} />}
          {user && (
            <OpenRow id="help-us" label={t('help_us')} open={open.has('help-us')} onToggle={() => toggle('help-us')}>
              <PilotSettingsCard user={user} />
            </OpenRow>
          )}
        </Group>

        <Group label={t('what_we_save')}>
          <OpenRow id="what-we-save" label={t('what_we_save')} open={open.has('what-we-save')} onToggle={() => toggle('what-we-save')}>
            <WhatWeSave t={(k) => t(`wws_${k}`)} />
          </OpenRow>
          <LinkRow to="/settings/ai-policy" label={t('ai_policy')} />
          {user?.email && (
            <OpenRow id="delete-data" label={t('delete_data')} open={open.has('delete-data')} onToggle={() => toggle('delete-data')}>
              <DeleteMyData userEmail={user.email} />
            </OpenRow>
          )}
        </Group>

        {user && (
          <Group label={t('more')}>
            {links.map((l) => (l.action === 'notifications'
              ? <ButtonRow key={l.id} label={t(`link_${l.id}`)} onClick={openNotifications} />
              : <LinkRow key={l.id} to={l.path} label={t(`link_${l.id}`)} />))}
            <ButtonRow label={t('sign_out')} onClick={() => auth.signOut()} />
          </Group>
        )}
      </div>

      {user && <TalkToPerson open={talkOpen} onOpenChange={setTalkOpen} userEmail={user.email} language={language} />}
    </div>
  );
}
