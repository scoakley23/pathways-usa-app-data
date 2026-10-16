import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { PRACTICE_APPLICANTS } from './practiceApplicants';
import PracticeApplicantCard from './PracticeApplicantCard';

// Step 1: pick one of the six fictional practice applicants.
// Step 2: consent screen — the learner must tap "I understand" before the
// interview starts.
export default function N400ReviewSetup({ onReady }) {
  const [selected, setSelected] = useState(null);
  const [showCard, setShowCard] = useState(true);

  const pick = (applicant) => {
    setSelected(applicant);
    setShowCard(true);
  };

  return (
    <Card className="bg-indigo-50 border border-indigo-200 overflow-hidden">
      <div className="h-2 bg-indigo-600" />
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">N-400 Review Practice</h2>
          <p className="text-slate-600">
            Play the part of a practice applicant. Officer Martinez reviews their N-400 application with you, then gives
            the official 2025 civics test — the shorter 65/20 version for applicants 65 or older with 20+ years as a
            resident.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {PRACTICE_APPLICANTS.map((a) => {
            const isSelected = selected?.id === a.id;
            return (
              <button
                key={a.id}
                onClick={() => pick(a)}
                className={`text-left p-4 rounded-2xl border-2 transition-colors ${
                  isSelected
                    ? 'border-indigo-600 bg-white shadow-sm'
                    : 'border-indigo-100 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-bold text-slate-900">{a.name.split(' ')[0]}, {a.age}</p>
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 shrink-0">
                    Practice person
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">{a.job}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{a.blurb}</p>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">{selected.name}'s profile card</p>
              <Button variant="ghost" size="sm" onClick={() => setShowCard(!showCard)} className="text-slate-500">
                {showCard ? <><ChevronUp className="w-4 h-4 mr-1" /> Hide card</> : <><ChevronDown className="w-4 h-4 mr-1" /> Show card</>}
              </Button>
            </div>

            {showCard && <PracticeApplicantCard applicant={selected} />}

            <div className="bg-white border-2 border-indigo-600 rounded-2xl p-5 space-y-4">
              <p className="flex items-start gap-3 text-base font-semibold text-slate-800 leading-relaxed">
                <ShieldAlert className="w-6 h-6 text-indigo-600 shrink-0" />
                In this practice, you are {selected.name.split(' ')[0]}. Answer using {selected.name.split(' ')[0]}'s
                information on the card, not your own. Do not say your real address, A-number, or personal history.
              </p>
              <p className="text-sm text-slate-500 pl-9">
                The card stays visible during the interview. If your answer looks like real personal information, it is
                never sent to the AI — you'll be asked to answer again as {selected.name.split(' ')[0]}. Nothing from
                this interview is saved.
              </p>
              <Button
                onClick={() => onReady(selected)}
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base rounded-xl"
              >
                <UserCheck className="w-5 h-5 mr-2" /> I understand
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}