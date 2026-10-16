import React from 'react';
import { Badge } from '@/components/ui/badge';

// A fictional "practice copy" of Form N-400 styled like the official form:
// same part names and order, item-number boxes, checkbox rows, and trips
// table. It shows what the form looks like — it is not real, and this guide
// does not fill out or file any form.

function ItemRow({ number, label, value, wide }) {
  return (
    <div className={`border border-slate-500 flex bg-white ${wide ? 'col-span-2' : ''}`}>
      <div className="w-10 shrink-0 border-r border-slate-500 px-1 py-1 text-[10px] font-bold text-slate-800">
        {number}
      </div>
      <div className="flex-1 px-2 py-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-800 leading-tight">{label}</p>
        <p className="font-mono text-xs text-slate-900 leading-snug">{value || ''}</p>
      </div>
    </div>
  );
}

function CheckBox({ checked, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 mr-3 text-[10px] font-semibold text-slate-800">
      <span className="inline-flex w-3.5 h-3.5 border border-slate-600 items-center justify-center text-[9px] font-bold leading-none bg-white">
        {checked ? 'X' : ''}
      </span>
      {label}
    </span>
  );
}

function Part({ title, children }) {
  return (
    <div className="space-y-1">
      <div className="bg-black text-white text-sm font-bold px-3 py-1.5">{title}</div>
      <div className="grid grid-cols-2 gap-1 border-x border-b border-slate-400 p-1 bg-slate-50">
        {children}
      </div>
    </div>
  );
}

export default function N400PaperForm({ applicant }) {
  const birthYear = new Date().getFullYear() - applicant.age;
  const nameParts = applicant.name.split(' ');
  const familyName = nameParts[nameParts.length - 1];
  const givenName = nameParts.slice(0, -1).join(' ');
  const countryOfBirth = applicant.birthplace.split(', ')[1];

  // Address: "482 Maple Street, Apt 3C, Riverton, Ohio 45000" → parts
  const m = applicant.address.match(/^(.*?)(?:,\s*(Apt[^,]*))?,\s*([^,]+),\s*([A-Za-z .]+?)\s+(\d{5})$/);
  const street = m ? m[1] : applicant.address;
  const apt = m && m[2] ? m[2] : '';
  const city = m ? m[3] : '';
  const stateName = m ? m[4] : '';
  const zip = m ? m[5] : '';

  const childRows =
    applicant.children[0] === 'No children'
      ? []
      : applicant.children.map((c) => {
          const [main, ...rest] = c.split(' — ');
          const [name, agePart] = main.split(', ');
          return { name, age: (agePart || '').replace('age ', ''), note: rest.join(', ') };
        });

  const trips = applicant.trips.map((t) => {
    const [country, date, length] = t.split(', ');
    const reason = t.split(' — ')[1] || '';
    const days = parseInt(length, 10) || 0;
    const dep = new Date(date);
    const bad = Number.isNaN(dep.getTime());
    const ret = bad ? null : new Date(dep.getTime() + days * 86400000);
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return {
      dep: bad ? date : fmt(dep),
      ret: bad ? '' : fmt(ret),
      days,
      country,
      reason,
    };
  });

  const maritalOptions = ['Married', 'Single, never married', 'Widowed', 'Divorced', 'Separated'];
  const spouseMatch =
    applicant.maritalStatus === 'Married' ? applicant.marital.match(/(?:Married to|Married) ([A-Z][a-z]+ [A-Z][a-z]+)/) : null;

  return (
    <div className="relative rounded-sm border-2 border-slate-400 bg-white p-3 md:p-5 space-y-3 overflow-hidden font-sans">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-5xl md:text-6xl font-black text-slate-200/40 -rotate-12 tracking-widest">
          PRACTICE
        </span>
      </div>

      <div className="relative space-y-3">
        {/* Form header, like the official page 1 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-slate-700">
            <p className="font-bold uppercase tracking-wide">U.S. Citizenship and Immigration Services</p>
            <p>OMB No. 1615-0023</p>
          </div>
          <div className="bg-black text-white px-3 py-1.5 flex justify-between items-baseline">
            <p className="font-bold text-lg leading-tight">Application for Naturalization</p>
            <p className="font-bold text-sm">Form N-400</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-slate-700">
              Practice copy filled in for <span className="font-bold">{applicant.name}</span>. Not a real
              application. Do not file this form.
            </p>
            <Badge variant="outline" className="shrink-0 text-amber-700 border-amber-300 bg-amber-50">
              Practice copy — not real
            </Badge>
          </div>
        </div>

        <Part title="Part 1. Information About Your Eligibility">
          <div className="col-span-2 border border-slate-500 bg-white px-2 py-1.5 space-y-1">
            <p className="text-[10px] font-bold text-slate-800">1. I am at least 18 years old AND:</p>
            <div className="pl-2">
              <CheckBox checked label="A. I have been a lawful permanent resident of the United States for at least 5 years." />
            </div>
            <div className="pl-2">
              <CheckBox checked={false} label="B–G. Other eligibility options (not shown in this practice copy)." />
            </div>
          </div>
        </Part>

        <Part title="Part 2. Information About You (Person applying for naturalization)">
          <ItemRow number="1.a" label="Family Name (Last)" value={familyName} />
          <ItemRow number="1.b" label="Given Name (First)" value={givenName} />
          <ItemRow number="3" label="A-Number" value="" />
          <ItemRow number="6" label="Date of Birth" value={`About ${birthYear}`} />
          <ItemRow number="7" label="Country of Birth" value={countryOfBirth} />
          <ItemRow number="12" label="Current Immigration Status" value="Lawful permanent resident (green card)" />
        </Part>

        <Part title="Part 4. Information About Your Residence">
          <ItemRow number="1.a" label="Street Number and Name" value={street} />
          <ItemRow number="1.b" label="Apt." value={apt} />
          <ItemRow number="1.c" label="City" value={city} />
          <ItemRow number="1.d" label="State" value={stateName} />
          <ItemRow number="1.e" label="ZIP Code" value={zip} />
        </Part>

        <Part title="Part 5. Information About Your Marital History">
          <div className="col-span-2 border border-slate-500 bg-white px-2 py-1.5 space-y-1">
            <p className="text-[10px] font-bold text-slate-800">1. What is your current marital status?</p>
            <div className="pl-2 flex flex-wrap">
              {maritalOptions.map((opt) => (
                <CheckBox key={opt} checked={applicant.maritalStatus === opt} label={opt} />
              ))}
            </div>
          </div>
          <ItemRow number="2" label="How many times have you been married?" value={applicant.marriages === 0 ? 'None' : `${applicant.marriages}`} />
          <ItemRow number="4" label="Current Spouse's Family Name (Last) and Given Name (First)" value={spouseMatch ? spouseMatch[1] : 'N/A'} />
        </Part>

        <Part title="Part 6. Information About Your Children">
          <div className="col-span-2 border border-slate-500 bg-white px-2 py-1.5">
            <p className="text-[10px] font-bold text-slate-800">
              1. How many children do you have?
            </p>
            <div className="pl-2 mt-1">
              <CheckBox checked={childRows.length === 0} label="None" />
              <CheckBox checked={childRows.length > 0} label={`Number: ${childRows.length}`} />
            </div>
          </div>
          {childRows.map((child, i) => (
            <ItemRow
              key={child.name}
              number={`3.${['a', 'b', 'c', 'd'][i] || i + 1}`}
              label={`Child's full name${child.note ? ` (${child.note})` : ''}`}
              value={`${child.name}${child.age ? ` — age ${child.age}` : ''}`}
              wide
            />
          ))}
        </Part>

        <Part title="Part 7. Information About Your Employment and Schools You Attended">
          {applicant.jobs.map((job, i) => (
            <ItemRow
              key={job}
              number={`1.${['a', 'b'][i] || i + 1}`}
              label="Employer or School Name, Job Title, and Dates (most recent first)"
              value={job}
              wide
            />
          ))}
        </Part>

        <div className="space-y-1">
          <div className="bg-black text-white text-sm font-bold px-3 py-1.5">
            Part 8. Time Outside the United States
          </div>
          <div className="border-x border-b border-slate-400 p-1 bg-slate-50">
            <p className="text-[9px] text-slate-700 px-1 pb-1">
              1. List all trips outside the United States during the last 5 years. Start with your most recent trip.
            </p>
            <table className="w-full text-[11px] border-collapse bg-white">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-wide text-slate-700 border border-slate-500">
                  <th className="px-1.5 py-1 border-r border-b border-slate-400">Date of Departure</th>
                  <th className="px-1.5 py-1 border-r border-b border-slate-400">Date of Return</th>
                  <th className="px-1.5 py-1 border-r border-b border-slate-400">Total Days Out of the U.S.</th>
                  <th className="px-1.5 py-1 border-r border-b border-slate-400">Countries Visited</th>
                  <th className="px-1.5 py-1 border-b border-slate-400">Reason for Trip</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {trips.map((t) => (
                  <tr key={`${t.country}-${t.dep}`} className="border border-slate-400">
                    <td className="px-1.5 py-1 border-r border-slate-300">{t.dep}</td>
                    <td className="px-1.5 py-1 border-r border-slate-300">{t.ret}</td>
                    <td className="px-1.5 py-1 border-r border-slate-300">{t.days}</td>
                    <td className="px-1.5 py-1 border-r border-slate-300">{t.country}</td>
                    <td className="px-1.5 py-1">{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Part title="Part 11. Applicant's Contact Information, Certification, and Signature">
          <div className="col-span-2 border border-slate-500 bg-white px-2 py-1.5">
            <p className="text-[9px] italic text-slate-700 leading-snug">
              Applicant's Certification: I certify, under penalty of perjury, that I provided or authorized all
              answers in this application and that every answer is true and correct. (Example text for practice —
              not the full official certification.)
            </p>
          </div>
          <ItemRow number="6.a" label="Applicant's Signature" value={applicant.name} />
          <ItemRow number="6.b" label="Date of Signature" value={`${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} (example)`} />
        </Part>

        {/* Footer, like the official page footer */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[9px] text-slate-700">
            Form N-400 · Practice copy for learning · Not a real application · Not legal advice
          </p>
          <div
            aria-hidden="true"
            className="h-7 w-36 shrink-0"
            style={{
              background:
                'repeating-linear-gradient(90deg, #1a1a1a 0 2px, transparent 2px 4px, #1a1a1a 4px 5px, transparent 5px 8px, #1a1a1a 8px 9px, transparent 9px 11px)',
            }}
          />
        </div>
      </div>
    </div>
  );
}