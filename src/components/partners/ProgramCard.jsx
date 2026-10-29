import React, { useEffect, useState } from 'react';
import { Loader2, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PrimaryButton } from '@/components/pathways/ui';
import { listPartners, loadMembership, joinProgram, leaveProgram } from '@/lib/partners';
import { clearPendingProgram } from '@/lib/programLink';
import { MAX_NAME_LENGTH } from '../../../base44/shared/partners.js';

const LABEL = 'text-lg font-bold text-pw-navy block';
const FIELD = 'w-full min-h-11 rounded-xl border-2 border-pw-line bg-white px-3 text-base text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy';

const STATUS_LINE = {
  pending: (name) => `Waiting for ${name} to confirm it's you.`,
  confirmed: (name) => `${name} confirmed you.`,
  removed: (name) => `${name} didn't find you on their list. If that's a mistake, choose it again or talk to them.`,
};

// Profile: which partner program the learner studies with (or none), the
// optional name the program sees, and whether to share their own progress
// where the program allows it. Shown only when there are partner programs.
export default function ProgramCard({ user }) {
  const [partners, setPartners] = useState(null); // null = loading
  const [membership, setMembership] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listPartners(), loadMembership(user)])
      .then(([list, mine]) => {
        if (!active) return;
        setPartners(list);
        setMembership(mine);
        setCode(mine?.partner_code || '');
        setName(mine?.display_name || '');
        setShare(mine?.share_progress === true);
      })
      .catch(() => { if (active) setPartners([]); });
    return () => { active = false; };
  }, [user]);

  if (!partners || (partners.length === 0 && !membership)) return null;

  const options = membership && !partners.some((p) => p.code === membership.partner_code)
    ? [...partners, { code: membership.partner_code, name: membership.partner_code, shareLearners: false }]
    : partners;
  const picked = options.find((p) => p.code === code) || null;
  const current = options.find((p) => p.code === membership?.partner_code);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (picked) {
        setMembership(await joinProgram(picked.code, { name, share }));
      } else {
        await leaveProgram(user);
        setMembership(null);
        setName('');
        setShare(false);
      }
      clearPendingProgram();
      toast.success('Saved.');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 bg-pw-blue-soft text-pw-blue-ink">
            <Users className="w-5 h-5" aria-hidden="true" />
          </span>
          Your program
        </CardTitle>
        <CardDescription>
          The class or program you study with, if any. They see your name (or your email) to confirm it's you, and totals for all their learners. Never your answers or your chats with your tutor.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
        <form onSubmit={save} className="space-y-5">
          {current && STATUS_LINE[membership.status] && (
            <p className="rounded-2xl bg-pw-soft px-4 py-3 text-base text-pw-navy" role="status">
              {STATUS_LINE[membership.status](current.name)}
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor="profile-program" className={LABEL}>Program</label>
            <select id="profile-program" value={code} onChange={(e) => { setCode(e.target.value); setShare(false); }} className={FIELD}>
              <option value="">Not in a program</option>
              {options.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          {picked && (
            <div className="space-y-2">
              <label htmlFor="profile-program-name" className={LABEL}>Your name (optional)</label>
              <p id="profile-program-name-help" className="text-base text-pw-muted">So {picked.name} knows it's you. If you leave it blank, they see your email.</p>
              <input
                id="profile-program-name"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="name"
                aria-describedby="profile-program-name-help"
                onChange={(e) => setName(e.target.value)}
                className={FIELD}
              />
            </div>
          )}
          {picked?.shareLearners && (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <label htmlFor="profile-program-share" className={LABEL}>Share my progress with {picked.name}</label>
                <p className="text-base text-pw-muted">They would see your quick check levels, the lessons you finished and the N-400 sections you read.</p>
              </div>
              <Switch id="profile-program-share" checked={share} onCheckedChange={setShare} className="mt-1 shrink-0" />
            </div>
          )}
          <PrimaryButton type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            Save
          </PrimaryButton>
        </form>
      </CardContent>
    </Card>
  );
}
