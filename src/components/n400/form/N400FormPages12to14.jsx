import React from 'react';
import { PartBar, Item, Field, GroupIntro, Note, FormPage } from './N400FormPrimitives';

// Pages 12-14 of the practice copy: Part 11 (applicant's certification and
// signature), Part 12 (interpreter), Part 13 (preparer), Part 14 (additional
// information), Part 15 (signature at interview), and Part 16 (Oath of
// Allegiance).

const OATH_TEXT =
  'I hereby declare, on oath, that I absolutely and entirely renounce and abjure all allegiance and fidelity to any foreign prince, potentate, state, or sovereignty, of whom or which I have heretofore been a subject or citizen; that I will support and defend the Constitution and laws of the United States of America against all enemies, foreign and domestic; that I will bear true faith and allegiance to the same; that I will bear arms on behalf of the United States when required by the law; that I will perform noncombatant service in the Armed Forces of the United States when required by the law; that I will perform work of national importance under civilian direction when required by the law; and that I take this obligation freely, without any mental reservation or purpose of evasion; so help me God.';

export function N400FormPage12({ d }) {
  const first = d.name.split(' ')[0];
  return (
    <FormPage page={12}>
      <PartBar title="Part 11. Applicant's Contact Information, Certification, and Signature" />
      <GroupIntro text="Applicant's Contact Information" />
      <Item number="1.">
        <div className="grid grid-cols-3 gap-1">
          <Field label="Daytime Telephone Number" value="(left blank — example)" />
          <Field label="Mobile Telephone Number" value="(left blank — example)" />
          <Field label="Email Address (if any)" value="(left blank — example)" />
        </div>
      </Item>
      <GroupIntro text="Applicant's Certification and Signature" />
      <Note>
        I certify, under penalty of perjury under the laws of the United States of America, that this application,
        and any evidence submitted with it, are all true and correct. I authorize the release of any information
        from my immigration record that U.S. Citizenship and Immigration Services needs to determine my
        eligibility for naturalization. I understand that I may be tested on my ability to read, write, and speak
        English and on my knowledge of civics, and that I will be required to take the Oath of Allegiance to
        become a U.S. citizen. (Example text for practice.)
      </Note>
      <div className="grid grid-cols-2 gap-1">
        <Item number="2.a.">
          <p className="text-[11px] font-bold text-slate-800">
            Applicant's Signature (or signature of a legal guardian, surrogate, or designated representative, if
            applicable)
          </p>
          <p className="font-serif italic text-lg text-slate-800 px-1">{d.name}</p>
          <p className="text-[9px] text-slate-500">(signed name shown as an example)</p>
        </Item>
        <Item number="2.b.">
          <p className="text-[11px] font-bold text-slate-800">Date of Signature (mm/dd/yyyy)</p>
          <p className="font-typewriter text-xs text-black">{d.filingYear} (example)</p>
        </Item>
      </div>
      <PartBar title="Part 12. Interpreter's Contact Information, Certification, and Signature" />
      <div className="border border-black bg-slate-50 px-2 py-1.5">
        <p className="text-[10px] italic text-slate-600">
          Left blank — {first} completed this application in English without an interpreter. (practice example)
        </p>
      </div>
      <Note>
        If you used an interpreter, this part is where the interpreter provides their contact information and
        certifies that they interpreted the application accurately.
      </Note>
    </FormPage>
  );
}

export function N400FormPage13({ d }) {
  const first = d.name.split(' ')[0];
  return (
    <FormPage page={13}>
      <PartBar title="Part 13. Contact Information, Declaration, and Signature of Person Preparing this Application, if Other Than the Applicant" />
      <div className="border border-black bg-slate-50 px-2 py-1.5">
        <p className="text-[10px] italic text-slate-600">
          Left blank — {first} completed this application without a lawyer, preparer, or interpreter. (practice
          example)
        </p>
      </div>
      <PartBar
        title="Part 14. Additional Information"
        note="If you need extra space to answer any question, provide the page number, part number, and item number here, and write your answer in the space below."
      />
      <div className="grid grid-cols-2 gap-1">
        <Item number="A-">
          <p className="text-[11px] font-bold text-slate-800">Name of Applicant</p>
          <p className="font-typewriter text-xs text-black">{d.name}</p>
        </Item>
        <Item number="A-">
          <p className="text-[11px] font-bold text-slate-800">A-Number of Applicant (if any)</p>
          <p className="font-typewriter text-xs text-slate-500">(left blank in this practice copy)</p>
        </Item>
      </div>
      {d.part14Rows.length > 0 ? (
        d.part14Rows.map((r) => (
          <Item key={r.item} number="1.">
            <div className="grid grid-cols-3 gap-1 mb-1">
              <Field label="Page Number" value="10" />
              <Field label="Part Number" value="9." />
              <Field label="Item Number" value={r.item} />
            </div>
            <Field label="Explanation" value={r.text} />
          </Item>
        ))
      ) : (
        <Item number="1.">
          <p className="font-typewriter text-xs text-slate-500">
            (No additional information — {first} answered "No" to every question in Part 9., except the Oath
            questions, which they answered "Yes.")
          </p>
        </Item>
      )}
    </FormPage>
  );
}

export function N400FormPage14({ d }) {
  return (
    <FormPage page={14}>
      <PartBar title="Part 15. Signature at Interview" />
      <Note>
        I swear (affirm) that the contents of my application are true and correct, and that the answers I gave at
        my naturalization interview are true and correct. (Example text for practice — this part is completed at
        the interview, in front of the USCIS officer.)
      </Note>
      <Item number="1.a.">
        <p className="text-[11px] font-bold text-slate-800">Applicant's Signature at Interview</p>
        <p className="font-typewriter text-xs text-slate-500">(signed later, at the interview)</p>
      </Item>
      <Item number="1.b.">
        <p className="text-[11px] font-bold text-slate-800">Date of Signature (mm/dd/yyyy)</p>
        <p className="font-typewriter text-xs text-slate-500">(the interview date)</p>
      </Item>
      <PartBar title="Part 16. Oath of Allegiance" note="Completed at the naturalization ceremony." />
      <div className="border border-black bg-white px-2 py-2">
        <p className="text-[10px] leading-relaxed text-slate-800">"{OATH_TEXT}"</p>
        <p className="text-[9px] italic text-slate-600 mt-1">
          In certain cases, applicants may take a modified oath. This is the full Oath of Allegiance, shown as an
          example for practice.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Item number="1.a.">
          <p className="text-[11px] font-bold text-slate-800">Signature at Ceremony</p>
          <p className="font-typewriter text-xs text-slate-500">(signed later, at the ceremony)</p>
        </Item>
        <Item number="1.b.">
          <p className="text-[11px] font-bold text-slate-800">Date of Signature (mm/dd/yyyy)</p>
          <p className="font-typewriter text-xs text-slate-500">(the ceremony date)</p>
        </Item>
      </div>
    </FormPage>
  );
}