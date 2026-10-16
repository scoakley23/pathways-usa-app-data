import React from 'react';
import { YesNo, PartBar, Item, GroupIntro, Note, FormPage } from './N400FormPrimitives';

// Pages 8-11 of the practice copy: Part 9 (Additional Information About You)
// with the full yes/no question list, and Part 10 (fee reduction).

function Q({ number, text, yes, na }) {
  return (
    <Item number={number}>
      <p className="text-[11px] font-semibold text-slate-800 leading-snug">{text}</p>
      <YesNo yes={yes} na={na} />
    </Item>
  );
}

const ADVOCACY_BULLETS = [
  'Opposition to all organized government;',
  'World communism;',
  'The establishment in the United States of a totalitarian dictatorship;',
  'The overthrow (by force or violence or other unconstitutional means) of the Government of the United States or all forms of law;',
  'The unlawful assaulting or killing of any officer or officers of the Government of the United States or of any other organized government because of their official character;',
  'The unlawful damage, injury, or destruction of property;',
  'Sabotage.',
];

export function N400FormPage8({ d }) {
  return (
    <FormPage page={8}>
      <PartBar title="Part 9. Additional Information About You" />
      <Note>
        When a question includes the word "EVER," you must provide information about any of your actions or
        conduct that occurred anywhere in the world at any time, unless the question specifies otherwise. If you
        answer "Yes" to any of the questions in Item Numbers 1. - 14., provide explanations and any additional
        information in the space provided in Part 14. Additional Information.
      </Note>
      <Q number="1." text="Have you EVER claimed to be a U.S. citizen (in writing or any other way)?" yes={false} />
      <Q
        number="2."
        text='Have you EVER registered to vote or voted in any Federal, state, or local election in the United States? If you lawfully voted only in a local election where noncitizens are eligible to vote, you may answer "No."'
        yes={false}
      />
      <Q
        number="3."
        text="Do you currently owe any overdue Federal, state, or local taxes in the United States?"
        yes={false}
      />
      <Q
        number="4."
        text='Since you became a lawful permanent resident, have you called yourself a "nonresident alien" on a Federal, state, or local tax return or decided not to file a tax return because you considered yourself to be a nonresident?'
        yes={false}
      />
      <GroupIntro text="Have you EVER:" />
      <Q
        number="5.a."
        text="Been a member of, involved in, or in any way associated with any Communist or totalitarian party anywhere in the world?"
        yes={false}
      />
      <Item number="5.b.">
        <p className="text-[11px] font-semibold text-slate-800 leading-snug">
          Advocated (supported or promoted) any of the following or been a member of, involved in, or in any way
          associated with any group anywhere in the world that advocated any of the following:
        </p>
        <YesNo yes={false} />
        <ul className="text-[10px] text-slate-800 list-disc pl-8 space-y-0.5">
          {ADVOCACY_BULLETS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Item>
      <GroupIntro
        text="Have you EVER been a member of, involved in, or in any way associated with, or have you EVER provided money, a thing of value, services or labor, or any other assistance or support to a group that:"
      />
      <Q number="6.a." text="Used a weapon or explosive with intent to harm another person or cause damage to property?" yes={false} />
      <Q
        number="6.b."
        text="Engaged or participated in kidnapping, assassination, or hijacking or sabotage of an airplane, ship, vehicle, or other mode of transportation?"
        yes={false}
      />
      <Q
        number="6.c."
        text="Threatened, attempted (tried), conspired, planned, advocated for, or incited (encouraged) others to commit any of the acts listed in Item Numbers 6.a. or 6.b.?"
        yes={false}
      />
    </FormPage>
  );
}

export function N400FormPage9({ d }) {
  return (
    <FormPage page={9}>
      <PartBar title="Part 9. Additional Information About You (continued)" />
      <GroupIntro text="Have you EVER ordered, incited, called for, committed, assisted, helped with, or otherwise participated in any of the following:" />
      <div className="grid grid-cols-2 gap-1">
        <Q number="7.a." text="Torture?" yes={false} />
        <Q number="7.b." text="Genocide?" yes={false} />
      </div>
      <Q number="7.c." text="Killing or trying to kill any person?" yes={false} />
      <Q number="7.d." text="Intentionally and severely injuring or trying to injure any person?" yes={false} />
      <Q
        number="7.e."
        text="Any kind of sexual contact or activity with any person who did not consent (did not agree) or was unable to consent (could not agree), or was being forced or threatened by you or by someone else?"
        yes={false}
      />
      <div className="grid grid-cols-2 gap-1">
        <Q number="7.f." text="Not letting someone practice their religion?" yes={false} />
        <Q
          number="7.g."
          text="Causing harm or suffering to any person because of their race, religion, national origin, membership in a particular social group, or political opinion?"
          yes={false}
        />
      </div>
      <Q
        number="8.a."
        text="Have you EVER served in, been a member of, assisted (helped), or participated in any military or police unit?"
        yes={false}
      />
      <Q
        number="8.b."
        text="Have you EVER served in, been a member of, assisted (helped), or participated in any armed group (for example: paramilitary unit, self-defense unit, vigilante unit, rebel group, or guerrilla group)?"
        yes={false}
      />
      <Note>
        If you answered "Yes" to Item Number 8.a. or 8.b., include the name of the country, the name of the
        military unit or armed group, your rank or position, and your dates of involvement in your explanation in
        Part 14. Additional Information.
      </Note>
      <Q
        number="9."
        text="Have you EVER worked, volunteered, or otherwise served in a place where people were detained (forced to stay), for example, a prison, jail, or detention camp?"
        yes={false}
      />
      <Q number="10." text="Have you EVER received any type of military, paramilitary, or weapons training?" yes={false} />
      <Q number="11." text="Have you EVER recruited or used anyone under 15 years of age to serve in or help an armed force or group?" yes={false} />
      <Q number="12." text="Do you now have, or did you EVER have, a hereditary title or an order of nobility?" yes={false} />
      <Q
        number="13."
        text="Have you EVER given false or misleading information to any U.S. government official, or lied to obtain a visa or any other immigration benefit?"
        yes={false}
      />
      <Q number="14." text="Have you EVER failed to support your dependents or pay alimony?" yes={false} />
    </FormPage>
  );
}

export function N400FormPage10({ d }) {
  return (
    <FormPage page={10}>
      <PartBar title="Part 9. Additional Information About You (continued)" />
      <Q
        number="15."
        text="Have you EVER been arrested, cited, or detained by any law enforcement officer (including any immigration official or any official of the U.S. armed forces)?"
        yes={d.cited}
      />
      <Q
        number="16."
        text="Have you EVER been charged with committing, arrested for, or convicted of a crime?"
        yes={d.charged}
      />
      <Q
        number="17."
        text="Have you EVER been placed in an alternative sentencing or a rehabilitative program (for example: diversion, deferred prosecution, withheld judgment, deferred adjudication)?"
        yes={false}
      />
      <Q
        number="18."
        text="Have you EVER received a suspended sentence, been placed on probation, or been paroled?"
        yes={false}
      />
      <Q number="19." text="Have you EVER been a habitual drunkard?" yes={false} />
      <Q
        number="20."
        text="Have you EVER been involved in prostitution or the procurement of anyone for prostitution?"
        yes={false}
      />
      <Q
        number="21."
        text="Have you EVER sold or smuggled controlled substances, or assisted in such activities?"
        yes={false}
      />
      <Q number="22." text="Have you EVER been married to more than one person at the same time?" yes={false} />
      <Q
        number="23."
        text="Have you EVER helped anyone enter the United States in violation of law?"
        yes={false}
      />
      <Q
        number="24."
        text="Have you EVER gambled illegally or received income from illegal gambling?"
        yes={false}
      />
      <Q number="25." text="Have you EVER been in jail or prison?" yes={false} />
      <Note>If you answered "No" to Item Number 25., go to Item Number 30.a.</Note>
      <div className="border border-black bg-slate-50 px-2 py-1.5 space-y-1">
        <p className="text-[9px] italic text-slate-600">
          Item Numbers 26. - 29. (why were you in jail or prison, dates of confinement From/To, and location) —
          completed only if you answered "Yes" to Item Number 25. Left blank for {d.name.split(' ')[0]}.
        </p>
      </div>
      <Q number="30.a." text="Have you EVER been ordered removed by an immigration judge?" yes={false} />
      <Q
        number="30.b."
        text="Have you EVER applied for any kind of relief or protection from removal?"
        yes={false}
      />
    </FormPage>
  );
}

export function N400FormPage11({ d }) {
  return (
    <FormPage page={11}>
      <PartBar title="Part 9. Additional Information About You (continued)" />
      <Item number="31.">
        <p className="text-[11px] font-semibold text-slate-800 leading-snug">
          If you are a male, did you register with the Selective Service System between the ages of 18 and 26?
        </p>
        {d.selectiveService === null ? (
          <>
            <YesNo yes={undefined} na />
            <Note>N/A — this question applies to male applicants.</Note>
          </>
        ) : (
          <YesNo yes={d.selectiveService} />
        )}
      </Item>
      <Q
        number="32."
        text="Do you support the Constitution and form of government of the United States?"
        yes
      />
      <Q number="33." text="Are you willing to take the full Oath of Allegiance to the United States?" yes />
      <Q number="34." text="If necessary, would you be willing to bear arms on behalf of the United States?" yes />
      <Q number="35." text="Would you perform noncombatant services in the U.S. armed forces?" yes />
      <Q
        number="36."
        text="Would you be willing to perform work of national importance under civilian direction?"
        yes
      />
      <PartBar title="Part 10. Request for a Fee Reduction" />
      <Note>
        For information about fees, fee waivers, and reduced fees, see Form G-1055, Fee Schedule, at
        www.uscis.gov/g-1055. To apply for a reduced fee, complete Item Numbers 1. - 5.b. If you are not
        eligible for a reduced fee, complete Item Number 1. and proceed to Part 11.
      </Note>
      <Item number="1.">
        <p className="text-[11px] font-semibold text-slate-800 leading-snug">
          My household income is less than or equal to 400% of the Federal Poverty Guidelines (see Instructions
          for required documentation).
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
            No
            <span className="inline-flex w-3.5 h-3.5 items-center justify-center border border-black bg-white text-[9px] font-bold">
              X
            </span>
            (skip to Part 11.)
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
            Yes
            <span className="inline-flex w-3.5 h-3.5 items-center justify-center border border-black bg-white text-[9px] font-bold" />
            (complete Item Numbers 2. - 5.b.)
          </span>
        </div>
      </Item>
    </FormPage>
  );
}