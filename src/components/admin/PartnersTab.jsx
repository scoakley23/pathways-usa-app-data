import React, { useEffect, useState } from 'react';
import { Copy, Loader2, Pencil, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { RaisedCard, PrimaryButton, SecondaryButton, QuietButton, Tag } from '@/components/pathways/ui';
import { shareLink } from '@/lib/programLink';
import { normalizeCode, normalizeEmail } from '../../../base44/shared/partners.js';

// Admin → Partners: the programs learners can pick in Getting started and
// Profile. Staff emails can open /Partner for their program. Turn a program
// off instead of deleting it.

const LABEL = 'text-base font-bold text-pw-navy block';
const FIELD = 'w-full min-h-11 rounded-xl border-2 border-pw-line bg-white px-3 text-base text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy';
const BLANK = { name: '', code: '', staff: '', share_learners: false, active: true };

const parseEmails = (text) => [...new Set(String(text || '').split(/[\s,;]+/).map(normalizeEmail).filter((e) => e.includes('@')))];

export default function PartnersTab() {
  const [partners, setPartners] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | partner id
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.Partner.list('name', 500).then(setPartners).catch(() => setPartners([]));
  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditing(p ? p.id : 'new');
    setForm(p ? { name: p.name || '', code: p.code || '', staff: (p.staff_emails || []).join('\n'), share_learners: p.share_learners === true, active: p.active !== false } : BLANK);
  };

  const save = async (e) => {
    e.preventDefault();
    const code = normalizeCode(form.code);
    if (!form.name.trim() || !/^[A-Z0-9-]{2,40}$/.test(code)) {
      toast.error('Add a name and a code (letters, numbers and dashes).');
      return;
    }
    if ((partners || []).some((p) => normalizeCode(p.code) === code && p.id !== editing)) {
      toast.error('Another program already uses that code.');
      return;
    }
    const data = { name: form.name.trim(), code, staff_emails: parseEmails(form.staff), share_learners: form.share_learners, active: form.active };
    setSaving(true);
    try {
      if (editing === 'new') await base44.entities.Partner.create(data);
      else await base44.entities.Partner.update(editing, data);
      setEditing(null);
      await load();
      toast.success('Saved.');
    } catch (err) {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copy = (code) => {
    navigator.clipboard?.writeText(shareLink(code)).then(() => toast.success('Link copied.'), () => toast.error("Couldn't copy."));
  };

  if (!partners) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-pw-muted" aria-label="Loading" /></div>;

  return (
    <div className="space-y-4 text-pw-navy">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-pw-muted max-w-2xl">Learners pick these programs in Getting started and Profile. Staff confirm their learners at /Partner.</p>
        {editing === null && <PrimaryButton onClick={() => startEdit(null)}><Plus className="w-4 h-4" aria-hidden="true" /> Add a program</PrimaryButton>}
      </div>

      {editing !== null && (
        <RaisedCard>
          <form onSubmit={save} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="partner-name" className={LABEL}>Name</label>
                <input id="partner-name" className={FIELD} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Harvard Citizenship Tutoring Program" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="partner-code" className={LABEL}>Code</label>
                <input id="partner-code" className={`${FIELD} uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="HARVARD-CTP" autoCapitalize="characters" spellCheck={false} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="partner-staff" className={LABEL}>Staff emails</label>
              <p id="partner-staff-help" className="text-sm text-pw-muted">One per line. These people can open /Partner and confirm learners.</p>
              <textarea id="partner-staff" aria-describedby="partner-staff-help" rows={3} className={`${FIELD} py-2`} value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <label htmlFor="partner-share" className={LABEL}>Learners may share their own progress</label>
                <p className="text-sm text-pw-muted">Off unless this program asked for it. Each learner still chooses.</p>
              </div>
              <Switch id="partner-share" checked={form.share_learners} onCheckedChange={(v) => setForm({ ...form, share_learners: v })} className="mt-1 shrink-0" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <label htmlFor="partner-active" className={LABEL}>Shown to learners</label>
                <p className="text-sm text-pw-muted">Turn off instead of deleting.</p>
              </div>
              <Switch id="partner-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} className="mt-1 shrink-0" />
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />} Save</PrimaryButton>
              <QuietButton onClick={() => setEditing(null)}>Cancel</QuietButton>
            </div>
          </form>
        </RaisedCard>
      )}

      {partners.length === 0 && editing === null && <RaisedCard><p className="text-base text-pw-muted">No programs yet.</p></RaisedCard>}

      <ul className="space-y-3">
        {partners.map((p) => (
          <li key={p.id}>
            <RaisedCard className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-lg font-bold break-words">{p.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Tag>{normalizeCode(p.code)}</Tag>
                  {p.active === false && <Tag>Hidden</Tag>}
                  {p.share_learners && <Tag>Learners may share</Tag>}
                </div>
                <p className="text-sm text-pw-muted break-all">{(p.staff_emails || []).length} staff · {shareLink(p.code)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <SecondaryButton onClick={() => copy(p.code)}><Copy className="w-4 h-4" aria-hidden="true" /> Copy link</SecondaryButton>
                <QuietButton onClick={() => startEdit(p)} aria-label={`Edit ${p.name}`}><Pencil className="w-4 h-4" aria-hidden="true" /> Edit</QuietButton>
              </div>
            </RaisedCard>
          </li>
        ))}
      </ul>
    </div>
  );
}
