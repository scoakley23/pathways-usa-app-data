import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import TutorMessage from './TutorMessage';
import { InterviewStep } from './lessonSteps';
import N400QuestionCard from '@/components/n400/N400QuestionCard';
import PracticePersonaPanel, { getPersona } from '@/components/practice/PracticePersonaPanel';

// Learn it + Say it back: the existing N-400 Guide question card.
function N400CardStep({ step, ctx }) {
  return <N400QuestionCard sectionId={step.sectionId} question={step.question} isAdmin={false} language={ctx.language} />;
}

// Practice as a practice person: their card on screen, then one officer
// question scored like the mock interview (with the person's facts).
function N400PersonaStep({ step, ctx, state, setState }) {
  return (
    <div className="space-y-4">
      <PracticePersonaPanel persona={getPersona(step.personaId)} />
      <InterviewStep step={{ ...step, type: 'practice-interview' }} ctx={ctx} state={state} setState={setState} />
    </div>
  );
}

N400PersonaStep.needsAnswer = true;

// Section end: if you're not sure your answer is "no", talk to a lawyer.
function N400LawyerStep({ step, ctx }) {
  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} mine={step.text.mine} en={step.text.en} />
      <Link
        to="/lawyer-first"
        className="w-full min-h-[52px] rounded-2xl border-2 border-pw-navy bg-white text-pw-navy font-bold text-lg inline-flex items-center justify-center gap-2 px-4 hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
      >
        <Scale className="w-5 h-5" aria-hidden="true" /> Talk to a lawyer first
      </Link>
    </div>
  );
}

export const N400_STEPS = {
  'n400-card': N400CardStep,
  'n400-persona': N400PersonaStep,
  'n400-lawyer': N400LawyerStep,
};
