import React, { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card } from '@/components/pathways/ui';
import { Switch } from '@/components/ui/switch';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage from '@/hooks/useAppLanguage';
import { listPartners, loadMembership, joinProgram, leaveProgram, normalizeCode, MAX_NAME_LENGTH } from '@/lib/partners';
import { clearPendingProgram, loadPendingProgram } from '@/lib/programLink';
import { MY_TUTOR_LINES } from '@/components/partners/myTutorStrings';

// "My tutor" on Me (Prompt 11, frame R30Me): the class or program the learner
// studies with. Not in one: "Join with a code from your teacher" → the code
// → that program's name, the optional name for them and (where the program
// allows it) "Share my progress" → Join. In one: its name and status, Change
// (name and sharing) and Leave. Joining goes through the partner function as
// before (src/lib/partners.js); a code from a link or Welcome is filled in.

const FIELD = 'w-full min-h-[52px] rounded-2xl border border-line bg-white px-4 text-base text-navy focus:outline-none focus:ring-2 focus:ring-denim';

export const findProgram = (programs, code) => {
  const want = normalizeCode(code);
  return want ? programs.find((p) => normalizeCode(p.code) === want) || null : null;
};

export default function ProgramCard({ user }) {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(MY_TUTOR_LINES, language, { cacheKey: 'my_tutor_v2' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || MY_TUTOR_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const [partners, setPartners] = useState(null); // null = loading
  const [membership, setMembership] = useState(null);
  const [mode, setMode] = useState('view'); // view | code | form
  const [code, setCode] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [picked, setPicked] = useState(null);
  const [name, setName] = useState('');
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listPartners().catch(() => []), loadMembership(user).catch(() => null)])
      .then(([list, mine]) => {
        if (!active) return;
        setPartners(list);
        setMembership(mine);
        if (!mine && loadPendingProgram()) setCode(loadPendingProgram());
      });
    return () => { active = false; };
  }, [user]);

  if (!partners) return null;

  const current = membership ? (partners.find((p) => normalizeCode(p.code) === normalizeCode(membership.partner_code)) || { code: membership.partner_code, name: membership.partner_code, shareLearners: false }) : null;

  const openForm = (program, from = membership) => {
    setPicked(program);
    setName(from?.display_name || '');
    setShare(from?.share_progress === true);
    setMode('form');
  };
  const find = (e) => {
    e.preventDefault();
    const found = findProgram(partners, code);
    if (!found) { setNotFound(true); return; }
    setNotFound(false);
    openForm(found, null);
  };
  const run = async (fn) => {
    setSaving(true);
    try { await fn(); clearPendingProgram(); toast.success(t('saved')); } catch (err) { toast.error(t('error')); } finally { setSaving(false); }
  };
  const save = (e) => {
    e.preventDefault();
    run(async () => { setMembership(await joinProgram(picked.code, { name, share })); setMode('view'); });
  };
  const leave = () => run(async () => { await leaveProgram(user); setMembership(null); setCode(''); setMode('view'); });

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-2xl bg-tint text-denim"><Users className="w-5 h-5" aria-hidden="true" /></span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-navy">{t('title')}</h2>
          {mode === 'view' && current && <p className="text-base font-semibold text-navy break-words">{current.name}</p>}
          {mode === 'view' && !current && <p className="text-base text-muted">{t('join_help')}</p>}
        </div>
        {mode === 'view' && !current && <Button variant="second" className="shrink-0" onClick={() => setMode('code')}>{t('add')}</Button>}
        {mode === 'view' && current && <Button variant="second" className="shrink-0" onClick={() => openForm(current)}>{t('change')}</Button>}
      </div>

      {mode === 'view' && current && ['pending', 'confirmed', 'removed'].includes(membership.status) && (
        <p className="mt-3 rounded-2xl bg-tint px-4 py-3 text-base text-navy" role="status">{t(membership.status, { program: current.name })}</p>
      )}

      {mode === 'code' && (
        <form onSubmit={find} className="mt-4 flex flex-col gap-3">
          <label htmlFor="my-tutor-code" className="text-base font-semibold text-navy">{t('code_label')}</label>
          <input id="my-tutor-code" value={code} onChange={(e) => { setCode(e.target.value); setNotFound(false); }} autoComplete="off" autoCapitalize="characters" maxLength={40} dir="ltr" aria-invalid={notFound} className={`${FIELD} font-bold uppercase tracking-wide`} />
          {notFound && <p role="alert" className="text-base font-semibold text-not-yet">{t('not_found')}</p>}
          <Button variant="main" type="submit" className="w-full" disabled={!code.trim()}>{t('find')}</Button>
          <Button variant="link" type="button" className="self-center" onClick={() => { setMode('view'); setNotFound(false); }}>{t('cancel')}</Button>
        </form>
      )}

      {mode === 'form' && picked && (
        <form onSubmit={save} className="mt-4 flex flex-col gap-4">
          <p className="text-lg font-bold text-navy break-words">{picked.name}</p>
          <p className="text-base text-muted">{t('privacy')}</p>
          <div className="flex flex-col gap-2">
            <label htmlFor="my-tutor-name" className="text-base font-semibold text-navy">{t('name_label')}</label>
            <p id="my-tutor-name-help" className="text-small text-muted">{t('name_help', { program: picked.name })}</p>
            <input id="my-tutor-name" value={name} maxLength={MAX_NAME_LENGTH} autoComplete="name" aria-describedby="my-tutor-name-help" onChange={(e) => setName(e.target.value)} className={FIELD} />
          </div>
          {picked.shareLearners && (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <label htmlFor="my-tutor-share" className="text-base font-semibold text-navy">{t('share', { program: picked.name })}</label>
                <p className="text-small text-muted">{t('share_help')}</p>
              </div>
              <Switch id="my-tutor-share" checked={share} onCheckedChange={setShare} className="mt-1 shrink-0" />
            </div>
          )}
          <Button variant="main" type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}{membership ? t('save') : t('join')}
          </Button>
          <div className="flex flex-wrap justify-center gap-2">
            {membership && <Button variant="link" type="button" onClick={leave} disabled={saving}>{t('leave')}</Button>}
            <Button variant="link" type="button" onClick={() => setMode('view')}>{t('cancel')}</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
