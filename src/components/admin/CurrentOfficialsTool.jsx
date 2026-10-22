import React, { useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Eyebrow, RaisedCard, SecondaryButton } from '@/components/pathways/ui';
import { CURRENT_OFFICIALS, findOfficialsProblems } from '@/lib/currentAnswers';
import { downloadJson } from './ExplanationTools';

// Admin-only: the current answers for the "Answers change" civics questions.
// The AI searches uscis.gov and fills in the names; the admin checks them
// against uscis.gov, then downloads current-officials.json and commits it as
// content/civics/current-officials.json. Learners see only committed names.

const FIELDS = [
  { key: 'president', label: 'President of the United States' },
  { key: 'vicePresident', label: 'Vice President of the United States' },
  { key: 'speaker', label: 'Speaker of the House of Representatives' },
  { key: 'chiefJustice', label: 'Chief Justice of the United States' },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function CurrentOfficialsTool() {
  const [answers, setAnswers] = useState({ ...CURRENT_OFFICIALS.answers });
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Go to ${CURRENT_OFFICIALS.source} (the official USCIS "Updates to test answers" page for the civics test). Report, exactly as that page lists them today, the current answers for: the President of the United States, the Vice President of the United States, the Speaker of the House of Representatives, and the Chief Justice of the United States. Use only uscis.gov. If the page does not list one, return an empty string for it.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: Object.fromEntries(FIELDS.map((f) => [f.key, { type: 'string' }])),
          required: FIELDS.map((f) => f.key),
        },
      });
      setAnswers(Object.fromEntries(FIELDS.map((f) => [f.key, String(result?.[f.key] || '').trim()])));
      setChecked(true);
    } catch (e) {
      toast.error("Couldn't check uscis.gov. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const file = { source: CURRENT_OFFICIALS.source, checkedOn: today(), answers };
  const problems = findOfficialsProblems(file);

  return (
    <section aria-labelledby="officials-heading" className="space-y-4 text-pw-navy">
      <div>
        <h2 id="officials-heading" className="text-[28px] font-display font-normal">Current officials</h2>
        <p className="text-base text-pw-muted mt-1">
          Learners see these names for the &quot;Answers change&quot; questions, with the date you checked them.
          {CURRENT_OFFICIALS.checkedOn ? ` Last checked: ${CURRENT_OFFICIALS.checkedOn}.` : ' Not set yet: learners are told to check uscis.gov.'}
        </p>
      </div>
      <RaisedCard className="space-y-4">
        <SecondaryButton className="w-full sm:w-auto" onClick={check} disabled={checking}>
          {checking ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
          Check uscis.gov
        </SecondaryButton>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Eyebrow className="mb-1"><label htmlFor={`official-${f.key}`}>{f.label}</label></Eyebrow>
            <input
              id={`official-${f.key}`}
              type="text"
              value={answers[f.key]}
              onChange={(e) => setAnswers({ ...answers, [f.key]: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-pw-line px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
            />
          </div>
        ))}
        {checked && (
          <p className="text-base">
            Compare every name with{' '}
            <a href={CURRENT_OFFICIALS.source} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2">uscis.gov</a>{' '}
            before you download. The AI can make mistakes.
          </p>
        )}
        <SecondaryButton
          className="w-full sm:w-auto"
          disabled={problems.length > 0}
          onClick={() => downloadJson('current-officials.json', file)}
        >
          <Download className="w-4 h-4" aria-hidden="true" /> Download current-officials.json
        </SecondaryButton>
        <p className="text-sm text-pw-muted">
          Commit the file as <code className="break-all">content/civics/current-officials.json</code> (or send it to Claude). The date is set to today.
        </p>
      </RaisedCard>
    </section>
  );
}
