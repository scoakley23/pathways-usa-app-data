import React, { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import { RaisedCard, PrimaryButton, SecondaryButton, QuietButton, PillButton } from '@/components/pathways/ui';
import { staffPrograms, programMembers, setMemberStatus, programSummaryFor } from '@/lib/partners';
import { ProgramTotals, SharedLearners } from '@/components/partners/ProgramSummary';

// /Partner: for a partner program's staff (Partner.staff_emails). Totals
// over the program's confirmed learners, the learners who chose to share
// their own progress (where the program allows it), and everyone who said
// they study with the program, to confirm or mark "not ours". Staff see the
// name the learner gave (or their email), never answers or chats.

const SECTIONS = [
  { status: 'pending', title: 'Waiting for you', empty: 'No one is waiting.' },
  { status: 'confirmed', title: 'Confirmed', empty: 'No one confirmed yet.' },
  { status: 'removed', title: 'Not ours', empty: 'None.' },
];

const day = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '');

function MemberRow({ member, busy, onSet }) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-pw-line last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold break-words">{member.name}</p>
        {member.since && <p className="text-sm text-pw-muted">Joined {day(member.since)}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        {member.status === 'pending' && (
          <>
            <PrimaryButton disabled={busy} onClick={() => onSet(member, 'confirmed')}><Check className="w-4 h-4" aria-hidden="true" /> Confirm</PrimaryButton>
            <SecondaryButton disabled={busy} onClick={() => onSet(member, 'removed')}><X className="w-4 h-4" aria-hidden="true" /> Not ours</SecondaryButton>
          </>
        )}
        {member.status === 'confirmed' && <QuietButton disabled={busy} onClick={() => onSet(member, 'removed')}>Remove</QuietButton>}
        {member.status === 'removed' && <QuietButton disabled={busy} onClick={() => onSet(member, 'confirmed')}>Confirm instead</QuietButton>}
      </div>
    </li>
  );
}

export default function Partner() {
  const [programs, setPrograms] = useState(null); // null = loading
  const [code, setCode] = useState('');
  const [members, setMembers] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    staffPrograms()
      .then((list) => { setPrograms(list); setCode(list[0]?.code || ''); })
      .catch(() => setPrograms([]));
  }, []);

  useEffect(() => {
    if (!code) return undefined;
    let active = true;
    setMembers(null);
    setSummary(null);
    setError(false);
    programMembers(code)
      .then((list) => { if (active) setMembers(list); })
      .catch(() => { if (active) setError(true); });
    programSummaryFor(code)
      .then((s) => { if (active) setSummary(s); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [code]);

  const onSet = async (member, status) => {
    setBusyId(member.id);
    try {
      const updated = await setMemberStatus(member.id, status);
      setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, ...updated, since: m.since } : m)));
      programSummaryFor(code).then(setSummary).catch(() => {});
    } catch (e) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (programs === null) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-pw-navy" aria-label="Loading" /></div>;
  }

  if (programs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12 text-pw-navy">
        <PageHeader tag="Partner programs" title="For partner programs" />
        <RaisedCard>
          <p className="text-base">This page is for the staff of programs that work with Pathways. If you work with one and can't see your learners, write to the Pathways team.</p>
        </RaisedCard>
      </div>
    );
  }

  const program = programs.find((p) => p.code === code) || programs[0];
  const byStatus = (status) => (members || []).filter((m) => m.status === status);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 text-pw-navy">
      <PageHeader
        tag="Partner"
        title={program.name}
        subtitle="How your learners are doing, and who said they study with you."
      />

      {programs.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Program">
          {programs.map((p) => (
            <PillButton key={p.code} aria-pressed={p.code === code} onClick={() => setCode(p.code)} className={p.code === code ? 'bg-pw-navy text-white' : 'bg-white border border-pw-line'}>
              {p.name}
            </PillButton>
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-base font-semibold text-pw-red-ink">Couldn't load your learners. Please try again.</p>}
      {!members && !error && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-pw-muted" aria-label="Loading" /></div>}

      {summary && <ProgramTotals totals={summary.totals} />}
      {summary && program.shareLearners && <SharedLearners learners={summary.learners} />}

      {members && (
        <div className="space-y-1">
          <h2 className="font-display text-[28px] leading-tight">Who said they study with you</h2>
          <p className="text-base text-pw-muted">Confirm the ones you know, and mark anyone else “Not ours”. Only confirmed learners count above.</p>
        </div>
      )}

      {members && SECTIONS.map(({ status, title, empty }) => {
        const list = byStatus(status);
        return (
          <section key={status} aria-labelledby={`partner-${status}`} className="space-y-2">
            <h3 id={`partner-${status}`} className="text-xl font-bold">
              {title} <span className="font-display font-normal text-pw-muted">{list.length}</span>
            </h3>
            <RaisedCard padding="px-5 py-2">
              {list.length === 0
                ? <p className="py-3 text-base text-pw-muted">{empty}</p>
                : <ul>{list.map((m) => <MemberRow key={m.id} member={m} busy={busyId === m.id} onSet={onSet} />)}</ul>}
            </RaisedCard>
          </section>
        );
      })}

      <p className="text-base text-pw-muted">
        You see the name each learner gave you, or their email. Totals count confirmed learners only. Pathways never shows programs a learner's answers, their chats with the AI tutor, their check-in answers, or anything about their case.
      </p>
    </div>
  );
}
