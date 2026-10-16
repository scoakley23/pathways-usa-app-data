import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckBox, YesNo, PartBar, Item, Field, GroupIntro, Note, FormPage } from './N400FormPrimitives';

// Pages 1-4 of the practice copy: the form header, Part 1 (eligibility),
// Part 2 (about you), Part 3 (biographic), Part 4 (residence), and
// Part 5 (marital history).

const FILING_REASONS = [
  ['A.', 'General Provision. See Instructions: List of General Eligibility Requirements'],
  ['B.', 'Spouse of U.S. Citizen. See Instructions: Eligibility Based on Marriage to a U.S. Citizen'],
  ['C.', 'VAWA. See Instructions: Eligibility for the Spouse, Former Spouse, or Child of a U.S. Citizen under the Violence Against Women Act (VAWA)'],
  ['D.', 'Spouse of U.S. Citizen in Qualified Employment Outside the United States. See Instructions: Eligibility for the Spouse of a U.S. Citizen Working for a Qualified Employer Outside the United States'],
  ['E.', 'Military Service During Period of Hostilities. See Instructions: Eligibility and Evidence for Current and Former Members of the U.S. Armed Forces'],
  ['F.', 'At Least One Year of Honorable Military Service at Any Time. See Instructions: Eligibility and Evidence for Current and Former Members of the U.S. Armed Forces'],
  ['G.', 'Other Reason for Filing Not Listed Above'],
];

export function N400FormPage1({ d }) {
  return (
    <FormPage page={1} first>
      <div className="flex justify-between text-[9px] font-semibold text-slate-700">
        <p>Department of Homeland Security<br />U.S. Citizenship and Immigration Services</p>
        <p className="text-right">OMB No. 1615-0052<br />Expires 02/28/2027</p>
      </div>
      <div className="bg-black text-white flex justify-between items-center px-3 py-2">
        <p className="font-bold text-lg">Application for Naturalization</p>
        <p className="font-bold text-sm">USCIS Form N-400</p>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[10px] font-semibold text-slate-700">
          Practice copy filled in for <span className="text-slate-900">{d.name}</span> — a fictional person.
          It follows the real form's parts, wording, and item numbers as closely as we can, but it is not the
          real form and is never filed. The real form is at uscis.gov.
        </p>
        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 shrink-0">
          Practice — not real
        </Badge>
      </div>
      <div className="border border-slate-500">
        <div className="bg-slate-100 border-b border-slate-500 px-2 py-0.5">
          <p className="text-[9px] font-bold text-slate-800">For USCIS Use Only</p>
        </div>
        <div className="grid grid-cols-4">
          {['Date Stamp', 'Receipt', 'Action Block', 'Remarks'].map((c) => (
            <div key={c} className="border-r last:border-r-0 border-slate-400 p-1 text-[9px] font-semibold text-slate-700">
              {c}
            </div>
          ))}
        </div>
      </div>
      <Note>
        START HERE - Type or print in black ink. If you do not answer all of the questions, it may take longer for
        U.S. Citizenship and Immigration Services (USCIS) to process your Form N-400.
      </Note>
      <Note>
        If your mother or father (including legal adoptive mother or father) is a U.S. citizen by birth, or was
        naturalized before you reached your 18th birthday, you may not need to file Form N-400 as you may already
        be a U.S. citizen. Before you file this application, please visit the USCIS website at www.uscis.gov/N-600
        for Form N-600, Application for Certificate of Citizenship.
      </Note>
      <PartBar title="Part 1. Information About Your Eligibility" note="Select only one box to identify the basis of your eligibility or your Form N-400 may be delayed or rejected." />
      <Item number="A-">
        <p className="text-[11px] font-bold text-slate-800">Enter Your 9 Digit A-Number:</p>
        <p className="font-mono text-xs text-slate-500">(left blank in this practice copy)</p>
      </Item>
      <Item number="1.">
        <p className="text-[11px] font-bold text-slate-800">Reason for Filing (Please see Instructions for eligibility requirements under each provision.)</p>
        {FILING_REASONS.map(([letter, text]) => (
          <div key={letter} className="flex items-start gap-2">
            <CheckBox checked={letter === 'A.'} label={letter} />
            <p className="text-[10px] text-slate-800 leading-snug">{text}</p>
          </div>
        ))}
      </Item>
    </FormPage>
  );
}

export function N400FormPage2({ d }) {
  return (
    <FormPage page={2}>
      <PartBar title="Part 2. Information About You (Person applying for naturalization)" />
      <Item number="1.">
        <p className="text-[11px] font-bold text-slate-800">Your Current Legal Name (do not provide a nickname)</p>
        <div className="grid grid-cols-3 gap-1">
          <Field label="Family Name (Last Name)" value={d.family} />
          <Field label="Given Name (First Name)" value={d.given} />
          <Field label="Middle Name (if applicable)" value="N/A" />
        </div>
      </Item>
      <Item number="2.">
        <p className="text-[11px] font-bold text-slate-800">Other Names You Have Used Since Birth</p>
        <Note>Include aliases, maiden name, family name at birth, assumed names, nicknames, and alternate spellings or variations of your name.</Note>
        <div className="grid grid-cols-3 gap-1">
          <Field label="Family Name (Last Name)" value="N/A" />
          <Field label="Given Name (First Name)" value="N/A" />
          <Field label="Middle Name (if applicable)" value="N/A" />
        </div>
      </Item>
      <Item number="3.">
        <p className="text-[11px] font-bold text-slate-800">Would you like to legally change your name?</p>
        <YesNo yes={false} />
        <Note>No (skip to Item Number 4.)</Note>
      </Item>
      <div className="grid grid-cols-2 gap-1">
        <Item number="4.">
          <p className="text-[11px] font-bold text-slate-800">USCIS Online Account Number (if any)</p>
          <p className="font-mono text-xs text-slate-900">N/A</p>
        </Item>
        <Item number="5.">
          <p className="text-[11px] font-bold text-slate-800">Sex</p>
          <div className="flex items-center gap-4">
            <CheckBox checked={d.sex === 'Male'} label="Male" />
            <CheckBox checked={d.sex === 'Female'} label="Female" />
          </div>
        </Item>
      </div>
      <Item number="6.">
        <p className="text-[11px] font-bold text-slate-800">Date of Birth (mm/dd/yyyy)</p>
        <p className="font-mono text-xs text-slate-900">About {d.birthYear} (example)</p>
        <Note>
          In addition to your actual date of birth, include any other dates of birth you have ever used, including
          dates used in connection with any legal names or non-legal names, in the space provided in Part 14.
          Additional Information.
        </Note>
      </Item>
      <Item number="7.">
        <p className="text-[11px] font-bold text-slate-800">
          If you are a lawful permanent resident, provide the date you became a lawful permanent resident
          (mm/dd/yyyy).
        </p>
        <p className="font-mono text-xs text-slate-900">About {d.lprYear} (example)</p>
      </Item>
      <div className="grid grid-cols-2 gap-1">
        <Item number="8.">
          <p className="text-[11px] font-bold text-slate-800">Country of Birth</p>
          <p className="font-mono text-xs text-slate-900">{d.countryOfBirth}</p>
        </Item>
        <Item number="9.">
          <p className="text-[11px] font-bold text-slate-800">Country of Citizenship or Nationality</p>
          <p className="font-mono text-xs text-slate-900">{d.countryOfBirth}</p>
        </Item>
      </div>
      <Item number="10.">
        <p className="text-[11px] font-bold text-slate-800">
          Was your mother or father (including adoptive mother or father) a U.S. citizen before your 18th birthday?
        </p>
        <YesNo yes={false} />
      </Item>
      <Item number="11.">
        <p className="text-[11px] font-bold text-slate-800">
          Do you have a physical or developmental disability or mental impairment that prevents you from
          demonstrating your knowledge and understanding of the English language or civics requirements for
          naturalization?
        </p>
        <YesNo yes={false} />
        <Note>
          If you answered "Yes," submit a completed Form N-648, Medical Certification for Disability Exceptions,
          when you file your Form N-400.
        </Note>
      </Item>
      <GroupIntro text="Social Security Update" />
      <Item number="12.a.">
        <p className="text-[11px] font-bold text-slate-800">
          Do you want the Social Security Administration (SSA) to issue you an original or replacement Social
          Security card and update your immigration status with the SSA if and when you are naturalized?
        </p>
        <YesNo yes={false} />
        <Note>No (Go to Part 3.)</Note>
      </Item>
    </FormPage>
  );
}

export function N400FormPage3({ d }) {
  return (
    <FormPage page={3}>
      <PartBar
        title="Part 3. Biographic Information"
        note="USCIS requires you to complete the categories below to conduct background checks."
      />
      <div className="grid grid-cols-2 gap-1">
        <Item number="1.">
          <p className="text-[11px] font-bold text-slate-800">Ethnicity (Select only one box)</p>
          <div className="flex gap-4">
            <CheckBox label="Hispanic or Latino" checked={false} />
            <CheckBox label="Not Hispanic or Latino" checked={false} />
          </div>
        </Item>
        <Item number="2.">
          <p className="text-[11px] font-bold text-slate-800">Race (Select all applicable boxes)</p>
          <div className="flex flex-wrap gap-3">
            {['American Indian', 'Asian', 'Black or African American', 'Native Hawaiian or Other Pacific Islander', 'White'].map((r) => (
              <CheckBox key={r} label={r} checked={false} />
            ))}
          </div>
        </Item>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Item number="3.">
          <p className="text-[11px] font-bold text-slate-800">Height</p>
          <div className="grid grid-cols-2 gap-1">
            <Field label="Feet" value="" />
            <Field label="Inches" value="" />
          </div>
        </Item>
        <Item number="4.">
          <p className="text-[11px] font-bold text-slate-800">Weight</p>
          <Field label="Pounds" value="" />
        </Item>
      </div>
      <Item number="5.">
        <p className="text-[11px] font-bold text-slate-800">Eye color (Select only one box)</p>
        <div className="flex flex-wrap gap-3">
          {['Black', 'Blue', 'Brown', 'Gray', 'Green', 'Hazel', 'Maroon', 'Pink', 'Unknown/Other'].map((c) => (
            <CheckBox key={c} label={c} checked={false} />
          ))}
        </div>
      </Item>
      <Item number="6.">
        <p className="text-[11px] font-bold text-slate-800">Hair color (Select only one box)</p>
        <div className="flex flex-wrap gap-3">
          {['Bald (No hair)', 'Black', 'Blond', 'Brown', 'Gray', 'Red', 'Sandy', 'White', 'Unknown/Other'].map((c) => (
            <CheckBox key={c} label={c} checked={false} />
          ))}
        </div>
      </Item>
      <Note>(Part 3 is left blank in this practice copy — a real applicant fills in their own answers.)</Note>
      <PartBar title="Part 4. Information About Your Residence" />
      <Item number="1.">
        <p className="text-[11px] font-bold text-slate-800">Current Physical Address</p>
        <div className="grid grid-cols-3 gap-1">
          <Field label="In Care Of Name (if any)" value="N/A" className="col-span-1" />
          <Field label="Street Number and Name" value={d.address.street} className="col-span-2" />
        </div>
        <div className="grid grid-cols-4 gap-1">
          <Field label="Apt. Ste. Flr. Number" value={d.address.apt} />
          <Field label="City or Town" value={d.address.city} />
          <Field label="State" value={d.address.state} />
          <Field label="ZIP Code" value={d.address.zip} />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <Field label="Province (foreign address only)" value="N/A" />
          <Field label="Postal Code (foreign address only)" value="N/A" />
          <Field label="Country (foreign address only)" value="N/A" />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Field label="Dates of Residence: From (mm/dd/yyyy)" value={`About ${d.lprYear} (example)`} />
          <Field label="Dates of Residence: To (mm/dd/yyyy)" value="PRESENT" />
        </div>
      </Item>
    </FormPage>
  );
}

export function N400FormPage4({ d }) {
  const married = d.maritalStatus === 'Married';
  return (
    <FormPage page={4}>
      <PartBar title="Part 4. Information About Your Residence (continued)" />
      <Item number="2.">
        <p className="text-[11px] font-bold text-slate-800">
          Is your current physical address also your current mailing address?
        </p>
        <YesNo yes />
        <Note>Yes (If you answered "Yes," skip to Part 5.)</Note>
      </Item>
      <Item number="3.">
        <p className="text-[11px] font-bold text-slate-800">Current Mailing Address (Safe Mailing Address, if applicable)</p>
        <p className="font-mono text-xs text-slate-500">(Skipped — the mailing address is the same as the physical address.)</p>
      </Item>
      <PartBar title="Part 5. Information About Your Marital History" />
      <Item number="1.">
        <p className="text-[11px] font-bold text-slate-800">What is your current marital status?</p>
        <div className="flex flex-wrap gap-4">
          {['Single, Never Married', 'Married', 'Divorced', 'Widowed', 'Separated', 'Marriage Annulled'].map((s) => (
            <CheckBox key={s} label={s} checked={s === d.maritalStatus} />
          ))}
        </div>
        <Note>If you are single and have never married, go to Part 6. Information About Your Children.</Note>
      </Item>
      <Item number="2.">
        <p className="text-[11px] font-bold text-slate-800">
          If you are currently married, is your spouse a current member of the U.S. armed forces?
        </p>
        <YesNo yes={married ? false : undefined} na={!married} />
      </Item>
      <Item number="3.">
        <p className="text-[11px] font-bold text-slate-800">How many times have you been married?</p>
        <p className="font-mono text-xs text-slate-900">{d.marriages === 0 ? 'None' : d.marriages}</p>
      </Item>
      <GroupIntro text="Your Current Marriage — If you are currently married, including if you are legally separated, provide the following information about your current spouse." />
      <Item number="4.a.">
        <p className="text-[11px] font-bold text-slate-800">Current Spouse's Legal Name</p>
        {married && d.spouse ? (
          <div className="grid grid-cols-3 gap-1">
            <Field label="Family Name (Last Name)" value={d.spouse.family} />
            <Field label="Given Name (First Name)" value={d.spouse.given} />
            <Field label="Middle Name (if applicable)" value="N/A" />
          </div>
        ) : (
          <p className="font-mono text-xs text-slate-500">(Not applicable — {d.name.split(' ')[0]} is not currently married.)</p>
        )}
      </Item>
      {married && d.spouse && (
        <>
          <div className="grid grid-cols-2 gap-1">
            <Item number="4.b.">
              <p className="text-[11px] font-bold text-slate-800">Current Spouse's Date of Birth (mm/dd/yyyy)</p>
              <p className="font-mono text-xs text-slate-500">(left blank in this practice copy)</p>
            </Item>
            <Item number="4.c.">
              <p className="text-[11px] font-bold text-slate-800">Date You Entered into Marriage with Current Spouse (mm/dd/yyyy)</p>
              <p className="font-mono text-xs text-slate-900">{d.spouse.year ? `About ${d.spouse.year} (example)` : ''}</p>
            </Item>
          </div>
          <Item number="4.d.">
            <p className="text-[11px] font-bold text-slate-800">
              Is your current spouse's present physical address the same as your physical address?
            </p>
            <YesNo yes />
          </Item>
          <div className="grid grid-cols-2 gap-1">
            <Item number="5.a.">
              <p className="text-[11px] font-bold text-slate-800">When did your current spouse become a U.S. citizen?</p>
              <YesNo yes={undefined} na />
              <Note>N/A — not filing under Part 1., Item Number 1.B. (Spouse of U.S. Citizen)</Note>
            </Item>
            <Item number="6.">
              <p className="text-[11px] font-bold text-slate-800">Current Spouse's Alien Registration Number (A-Number) (if any)</p>
              <p className="font-mono text-xs text-slate-500">(left blank in this practice copy)</p>
            </Item>
          </div>
          <Item number="7.">
            <p className="text-[11px] font-bold text-slate-800">How many times has your current spouse been married?</p>
            <p className="font-mono text-xs text-slate-500">(left blank in this practice copy)</p>
          </Item>
        </>
      )}
    </FormPage>
  );
}