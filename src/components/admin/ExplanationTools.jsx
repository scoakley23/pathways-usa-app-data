import React, { useRef, useState } from 'react';
import { Download, Loader2, Square, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Eyebrow, PrimaryButton, RaisedCard, SecondaryButton, QuietButton } from '@/components/pathways/ui';
import { EXPLANATIONS } from '@/lib/explanations';
import { splitOfficialAnswers } from '@/lib/practiceChecks';

// Admin-only tools for lesson explanations (Prompt 7). Workflow:
// 1) Export the official 2025 questions → commit as content/civics/questions-2025.json
// 2) Draft explanations with the AI → commit as content/explanations/<lang>.json
// 3) A person reviews each entry (content/explanations/REVIEW.md) and marks it "reviewed".
// The AI writes ONLY `explanation` and `keyWords`; `question` and `answers`
// are copied from the CivicsQuestion record, never from AI output.

const DRAFT_LANGUAGES = [
  { value: 'en', label: 'English', name: 'English' },
  { value: 'es', label: 'Español', name: 'Spanish' },
];

const storeKey = (lang) => `pathways_admin_explanation_drafts_${lang}`;
const loadSaved = (lang) => {
  try { return JSON.parse(localStorage.getItem(storeKey(lang)) || '{}') || {}; } catch (e) { return {}; }
};
const saveDrafts = (lang, drafts) => {
  try { localStorage.setItem(storeKey(lang), JSON.stringify(drafts)); } catch (e) { /* storage unavailable */ }
};
const clearSaved = (lang) => {
  try { localStorage.removeItem(storeKey(lang)); } catch (e) { /* storage unavailable */ }
};

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function downloadJson(filename, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const load2025 = async () => {
  const records = await base44.entities.CivicsQuestion.filter({ version: '2025' }, null, 500);
  return records.filter((q) => q.question && q.answer).sort((a, b) => byText(a.question, b.question));
};

function buildPrompt(record, answers, languageName) {
  return `You are writing a short lesson for adults preparing for the U.S. citizenship (naturalization) civics test in the free education app Pathways USA. Pathways USA is not a legal service.

OFFICIAL USCIS QUESTION (do not change it):
${record.question}

OFFICIAL ACCEPTED ANSWERS (do not change, add to, or remove from them):
${answers.map((a) => `- ${a}`).join('\n')}

Write in ${languageName}:
1. "explanation": 3 to 5 short sentences, CEFR level A2 to B1 (short sentences, common words). Explain what the question is about and why the official answer is the answer. Help the learner remember it.
2. "keyWords": 2 to 5 important words or short phrases. Copy each "en" EXACTLY from the official English question or accepted answers above. "translation" is its meaning in ${languageName}${languageName === 'English' ? ' (write the same word again)' : ''}.

RULES:
- Never change the official answer. Do not add other answers or say that another answer is accepted.
- If the answers say "Answers change" or "Answers vary", do not name any person as the answer. Say the answer changes (check uscis.gov/citizenship/testupdates) or depends on where the learner lives.
- Be accurate, neutral, respectful, and adult. No political opinions, no jokes.
- No legal advice. Never tell the learner how to answer questions about their own life or history, or whether they are eligible.
${languageName === 'Spanish' ? '- Use "usted". Keep official English names (like "the Constitution") in English after the Spanish word when helpful.\n' : ''}`;
}

const SCHEMA = {
  type: 'object',
  properties: {
    explanation: { type: 'string' },
    keyWords: {
      type: 'array',
      items: { type: 'object', properties: { en: { type: 'string' }, translation: { type: 'string' } }, required: ['en', 'translation'] },
    },
  },
  required: ['explanation', 'keyWords'],
};

// Keep only key words that really appear in the official text.
function cleanKeyWords(keyWords, record, answers, lang) {
  const source = `${record.question} ${answers.join(' ')}`.toLowerCase();
  const seen = new Set();
  const out = [];
  for (const k of Array.isArray(keyWords) ? keyWords : []) {
    const en = String(k?.en || '').trim();
    const translation = String(k?.translation || '').trim();
    if (!en || !source.includes(en.toLowerCase()) || seen.has(en.toLowerCase())) continue;
    seen.add(en.toLowerCase());
    out.push({ en, translation: lang === 'en' ? en : translation || en });
  }
  return out.slice(0, 5);
}

export default function ExplanationTools() {
  const [lang, setLang] = useState('es');
  const [exporting, setExporting] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total, skipped, failed, current }
  const [drafts, setDrafts] = useState(() => loadSaved('es'));
  const stopRef = useRef(false);

  const language = DRAFT_LANGUAGES.find((l) => l.value === lang);
  const inFile = EXPLANATIONS[lang] || {};
  const fileCount = Object.keys(inFile).length;
  const reviewedCount = Object.values(inFile).filter((e) => e?.status === 'reviewed').length;
  const newCount = Object.keys(drafts).filter((k) => !inFile[k]).length;

  const chooseLang = (value) => {
    if (running) return;
    setLang(value);
    setDrafts(loadSaved(value));
    setProgress(null);
  };

  const exportQuestions = async () => {
    setExporting(true);
    try {
      const records = await load2025();
      downloadJson('questions-2025.json', records.map((q) => ({ question: q.question, answer: q.answer, category: q.category || '' })));
      toast.success(`Exported ${records.length} questions.`);
    } catch (e) {
      toast.error("Couldn't export the questions.");
    } finally {
      setExporting(false);
    }
  };

  const draft = async () => {
    stopRef.current = false;
    setRunning(true);
    let current = { ...drafts };
    try {
      const records = await load2025();
      const todo = records.filter((r) => !inFile[r.question] && !current[r.question]);
      const stats = { done: 0, total: todo.length, skipped: records.length - todo.length, failed: 0, current: null };
      setProgress({ ...stats });
      for (const record of todo) {
        if (stopRef.current) break;
        setProgress({ ...stats, current: record.question });
        const answers = splitOfficialAnswers(record.answer);
        try {
          const r = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(record, answers, language.name), response_json_schema: SCHEMA });
          const explanation = String(r?.explanation || '').trim();
          if (!explanation) throw new Error('empty');
          current = {
            ...current,
            [record.question]: {
              question: record.question, // copied from the record, never from the AI
              answers,
              status: 'draft',
              explanation,
              keyWords: cleanKeyWords(r?.keyWords, record, answers, lang),
            },
          };
          setDrafts(current);
          saveDrafts(lang, current);
        } catch (e) {
          stats.failed += 1;
        }
        stats.done += 1;
        setProgress({ ...stats });
      }
      setProgress({ ...stats, current: null });
    } catch (e) {
      toast.error("Couldn't load the questions.");
    } finally {
      setRunning(false);
    }
  };

  // The whole file: what is already committed plus the new drafts.
  const downloadDrafts = () => {
    const merged = { ...drafts, ...inFile };
    const sorted = Object.fromEntries(Object.keys(merged).sort(byText).map((k) => [k, merged[k]]));
    downloadJson(`${lang}.json`, sorted);
  };

  const clearDrafts = () => {
    if (!window.confirm(`Clear the ${newCount} saved ${language.label} drafts on this device?`)) return;
    clearSaved(lang);
    setDrafts({});
    setProgress(null);
  };

  return (
    <section aria-labelledby="explanations-heading" className="space-y-4 text-pw-navy">
      <div>
        <h2 id="explanations-heading" className="text-2xl font-extrabold">Lesson explanations</h2>
        <p className="text-base text-pw-muted mt-1">
          Export the official questions, draft explanations with AI, then review them by hand
          (see <code className="text-sm">content/explanations/REVIEW.md</code>). Learners see only reviewed ones.
        </p>
      </div>

      <RaisedCard className="space-y-3">
        <Eyebrow>Step 1 · Official questions</Eyebrow>
        <p className="text-base">Download the 2025 questions and commit the file as <code className="text-sm break-all">content/civics/questions-2025.json</code>.</p>
        <SecondaryButton className="w-full sm:w-auto" onClick={exportQuestions} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
          Export 2025 questions (JSON)
        </SecondaryButton>
      </RaisedCard>

      <RaisedCard className="space-y-4">
        <Eyebrow>Step 2 · Draft explanations</Eyebrow>
        <div role="group" aria-label="Language" className="grid grid-cols-2 gap-2">
          {DRAFT_LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => chooseLang(l.value)}
              aria-pressed={lang === l.value}
              disabled={running}
              className={`min-h-[44px] rounded-2xl border-2 px-3 text-base font-bold transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${lang === l.value ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy'}`}
            >
              {l.label} <span className="font-semibold text-pw-muted">({l.value}.json)</span>
            </button>
          ))}
        </div>
        <p className="text-base text-pw-muted">
          In the file now: {fileCount} ({reviewedCount} reviewed). New drafts on this device: {newCount}.
          Questions already in the file or drafted are skipped, so you can stop and continue later.
        </p>

        {progress && (
          <div className="rounded-2xl bg-pw-soft p-4 space-y-2" aria-live="polite">
            <div className="h-2 rounded-full bg-pw-line overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done} aria-label="Drafting progress">
              <div className="h-full rounded-full bg-pw-navy transition-all" style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 100}%` }} />
            </div>
            <p className="text-base font-bold">{progress.done} of {progress.total} drafted</p>
            <p className="text-sm text-pw-muted">
              {progress.skipped} skipped (already done){progress.failed ? ` · ${progress.failed} failed (run again to retry)` : ''}
            </p>
            {progress.current && <p className="text-sm text-pw-muted truncate">Now: {progress.current}</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {running ? (
            <SecondaryButton className="w-full sm:w-auto" onClick={() => { stopRef.current = true; }}>
              <Square className="w-4 h-4" aria-hidden="true" /> Stop after this question
            </SecondaryButton>
          ) : (
            <PrimaryButton className="w-full sm:w-auto" onClick={draft}>
              <Wand2 className="w-4 h-4" aria-hidden="true" /> Draft explanations
            </PrimaryButton>
          )}
          <SecondaryButton className="w-full sm:w-auto" onClick={downloadDrafts} disabled={running}>
            <Download className="w-4 h-4" aria-hidden="true" /> Download {lang}.json
          </SecondaryButton>
          {newCount > 0 && !running && (
            <QuietButton className="w-full sm:w-auto" onClick={clearDrafts}>Clear saved drafts</QuietButton>
          )}
        </div>
        <p className="text-sm text-pw-muted">
          Replace <code>content/explanations/{lang}.json</code> with the download, commit it, and run <code>npm test</code>.
          New entries are marked &quot;draft&quot; until a person reviews them.
        </p>
      </RaisedCard>
    </section>
  );
}
