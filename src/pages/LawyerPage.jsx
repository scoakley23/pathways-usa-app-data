import React from 'react';
import { ExternalLink, AlertTriangle, Scale, Lock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

// The checklist is hidden from learners until it has been legally reviewed.
// Set CHECKLIST_LEGALLY_REVIEWED to true only after that review is confirmed
// by the app owner.
const CHECKLIST_LEGALLY_REVIEWED = false;
const CHECKLIST_ITEMS = [
  // Checklist content (from the app owner's Step 3 text) goes here after
  // legal review. Learners never see this section until then.
];

const LEGAL_HELP_LINKS = [
  {
    label: 'USCIS — Find legal services',
    url: 'https://www.uscis.gov/avoid-scams/find-legal-services',
    description: 'Official USCIS page for finding free or low-cost legal help near you.',
  },
  {
    label: 'U.S. Department of Justice — Pro bono legal providers',
    url: 'https://www.justice.gov/eoir/list-pro-bono-legal-service-providers',
    description: 'Official list of lawyers and organizations that help immigrants for free or at low cost.',
  },
  {
    label: 'USCIS — Avoid scams',
    url: 'https://www.uscis.gov/avoid-scams',
    description: 'How to spot immigration scams and where to report them.',
  },
];

export default function LawyerPage({ cachedUser }) {
  const isAdmin = cachedUser?.role === 'admin';
  const showChecklist = CHECKLIST_LEGALLY_REVIEWED && CHECKLIST_ITEMS.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talk to a lawyer first"
        subtitle="Before you answer hard questions or file your application."
      />

      <Card className="rounded-2xl">
        <CardContent className="p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EDF1F9', color: '#1F3A6B' }}>
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Why talk to a lawyer</h2>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Some questions on Form N-400 ask about difficult topics. Only a lawyer or an accredited
            representative can look at your own situation with you. Pathways explains what questions mean — it
            cannot tell you how to answer, and nothing in this app is legal advice.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-5 md:p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900">Find free or low-cost legal help</h2>
          <ul className="space-y-3">
            {LEGAL_HELP_LINKS.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline flex items-center gap-1.5"
                  style={{ color: '#1F3A6B' }}
                >
                  {link.label} <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-sm" style={{ color: '#4A5A78' }}>
                  {link.description}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-2" style={{ borderColor: '#D9483F' }}>
        <CardContent className="p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" style={{ color: '#D9483F' }} />
            <h2 className="text-xl font-extrabold text-slate-900">Warning about “notarios”</h2>
          </div>
          <p className="text-slate-700 leading-relaxed">
            In many countries, a “notario público” is a lawyer. In the United States, a notary public is NOT a
            lawyer and cannot give immigration advice. Before you pay anyone for help, check that the person is
            a licensed lawyer or an accredited representative. A person who is neither cannot legally advise
            you, even if they call themselves a “notario,” “consultant,” or “immigration expert.”
          </p>
        </CardContent>
      </Card>

      {showChecklist ? (
        <Card className="rounded-2xl">
          <CardContent className="p-5 md:p-6 space-y-3">
            <h2 className="text-xl font-extrabold text-slate-900">Before you file — checklist</h2>
            <ul className="space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <li key={i} className="text-slate-700 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        isAdmin && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm flex items-center gap-2" style={{ color: '#4A5A78' }}>
            <Lock className="w-4 h-4" />
            The filing checklist is hidden from learners pending legal review.
          </div>
        )
      )}
    </div>
  );
}