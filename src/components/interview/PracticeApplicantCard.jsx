import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Plane, Heart, Users, ShieldCheck, AlertTriangle } from 'lucide-react';

function FactSection({ Icon, title, lines, compact }) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
        <Icon className="w-3.5 h-3.5" /> {title}
      </p>
      {lines.map((line, i) => (
        <p key={i} className={`${compact ? 'text-xs' : 'text-sm'} text-slate-700 leading-relaxed`}>
          {line}
        </p>
      ))}
    </div>
  );
}

// Profile card for a fictional N-400 practice applicant. Every card carries the
// "Practice person. Not real." label.
export default function PracticeApplicantCard({ applicant, compact = false }) {
  const firstName = applicant.name.split(' ')[0];
  const hasYesGmc = applicant.gmc.some((g) => g.a.toLowerCase().startsWith('yes'));

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardContent className={`${compact ? 'p-4' : 'p-5 md:p-6'} space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-base font-bold text-slate-900">
              {firstName}, {applicant.age}
            </p>
            <p className="text-sm text-slate-600">
              {applicant.job} · from {applicant.birthplace} · in the U.S. {applicant.yearsInUS} years
            </p>
          </div>
          <Badge className="bg-amber-500 text-white font-bold uppercase tracking-wide">Practice person. Not real.</Badge>
        </div>

        <div
          className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1' : 'sm:grid-cols-2'}`}
        >
          <FactSection Icon={MapPin} title="Address" lines={[applicant.address]} compact={compact} />
          <FactSection Icon={Briefcase} title="Jobs" lines={applicant.jobs} compact={compact} />
          <FactSection Icon={Plane} title="Trips outside the U.S." lines={applicant.trips} compact={compact} />
          <FactSection Icon={Heart} title="Marital history" lines={[applicant.marital]} compact={compact} />
          <FactSection Icon={Users} title="Children" lines={applicant.children} compact={compact} />
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5" /> Good moral character
            </p>
            {applicant.gmc.map((g, i) => (
              <p key={i} className={`${compact ? 'text-xs' : 'text-sm'} text-slate-700 leading-relaxed`}>
                {g.q} <span className="font-semibold">{g.a.split('—')[0].trim()}</span>
                {g.a.includes('—') && <span className="text-slate-600"> — {g.a.split('—').slice(1).join('—').trim()}</span>}
              </p>
            ))}
          </div>
        </div>

        {hasYesGmc && (
          <p className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {firstName} has a “yes” answer that needs an explanation. Practice saying it calmly and honestly — the
            officer will ask for details.
          </p>
        )}
      </CardContent>
    </Card>
  );
}