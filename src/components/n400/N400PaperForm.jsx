import React from 'react';
import { Badge } from '@/components/ui/badge';
import { buildN400Data } from './form/buildN400Data';
import { N400FormPage1, N400FormPage2, N400FormPage3, N400FormPage4 } from './form/N400FormPages1to4';
import { N400FormPage5, N400FormPage6, N400FormPage7 } from './form/N400FormPages5to7';
import { N400FormPage8, N400FormPage9, N400FormPage10, N400FormPage11 } from './form/N400FormPages8to11';
import { N400FormPage12, N400FormPage13, N400FormPage14 } from './form/N400FormPages12to14';

// The practice copy of Form N-400, laid out like the official 14-page paper
// form with all 16 parts, filled in with one fictional applicant's answers.
// It is an example for learning — not real, never filed, never collected.
export default function N400PaperForm({ applicant }) {
  const d = buildN400Data(applicant);
  const first = applicant.name.split(' ')[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold text-slate-700">
          Form N-400 for {first} — all 14 pages, like the official paper form
        </p>
        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
          Practice copy — not real
        </Badge>
      </div>
      <N400FormPage1 d={d} />
      <N400FormPage2 d={d} />
      <N400FormPage3 d={d} />
      <N400FormPage4 d={d} />
      <N400FormPage5 d={d} />
      <N400FormPage6 d={d} />
      <N400FormPage7 d={d} />
      <N400FormPage8 d={d} />
      <N400FormPage9 d={d} />
      <N400FormPage10 d={d} />
      <N400FormPage11 d={d} />
      <N400FormPage12 d={d} />
      <N400FormPage13 d={d} />
      <N400FormPage14 d={d} />
    </div>
  );
}