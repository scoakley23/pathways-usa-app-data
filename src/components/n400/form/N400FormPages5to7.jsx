import React from 'react';
import { CheckBox, YesNo, PartBar, Item, Field, Note, FormPage } from './N400FormPrimitives';

// Pages 5-7 of the practice copy: Part 6 (children), Part 7 (employment and
// schools), and Part 8 (time outside the United States).

export function N400FormPage5({ d }) {
  const first = d.name.split(' ')[0];
  return (
    <FormPage page={5}>
      <PartBar title="Part 6. Information About Your Children" />
      <Item number="1.">
        <p className="text-[11px] font-bold text-slate-800">Indicate your total number of children under 18 years of age.</p>
        <div className="flex items-center gap-4">
          <CheckBox checked={d.childrenUnder18 === 0} label="None" />
          <span className="inline-flex items-center gap-1.5">
            <CheckBox checked={d.childrenUnder18 > 0} label="Number:" />
            <span className="font-typewriter text-xs text-black">
              {d.childrenUnder18 > 0 ? d.childrenUnder18 : ''}
            </span>
          </span>
        </div>
      </Item>
      <Item number="2.">
        <p className="text-[11px] font-bold text-slate-800">Provide the following information about your children.</p>
        {d.children.length === 0 ? (
          <p className="font-typewriter text-xs text-slate-500">(None — {first} does not have any children.)</p>
        ) : (
          <div className="space-y-2">
            {d.children.map((c, i) => (
              <div key={c.name} className="border border-black p-1.5 space-y-1">
                <div className="grid grid-cols-3 gap-1">
                  <Field label="Son or Daughter's Name (First Name and Family Name)" value={`${c.name} ${d.family}`} />
                  <Field label="Date of Birth (mm/dd/yyyy)" value={c.age !== null ? `(about ${new Date().getFullYear() - c.age} — age ${c.age})` : ''} />
                  <Field label="Relationship (biological son or daughter, stepchild, or legally adopted son or daughter)" value={c.note?.includes('first marriage') ? 'Biological daughter' : 'Biological son or daughter'} />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Field label="Residence" value={c.note || `With me at my current physical address`} />
                  <div className="border border-black bg-white px-1.5 py-1">
                    <p className="text-[9px] font-bold text-slate-800">
                      Are you currently providing support for your son or daughter?
                    </p>
                    <YesNo yes={c.age !== null && c.age < 18 ? true : undefined} na={c.age === null || c.age >= 18} />
                  </div>
                </div>
                <p className="text-[9px] font-bold text-slate-500">Child {i + 1} of {d.children.length} (example)</p>
              </div>
            ))}
          </div>
        )}
        <Note>
          Items 3. - 8. ask for A-Numbers and other details; only Item Number 8. applies to applicants filing
          under Part 1., Item Number 1.d. Not shown in this practice copy.
        </Note>
      </Item>
    </FormPage>
  );
}

function JobRow({ label, job, address }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-6 gap-1">
        <Field label="Employer or School Name" value={job.employer} className="col-span-2" />
        <Field label="City/Town" value={job.employer === 'N/A' ? '' : address.city} />
        <Field label="State/ Province" value={job.employer === 'N/A' ? '' : address.state} />
        <Field label="ZIP Code/ Postal Code" value={job.employer === 'N/A' ? '' : address.zip} />
        <Field label="Country" value={job.employer === 'N/A' ? '' : 'United States'} />
      </div>
      <div className="grid grid-cols-3 gap-1">
        <Field label="Employment/ School Dates From (mm/dd/yyyy)" value={job.from ? `About ${job.from}` : ''} />
        <Field label="To (mm/dd/yyyy)" value={job.to} />
        <Field label="Occupation or Field of Study" value={job.occupation} />
      </div>
    </div>
  );
}

export function N400FormPage6({ d }) {
  const [current, ...history] = d.jobs;
  return (
    <FormPage page={6}>
      <PartBar title="Part 7. Information About Your Employment and Schools You Attended" />
      <Note>
        If you are unemployed, type or print "unemployed." If you are retired, type or print "retired." List
        every place where you worked or went to school during the last 5 years. If you need extra space, use the
        space provided in Part 14. Additional Information.
      </Note>
      <Item number="1.">
        <p className="text-[11px] font-bold text-slate-800">
          Provide your current employment, if applicable. (If you are unemployed, type or print "unemployed." If
          you are retired, type or print "retired.")
        </p>
        <JobRow label="Current Employment (example)" job={current} address={d.address} />
      </Item>
      <Item number="2.">
        <p className="text-[11px] font-bold text-slate-800">
          Provide your employment history for the last 5 years. List your most recent employment first.
        </p>
        <div className="space-y-2">
          {history.map((j, i) => (
            <JobRow key={j.occupation} label={`Employment ${i + 1}`} job={j} address={d.address} />
          ))}
          {history.length === 0 && (
            <p className="font-typewriter text-xs text-slate-500">(No other employers in the last 5 years.)</p>
          )}
        </div>
      </Item>
      <Item number="3.">
        <p className="text-[11px] font-bold text-slate-800">
          Provide information about the schools you attended during the last 5 years.
        </p>
        <p className="font-typewriter text-xs text-black">N/A (not attending school)</p>
      </Item>
    </FormPage>
  );
}

export function N400FormPage7({ d }) {
  return (
    <FormPage page={7}>
      <PartBar title="Part 8. Time Outside the United States" />
      <div className="grid grid-cols-2 gap-1">
        <Item number="1.">
          <p className="text-[11px] font-bold text-slate-800">
            Provide the total number of days you spent outside the United States during the last 5 years.
          </p>
          <p className="font-typewriter text-xs text-black">{d.totalDaysOut}</p>
        </Item>
        <Item number="2.">
          <p className="text-[11px] font-bold text-slate-800">
            Provide the total number of trips (24 hours or longer) you have taken outside the United States
            during the last 5 years.
          </p>
          <p className="font-typewriter text-xs text-black">{d.trips.length}</p>
        </Item>
      </div>
      <Item number="3.">
        <p className="text-[11px] font-bold text-slate-800">
          List all of your trips (24 hours or longer) outside the United States during the last 5 years. Start
          with your most recent trip and work backwards. Do not include day trips (where the entire trip was
          completed within 24 hours). If you took any trip longer than 6 months, see the Instructions.
        </p>
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="text-left text-[9px] uppercase tracking-wide text-slate-700">
              {['Date of Departure', 'Date of Return', 'Total Days Out of the U.S.', 'Countries Visited', 'Reason for Trip'].map((h) => (
                <th key={h} className="border border-black px-1.5 py-1 bg-slate-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="font-typewriter text-[11px] text-black">
            {d.trips.map((t) => (
              <tr key={`${t.country}-${t.departure}`}>
                <td className="border border-black px-1.5 py-1">{t.departure} (about)</td>
                <td className="border border-black px-1.5 py-1">{t.return} (about)</td>
                <td className="border border-black px-1.5 py-1">{t.days}</td>
                <td className="border border-black px-1.5 py-1">{t.country}</td>
                <td className="border border-black px-1.5 py-1">{t.reason}</td>
              </tr>
            ))}
            {d.trips.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-black px-1.5 py-1 text-slate-500">None</td>
              </tr>
            )}
          </tbody>
        </table>
      </Item>
    </FormPage>
  );
}