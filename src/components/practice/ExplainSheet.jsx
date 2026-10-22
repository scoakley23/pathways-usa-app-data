import React from 'react';
import AIExplanation from '@/components/ai/AIExplanation';
import useTutorProfile from '@/components/persona/useTutorProfile';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { explainText, getExplanation } from '@/lib/explanations';

// "Explain it simply": a white sheet under a poster with Vía's explanation
// from the existing sources only. First the human-reviewed explanation
// (content/explanations); when there is none and the card already offered
// the on-demand AI explanation (`aiFallback`), that same button is shown.
export default function ExplainSheet({ question, answer, aiFallback = false, className = '' }) {
  const [language] = useAppLanguage();
  const { profile } = useTutorProfile();
  const found = getExplanation(question, language);
  const { text, note } = explainText(found, language);
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  return (
    <div className={`bg-white border border-pw-line p-5 text-pw-navy space-y-2 ${className}`}>
      {found.source ? (
        <>
          {text.mine && <p dir={dir} className="text-lg leading-relaxed whitespace-pre-line">{text.mine}</p>}
          {text.en && <p className={`leading-relaxed whitespace-pre-line ${text.mine ? 'text-pw-muted' : 'text-lg'}`}>{text.en}</p>}
          {note && <p className="text-sm text-pw-muted">{note.mine || note.en}</p>}
        </>
      ) : aiFallback ? (
        <AIExplanation question={question} answer={answer} />
      ) : (
        <p className="text-lg">{text.mine || text.en}</p>
      )}
      <p className="font-display italic text-lg text-pw-muted">— {profile.name}</p>
    </div>
  );
}
