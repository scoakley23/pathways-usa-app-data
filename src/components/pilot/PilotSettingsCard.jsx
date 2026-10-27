import React, { useRef, useState } from 'react';
import { Loader2, Save, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PrimaryButton } from '@/components/pathways/ui';
import { buildProfileAnswers, loadPendingCode, clearPendingCode } from '@/lib/pilot';
import useAppLanguage from '@/hooks/useAppLanguage';
import usePilotText from './pilotStrings';
import { StateSelect, ProgramCodeField } from './PilotFields';

// Profile: turn the check-in reminder emails on or off, and change state or
// program code. Learners only.
export default function PilotSettingsCard({ user }) {
  const [language] = useAppLanguage();
  const t = usePilotText(language);
  const [reminders, setReminders] = useState(user?.checkin_email_reminders === true);
  const [programCode, setProgramCode] = useState(() => user?.program_code || loadPendingCode());
  const [state, setState] = useState(user?.state || '');
  const [codeUnknown, setCodeUnknown] = useState(false);
  const codeRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const toggleReminders = async (on) => {
    setReminders(on);
    try {
      await base44.auth.updateMe({ checkin_email_reminders: on });
    } catch (e) {
      setReminders(!on);
      toast.error(t('error'));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const { profile, error } = buildProfileAnswers({ programCode, state });
    if (error) {
      setCodeUnknown(true);
      codeRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await base44.auth.updateMe(profile);
      clearPendingCode();
      toast.success(t('saved'));
    } catch (err) {
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 bg-pw-blue-soft text-pw-blue-ink">
            <ClipboardList className="w-5 h-5" aria-hidden="true" />
          </span>
          {t('card_title')}
        </CardTitle>
        <CardDescription>{t('card_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor="pilot-reminders-switch" className="text-lg font-bold text-pw-navy block">{t('reminders_switch')}</label>
            <p className="text-base text-pw-muted">{t('reminders_help')}</p>
          </div>
          <Switch id="pilot-reminders-switch" checked={reminders} onCheckedChange={toggleReminders} className="mt-1 shrink-0" />
        </div>

        <form onSubmit={save} className="space-y-5">
          <StateSelect id="profile-state" value={state} onChange={setState} t={t} />
          <ProgramCodeField
            id="profile-code"
            value={programCode}
            onChange={(v) => { setProgramCode(v); setCodeUnknown(false); }}
            unknown={codeUnknown}
            inputRef={codeRef}
          inputRef={codeRef}
            t={t}
          />
          <PrimaryButton type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {t('card_save')}
          </PrimaryButton>
        </form>
      </CardContent>
    </Card>
  );
}
