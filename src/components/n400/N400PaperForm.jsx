import React from 'react';
import { Badge } from '@/components/ui/badge';

// A stylized, fictional "practice copy" of Form N-400 filled with one example
// applicant's answers. It shows what the form looks like — it is not real,
// and this guide never fills out or files any form.

function Field({ label, value, wide }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="px-2 py-1.5 border-b border-slate-300 bg-slate-50 text-sm text-slate-800">{value || '—'}</p>
    </div>
  );
}

function Part({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-800">{title}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  );
}

export default function N400PaperForm({ applicant }) {
  const birthYear = new Date().getFullYear() - applicant.age;
  const countryOfBirth = applicant.birthplace.split(', ')[1];
  const childrenSummary =
    applicant.children[0] === 'No children' ? 'None' : applicant.children.join('; ');
  const trips = applicant.trips.map((t) => {
    const [country, date, length] = t.split(', ');
    const reason = t.split(' — ')[1] || '';
    return { country, date, length, reason };
  });

  return (
    <div className="relative rounded-xl border-2 border-slate-300 bg-white p-4 md:p-6 space-y-5 overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-5xl md:text-6xl font-black text-slate-200/40 -rotate-12 tracking-widest">
          PRACTICE
        </span>
      </div>

      <div className="relative space-y-5">
        <div className="border-b-2 border-slate-800 pb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Department of Homeland Security · U.S. Citizenship and Immigration Services
            </p>
            <p className="font-black text-lg text-slate-900">Form N-400 · Application for Naturalization</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-amber-700 border-amber-300 bg-amber-50">
            Practice copy — not real
          </Badge>
        </div>

        <Part title="Part 1. Information About You">
          <Field label="Your full name" value={applicant.name} wide />
          <Field label="Date of birth" value={`About ${birthYear}`} />
          <Field label="Country of birth" value={countryOfBirth} />
          <Field label="Years living in the United States" value={`${applicant.yearsInUS}`} />
          <Field label="Immigration status" value="Lawful permanent resident (green card)" />
        </Part>

        <Part title="Part 2. Where You Live">
          <Field label="Your home address" value={applicant.address} wide />
        </Part>

        <Part title="Part 3. Your Family">
          <Field label="Marital status" value={applicant.maritalStatus} />
          <Field label="How many times married" value={applicant.marriages === 0 ? 'None' : `${applicant.marriages}`} />
          <Field label="Children" value={childrenSummary} wide />
        </Part>

        <Part title="Part 4. Your Work (last 5 years)">
          {applicant.jobs.map((job) => (
            <Field key={job} label="Employer and job" value={job} wide />
          ))}
        </Part>

        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-800">Part 5. Trips Outside the United States</p>
          <table className="w-full text-sm border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-2 py-1.5 border-b border-slate-300">Country</th>
                <th className="px-2 py-1.5 border-b border-slate-300">Date</th>
                <th className="px-2 py-1.5 border-b border-slate-300">Length</th>
                <th className="px-2 py-1.5 border-b border-slate-300">Reason</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={`${t.country}-${t.date}`}>
                  <td className="px-2 py-1.5 border-b border-slate-200">{t.country}</td>
                  <td className="px-2 py-1.5 border-b border-slate-200">{t.date}</td>
                  <td className="px-2 py-1.5 border-b border-slate-200">{t.length}</td>
                  <td className="px-2 py-1.5 border-b border-slate-200">{t.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-800">Part 6. Your Signature</p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Signature</p>
              <p className="italic serif text-lg text-slate-800 border-b border-slate-300 px-2 pb-1">
                {applicant.name}
              </p>
            </div>
            <div className="w-40">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Date</p>
              <p className="px-2 py-1 border-b border-slate-300 text-sm text-slate-800">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} (example)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}