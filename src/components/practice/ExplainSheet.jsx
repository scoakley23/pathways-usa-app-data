import React from 'react';
import AIExplanation from '@/components/ai/AIExplanation';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { explainText, getExplanation } from '@/lib/explanations';
import usePracticeText from './usePracticeText';

// "Explain it simply" (Amio v2): a plain white card in the result panel with
// Amio's explanation from the existing sources only. First the
// human-reviewed explanation (content/explanations); when there is none and
// the card already offered the on-demand AI explanation (`aiFallback`), that
// same button is shown. Signed "— Amio".
export default function ExplainSheet({ question, answer, aiFallback = false, className = '' }) {
  const [language] = useAppLanguage();
  const { t } = usePracticeText();
  const found = getExplanation(question, language);
  const { text, note } = explainText(found, language);
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  return (
    <section className={`rounded-card bg-white border border-line p-5 flex flex-col gap-2 text-navy ${className}`} aria-label={t('explain')}>
      <h3 className="text-lg font-bold" dir="auto">{t('explain')}</h3>
      {found.source ? (
        <>
          {text.mine && <p dir={dir} className="text-lg leading-relaxed whitespace-pre-line">{text.mine}</p>}
          {text.en && <p lang="en" dir="ltr" className={`leading-relaxed whitespace-pre-line ${text.mine ? 'text-base text-muted' : 'text-lg'}`}>{text.en}</p>}
          {note && <p className="text-base text-muted" dir="auto">{note.mine || note.en}</p>}
        </>
      ) : aiFallback ? (
        <div className="py-2"><AIExplanation question={question} answer={answer} /></div>
      ) : (
        <p className="text-lg leading-relaxed" dir="auto">{text.mine || text.en}</p>
      )}
      <p className="text-base text-muted">— Amio</p>
    </section>
  );
}
