import React from 'react';
import AIExplanation from '@/components/ai/AIExplanation';
import useTutorProfile from '@/components/persona/useTutorProfile';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { explainText, getExplanation } from '@/lib/explanations';
import { RuledPaper } from '@/components/pathways/ui';

// "Explain it simply": a sheet of ruled paper under a poster with Amio's
// explanation from the existing sources only. First the human-reviewed
// explanation (content/explanations); when there is none and the card already
// offered the on-demand AI explanation (`aiFallback`), that same button is
// shown. Amio's words are signed in text.
export default function ExplainSheet({ question, answer, aiFallback = false, className = '' }) {
  const [language] = useAppLanguage();
  const { profile } = useTutorProfile();
  const found = getExplanation(question, language);
  const { text, note } = explainText(found, language);
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  return (
    <RuledPaper className={className} aria-label="Explain it simply">
      <h3 className="font-display text-[1.625rem] leading-[2.25rem]">Explain it simply</h3>
      {found.source ? (
        <>
          {text.mine && <p dir={dir} className="font-medium text-[1.375rem] leading-[2.25rem] whitespace-pre-line">{text.mine}</p>}
          {text.en && <p className={`font-medium leading-[2.25rem] whitespace-pre-line ${text.mine ? 'text-lg text-muted' : 'text-[1.375rem]'}`}>{text.en}</p>}
          {note && <p className="text-base leading-[2.25rem] text-muted">{note.mine || note.en}</p>}
        </>
      ) : aiFallback ? (
        <div className="py-2"><AIExplanation question={question} answer={answer} /></div>
      ) : (
        <p className="font-medium text-[1.375rem] leading-[2.25rem]">{text.mine || text.en}</p>
      )}
      <p className="font-medium text-lg leading-[2.25rem] text-muted">— {profile.name}</p>
    </RuledPaper>
  );
}
