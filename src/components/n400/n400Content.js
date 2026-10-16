// Static N-400 Question Guide content, based on Form N-400 (Edition 01/20/25).
// Cards with status 'approved' are live for all learners. Set a card's status
// back to 'draft' to hide it from learners while it is being reviewed.
// "meaning" text is based on the form's own wording and does not tell a
// learner how to answer.

export const N400_SECTIONS = [
  {
    id: 'time-outside-us',
    title: 'Time Outside the U.S.',
    partLabel: 'Part 8 of Form N-400',
    status: 'approved',
    questions: [
      {
        id: 'p8-1',
        label: '8.1',
        status: 'approved',
        official:
          'List below all the trips that you have taken outside the United States during the last 5 years (if you are filing based on the general provision). Start with your most recent trip and work backwards. Do not include day trips (where the entire trip was completed within 24 hours) in the table. If you have taken any trips outside the United States that lasted more than 6 months, see the Required Evidence - Continuous Residence section of the Instructions for evidence you should provide.',
        meaning:
          'This part of the form asks you to write down every trip you took outside the United States during the required time period. Start with your most recent trip. Then go back in time. Do not write down day trips — trips where you left and came back within 24 hours. If any trip lasted more than 6 months, the Instructions list evidence you can provide.',
        words: [
          { word: 'trip', definition: 'A time when you left the United States and then came back.' },
          { word: 'day trip', definition: 'A trip where you left and returned within 24 hours (one day).' },
          { word: 'work backwards', definition: 'Start with the most recent trip first, then go back in time.' },
          { word: 'evidence', definition: 'Documents that show something is true.' },
        ],
        officerPhrasings: [
          'Tell me about the trips you have taken outside the United States.',
          'How many trips of more than 24 hours have you taken outside the United States?',
          'Have you taken any trips outside the United States that lasted more than 6 months?',
        ],
      },
    ],
  },
  {
    id: 'citizenship-voting-taxes',
    title: 'Citizenship, Voting, and Taxes',
    partLabel: 'Part 9 of Form N-400, Items 1-4',
    status: 'approved',
    questions: [
      {
        id: 'p9-1',
        label: '1',
        status: 'approved',
        official: 'Have you EVER claimed to be a U.S. citizen (in writing or any other way)?',
        meaning:
          'This question asks whether you have ever said or written that you are a U.S. citizen. EVER means at any time in your life.',
        words: [
          { word: 'claimed', definition: 'Said or wrote that something is true.' },
          { word: 'EVER', definition: 'At any time in your whole life.' },
        ],
        officerPhrasings: [
          'Have you ever told anyone you were a U.S. citizen?',
          'Have you ever claimed to be a U.S. citizen?',
        ],
      },
      {
        id: 'p9-2',
        label: '2',
        status: 'approved',
        official:
          'Have you EVER registered to vote or voted in any Federal, state, or local election in the United States? If you lawfully voted only in a local election where aliens are eligible to vote, you may answer "No."',
        meaning:
          'This question asks whether you have ever signed up to vote or voted in a U.S. election. The form notes one exception: if you lawfully voted only in a local election where non-citizens were allowed to vote, the form says you may answer "No."',
        words: [
          { word: 'registered to vote', definition: 'Signed your name on an official list of voters.' },
          { word: 'Federal, state, or local', definition: 'For the whole country (federal), for your state, or for your city or town.' },
          { word: 'eligible', definition: 'Allowed by the rules.' },
        ],
        officerPhrasings: [
          'Have you ever registered to vote in the United States?',
          'Have you ever voted in any election here?',
        ],
      },
      {
        id: 'p9-3',
        label: '3',
        status: 'approved',
        official: 'Do you currently owe any overdue Federal, state, or local taxes in the United States?',
        meaning:
          'This question asks whether, right now, you owe taxes that are past the deadline and not yet paid.',
        words: [
          { word: 'currently', definition: 'Now, at this time.' },
          { word: 'owe', definition: 'To need to pay money.' },
          { word: 'overdue', definition: 'Past the deadline for payment.' },
        ],
        officerPhrasings: [
          'Do you owe any overdue taxes right now?',
          'Do you currently owe any Federal, state, or local taxes?',
        ],
      },
      {
        id: 'p9-4',
        label: '4',
        status: 'approved',
        official:
          'Since you became a lawful permanent resident, have you called yourself a "nonresident alien" on a Federal, state, or local tax return or decided not to file a tax return because you considered yourself to be a nonresident?',
        meaning:
          'This question asks about your tax returns since you got your green card. It asks whether you wrote "nonresident alien" on a tax return, or skipped filing a tax return because you considered yourself a nonresident (someone who does not live mainly in the United States).',
        words: [
          { word: 'lawful permanent resident', definition: 'A person with a green card — permission to live and work in the United States permanently.' },
          { word: 'tax return', definition: 'The form you send to the government about your income and taxes.' },
          { word: 'nonresident', definition: 'A person who does not live mainly in the United States.' },
        ],
        officerPhrasings: [
          'Did you ever file taxes as a "nonresident alien"?',
          'Did you ever decide not to file a tax return because you considered yourself a nonresident?',
        ],
      },
    ],
  },
  {
    id: 'groups-violence',
    title: 'Groups and Violence',
    partLabel: 'Part 9 of Form N-400, Items 5-14',
    status: 'approved',
    questions: [
      {
        id: 'p9-5',
        label: '5.a - 5.b',
        status: 'approved',
        official:
          '5.a. Have you EVER been a member of, involved in, or in any way associated with any Communist or totalitarian party anywhere in the world? 5.b. Have you EVER advocated (supported and promoted) any of the following, or been a member of, involved in, or in any way associated with any group anywhere in the world that advocated any of the following: Opposition to all organized government; World communism; The establishment in the United States of a totalitarian dictatorship; The overthrow by force or violence or other unconstitutional means of the Government of the United States or all forms of law; The unlawful assaulting or killing of any officer or officers of the Government of the United States or of any other organized government because of their official character; The unlawful damage, injury, or destruction of property; or Sabotage?',
        meaning:
          'The first question asks whether you have ever been part of, or connected to, a Communist or totalitarian party. The second asks whether you have ever supported any of the ideas in the list, or been part of a group that supported them.',
        words: [
          { word: 'totalitarian', definition: 'A political system that does not allow opposing parties or viewpoints.' },
          { word: 'advocated', definition: 'Supported and promoted.' },
          { word: 'associated with', definition: 'Connected to, took part in, or helped.' },
          { word: 'overthrow', definition: 'To remove a government from power.' },
          { word: 'sabotage', definition: 'Secretly damaging or destroying something, like a factory or bridge.' },
        ],
        officerPhrasings: [
          'Have you ever been a member of the Communist Party?',
          'Have you ever been part of a group that wanted to overthrow a government by force?',
        ],
      },
      {
        id: 'p9-6',
        label: '6.a - 6.c',
        status: 'approved',
        official:
          '6.a. Have you EVER been a member of, involved in, or in any way associated with, or have you EVER provided money, a thing of value, services or labor, or any other assistance or support to a group that used a weapon or explosive with intent to harm another person or cause damage to property? 6.b. Have you EVER been a member of, involved in, or in any way associated with, or have you EVER provided money, a thing of value, services or labor, or any other assistance or support to a group that engaged (participated) in kidnapping, assassination, or hijacking or sabotage of an airplane, ship, vehicle, or other mode of transportation? 6.c. Have you EVER been a member of, involved in, or in any way associated with, or have you EVER provided money, a thing of value, services or labor, or any other assistance or support to a group that threatened, attempted (tried), conspired (planned with others), prepared, planned, advocated for, or incited (encouraged) others to commit any of the acts listed in Item Numbers 6.a. or 6.b.?',
        meaning:
          'These questions ask about groups that used weapons or violence. They ask whether you were part of one — or whether you gave it money, something of value, work, or any other kind of help. The last question also covers planning, trying, or encouraging any of these acts.',
        words: [
          { word: 'thing of value', definition: 'Something worth money.' },
          { word: 'conspired', definition: 'Planned with others.' },
          { word: 'incited', definition: 'Encouraged others to do something.' },
          { word: 'hijacking', definition: 'Taking control of a plane, ship, or vehicle by force.' },
          { word: 'assassination', definition: 'Killing an important person on purpose.' },
        ],
        officerPhrasings: [
          'Have you ever belonged to a group that used weapons to harm people?',
          'Have you ever given money or help to a group like that?',
        ],
      },
      {
        id: 'p9-7',
        label: '7.a - 7.g',
        status: 'approved',
        official:
          'Have you EVER ordered, incited, called for, committed, assisted, helped with, or otherwise participated in any of the following: Torture? Genocide? Killing or trying to kill any person? Intentionally and severely injuring or trying to injure any person? Any kind of sexual contact or activity with any person who did not consent (did not agree) or was unable to consent (could not agree), or was being forced or threatened by you or by someone else? Not letting someone practice his or her religion? Causing harm or suffering to any person because of his or her race, religion, national origin, membership in a particular social group, or political opinion?',
        meaning:
          'This question asks whether you have ever ordered, encouraged, taken part in, or helped with any of the serious harms in this list — for example, torture, genocide, killing or trying to kill someone, or harming someone because of their race, religion, or political opinion.',
        words: [
          { word: 'torture', definition: 'Causing serious pain to a person on purpose, often to punish them or force them to talk.' },
          { word: 'genocide', definition: 'Trying to destroy a whole group of people because of their race, religion, or nationality.' },
          { word: 'consent', definition: 'To agree.' },
          { word: 'national origin', definition: 'The country a person comes from.' },
          { word: 'political opinion', definition: 'What a person believes about politics and government.' },
        ],
        officerPhrasings: [
          'Have you ever taken part in hurting anyone — for example, torture or killing?',
          'Have you ever ordered or helped with any of the acts on this list?',
        ],
      },
      {
        id: 'p9-8',
        label: '8.a - 8.b',
        status: 'approved',
        official:
          '8.a. Have you EVER served in, been a member of, assisted (helped), or participated in any military or police unit? 8.b. Have you EVER served in, been a member of, assisted (helped), or participated in any armed group (a group that carries weapons), for example: paramilitary unit (a group of people who act like a military group but are not part of the official military), self-defense unit, vigilante unit, rebel group, or guerrilla group?',
        meaning:
          'These questions ask about military, police, and armed groups anywhere in the world. They ask whether you served in one, were a member, or helped one in any way.',
        words: [
          { word: 'paramilitary unit', definition: 'A group that acts like a military group but is not the official military.' },
          { word: 'vigilante unit', definition: 'A group that punishes people without legal authority.' },
          { word: 'rebel group', definition: 'An armed group that fights against a government.' },
          { word: 'guerrilla group', definition: 'A small armed group that uses surprise attacks.' },
        ],
        officerPhrasings: [
          'Did you ever serve in a military or police unit?',
          'Have you ever been part of an armed group, like a rebel or self-defense group?',
        ],
      },
      {
        id: 'p9-9',
        label: '9',
        status: 'approved',
        official:
          'Have you EVER worked, volunteered, or otherwise served in a place where people were detained (forced to stay), for example, a prison, jail, prison camp (a camp where prisoners of war or political prisoners are kept), detention facility, or labor camp, or have you EVER directed or participated in any other activity that involved detaining people?',
        meaning:
          'This question asks whether you ever worked or volunteered at a place where people were forced to stay — like a prison, jail, or detention facility — or took part in any activity that involved holding people there.',
        words: [
          { word: 'detained', definition: 'Forced to stay somewhere.' },
          { word: 'volunteered', definition: 'Worked without being paid.' },
          { word: 'labor camp', definition: 'A camp where people are forced to do hard work.' },
        ],
        officerPhrasings: [
          'Have you ever worked in a prison or detention facility?',
          'Did you ever take part in detaining people?',
        ],
      },
      {
        id: 'p9-10',
        label: '10.a - 10.c',
        status: 'approved',
        official:
          '10.a. Were you EVER a part of any group, or did you EVER help any group, unit, or organization that used a weapon against any person, or threatened to do so? 10.b. If you answered "Yes" to Item Number 10.a., when you were part of this group, or when you helped this group, did you ever use a weapon against another person? 10.c. If you answered "Yes" to Item Number 10.a., when you were part of this group, or when you helped this group, did you ever threaten another person that you would use a weapon against that person?',
        meaning:
          'These questions ask about groups that used weapons or threatened to use them. The first asks whether you were part of one or helped one. The next two ask about you personally: whether you used a weapon against someone, or threatened to.',
        words: [
          { word: 'threatened', definition: 'Said you would harm someone.' },
        ],
        officerPhrasings: [
          'Were you ever part of a group that used weapons against people?',
          'Did you personally ever use or threaten to use a weapon while with that group?',
        ],
      },
      {
        id: 'p9-11',
        label: '11',
        status: 'approved',
        official:
          'Have you EVER sold, provided, or transported weapons, or assisted any person in selling, providing, or transporting weapons, which you knew or believed would be used against another person?',
        meaning:
          'This question asks whether you have ever sold, given, moved, or helped someone move weapons that you knew or believed would be used against a person.',
        words: [
          { word: 'transported', definition: 'Moved from one place to another.' },
          { word: 'assisted', definition: 'Helped.' },
        ],
        officerPhrasings: [
          'Have you ever sold or transported weapons?',
          'Did you ever help move weapons you believed would be used against someone?',
        ],
      },
      {
        id: 'p9-12',
        label: '12',
        status: 'approved',
        official: 'Have you EVER received any weapons training, paramilitary training, or other military-type training?',
        meaning:
          'This question asks whether you have ever been trained to use weapons, or trained in any military-type way.',
        words: [
          { word: 'training', definition: 'Learning and practicing how to do something.' },
        ],
        officerPhrasings: [
          'Have you ever received weapons training?',
          'Were you ever trained in any military-type skills?',
        ],
      },
      {
        id: 'p9-13',
        label: '13',
        status: 'approved',
        official:
          'Have you EVER recruited (asked), enlisted (signed up), conscripted (required to join), or used any person under 15 years of age to serve in or help an armed group, or attempted or worked with others to do so?',
        meaning:
          'This question asks whether you have ever asked, signed up, forced, or used a child under 15 to serve in or help an armed group — or tried to, or worked with others to do so.',
        words: [
          { word: 'recruited', definition: 'Asked someone to join.' },
          { word: 'enlisted', definition: 'Signed someone up.' },
          { word: 'conscripted', definition: 'Required someone to join.' },
          { word: 'armed group', definition: 'A group that carries weapons.' },
        ],
        officerPhrasings: [
          'Have you ever used a child under 15 in an armed group?',
          'Did you ever recruit children for any armed group?',
        ],
      },
      {
        id: 'p9-14',
        label: '14',
        status: 'approved',
        official:
          'Have you EVER used any person under 15 years of age to take part in hostilities or attempted or worked with others to do so? This could include participating in combat or providing services related to combat (such as serving as a messenger or transporting supplies).',
        meaning:
          'This question asks whether you have ever used a child under 15 to take part in fighting, or work related to fighting — for example, carrying messages or supplies.',
        words: [
          { word: 'hostilities', definition: 'Fighting in a war or conflict.' },
          { word: 'combat', definition: 'Fighting.' },
          { word: 'supplies', definition: 'Things people need, like food, water, or equipment.' },
        ],
        officerPhrasings: [
          'Did you ever use a child under 15 in fighting or war-related work?',
        ],
      },
    ],
  },
  {
    id: 'crimes-offenses',
    title: 'Crimes and Offenses',
    partLabel: 'Part 9 of Form N-400, Items 15-19',
    status: 'approved',
    questions: [
      {
        id: 'p9-15',
        label: '15.a - 15.b',
        status: 'approved',
        official:
          '15.a. Have you EVER committed, agreed to commit, asked someone else to commit, helped commit, or tried to commit a crime or offense for which you were NOT arrested? 15.b. Have you EVER been arrested, cited, detained or confined by any law enforcement officer, military official (in the U.S. or elsewhere), or immigration official for any reason, or been charged with a crime or offense?',
        meaning:
          'The first question asks about crimes or offenses even if you were never arrested for them — including agreeing to one, asking someone else to commit one, or trying to. The second asks whether any official — police, military, or immigration — has ever arrested you, given you a citation, detained you, confined you, or charged you with a crime, for any reason.',
        words: [
          { word: 'offense', definition: 'An act that breaks a law.' },
          { word: 'cited', definition: 'Officially given a ticket or summons.' },
          { word: 'confined', definition: 'Kept in a closed place, like a jail, and not allowed to leave.' },
          { word: 'charged', definition: 'Formally accused of a crime by the government.' },
        ],
        officerPhrasings: [
          'Have you ever committed a crime you were not arrested for?',
          'Have you ever been arrested or detained by the police, or any official?',
        ],
      },
      {
        id: 'p9-16',
        label: '16',
        status: 'approved',
        official:
          'If you received a suspended sentence, were placed on probation, or were paroled, have you completed your suspended sentence, probation, or parole?',
        meaning:
          'This question is for people who received a suspended sentence, probation, or parole. It asks whether you completed it.',
        words: [
          { word: 'suspended sentence', definition: 'A punishment decided by a court that you do not have to serve, as long as you follow the rules.' },
          { word: 'probation', definition: 'A court-ordered period of supervision instead of, or after, jail time.' },
          { word: 'parole', definition: 'Early release from prison with rules you must follow.' },
          { word: 'completed', definition: 'Finished everything you were required to do.' },
        ],
        officerPhrasings: [
          'Did you complete your probation or parole?',
          'If you had a suspended sentence, did you finish all of its conditions?',
        ],
      },
      {
        id: 'p9-17',
        label: '17.a - 17.h',
        status: 'approved',
        official:
          '17.a. Have you EVER engaged in prostitution, attempted to procure or import prostitutes or persons for the purpose of prostitution, or received any proceeds or money from prostitution? 17.b. Have you EVER manufactured, cultivated, produced, distributed, dispensed, sold, or smuggled (trafficked) any controlled substances, illegal drugs, narcotics, or drug paraphernalia in violation of any law or regulation of a U.S. state, the United States, or a foreign country? 17.c. Have you EVER been married to more than one person at the same time? 17.d. Have you EVER married someone in order to obtain an immigration benefit? 17.e. Have you EVER helped anyone to enter, or try to enter, the United States illegally? 17.f. Have you EVER gambled illegally or received income from illegal gambling? 17.g. Have you EVER failed to support your dependents (pay child support) or to pay alimony (court-ordered financial support after divorce or separation)? 17.h. Have you EVER made any misrepresentation to obtain any public benefit in the United States?',
        meaning:
          'These questions cover eight separate areas: prostitution; selling or smuggling illegal drugs; being married to more than one person at the same time; marrying someone to get an immigration benefit; helping anyone enter the United States illegally; illegal gambling; failing to support your dependents or pay alimony; and misrepresentation to get a public benefit.',
        words: [
          { word: 'prostitution', definition: 'Being paid for sex acts.' },
          { word: 'procure', definition: 'To get or arrange.' },
          { word: 'controlled substances', definition: 'Illegal drugs; drugs that are legal only with a doctor\u2019s prescription.' },
          { word: 'smuggled', definition: 'Moved secretly and illegally across a border.' },
          { word: 'dependents', definition: 'People the law says you must support, like your children.' },
          { word: 'alimony', definition: 'Court-ordered money paid to a former spouse after divorce.' },
          { word: 'public benefit', definition: 'Money or help from the government, like public housing or food benefits.' },
          { word: 'misrepresentation', definition: 'Saying or writing something false to get something.' },
        ],
        officerPhrasings: [
          'Have you ever been involved with prostitution?',
          'Have you ever sold or smuggled illegal drugs?',
          'Have you ever helped anyone come into the United States illegally?',
        ],
      },
      {
        id: 'p9-18',
        label: '18',
        status: 'approved',
        official:
          'Have you EVER given any U.S. Government officials any information or documentation that was false, fraudulent, or misleading?',
        meaning:
          'This question asks whether you have ever given a U.S. Government official information or documents that were false, fraudulent, or misleading.',
        words: [
          { word: 'documentation', definition: 'Official papers or files.' },
          { word: 'fraudulent', definition: 'Dishonest, to trick someone.' },
          { word: 'misleading', definition: 'Causing someone to believe something that is not true.' },
        ],
        officerPhrasings: [
          'Have you ever given false information to a U.S. Government official?',
          'Did you ever give an official documents that were not true?',
        ],
      },
      {
        id: 'p9-19',
        label: '19',
        status: 'approved',
        official:
          'Have you EVER lied to any U.S. Government officials to gain entry or admission into the United States or to gain immigration benefits while in the United States?',
        meaning:
          'This question asks whether you have ever lied to a U.S. Government official — for example, to enter the United States or to get an immigration benefit.',
        words: [
          { word: 'entry or admission', definition: 'Being allowed to come into a country.' },
          { word: 'immigration benefit', definition: 'Permission from the immigration system, like a visa or a green card.' },
        ],
        officerPhrasings: [
          'Have you ever lied to a U.S. immigration officer?',
          'Did you ever lie to enter the United States or to get a green card or visa?',
        ],
      },
    ],
  },
  {
    id: 'immigration-history',
    title: 'Immigration History',
    partLabel: 'Part 9 of Form N-400, Items 20-21',
    status: 'approved',
    questions: [
      {
        id: 'p9-20',
        label: '20',
        status: 'approved',
        official: 'Have you EVER been placed in removal, rescission, or deportation proceedings?',
        meaning:
          'This question asks whether the government has ever started immigration court proceedings against you — removal, rescission, or deportation proceedings.',
        words: [
          { word: 'removal proceedings', definition: 'A court process where the U.S. government tries to make a person leave the country.' },
          { word: 'rescission', definition: 'Canceling — for example, the government trying to cancel a green card.' },
          { word: 'deportation', definition: 'Being forced to leave the country.' },
          { word: 'proceedings', definition: 'An official legal process before a judge.' },
        ],
        officerPhrasings: [
          'Have you ever been in immigration court proceedings?',
          'Has the government ever tried to remove or deport you?',
        ],
      },
      {
        id: 'p9-21',
        label: '21',
        status: 'approved',
        official: 'Have you EVER been removed or deported from the United States?',
        meaning:
          'This question asks whether you have ever been forced by the government to leave the United States.',
        words: [
          { word: 'removed', definition: 'Forced by the government to leave the country.' },
        ],
        officerPhrasings: [
          'Have you ever been deported from the United States?',
          'Were you ever ordered to leave the U.S.?',
        ],
      },
    ],
  },
  {
    id: 'selective-service-military',
    title: 'Selective Service and Military',
    partLabel: 'Part 9 of Form N-400, Items 22-29',
    status: 'approved',
    questions: [
      {
        id: 'p9-22a',
        label: '22.a',
        status: 'approved',
        official:
          'Are you a male who lived in the United States at any time between your 18th and 26th birthdays? (Do not select "Yes" if you were a lawful nonimmigrant for all of that time period.)',
        meaning:
          'This question asks whether you are a man who lived in the United States at some time between your 18th and 26th birthdays. The form gives one example of a person who does not count: someone who was a lawful nonimmigrant for that whole period.',
        words: [
          { word: 'lawful nonimmigrant', definition: 'A person allowed to be in the United States for a temporary time, for example with a student visa or a work visa.' },
          { word: 'Selective Service', definition: 'The U.S. system that keeps a list of men who could be called to serve in the military if the country needs them.' },
        ],
        officerPhrasings: [
          'Did you live in the United States at any time between your 18th and 26th birthdays?',
          'Were you living in the U.S. between your 18th and 26th birthdays?',
        ],
      },
      {
        id: 'p9-22b',
        label: '22.b',
        status: 'approved',
        official: 'If you answered "Yes," to Item Number 22.a., did you register for the Selective Service?',
        meaning:
          'This question asks whether you signed up with the Selective Service. The form says it is only asked if you answered "Yes" to the question before it.',
        words: [
          { word: 'register', definition: 'To add your name to an official list.' },
        ],
        officerPhrasings: [
          'Did you register for the Selective Service?',
          'Are you registered with the Selective Service?',
        ],
      },
      {
        id: 'p9-23',
        label: '23',
        status: 'approved',
        official: 'Have you EVER left the United States to avoid being drafted in the U.S. armed forces?',
        meaning:
          'This question asks whether you have ever left the United States so that you would not be drafted. The word EVER means at any time in your life.',
        words: [
          { word: 'EVER', definition: 'At any time in your whole life.' },
          { word: 'drafted', definition: 'Required by law to join the military.' },
          { word: 'avoid', definition: 'To stay away from something on purpose.' },
        ],
        officerPhrasings: [
          'Did you ever leave the country to avoid the draft?',
          'Have you ever left the United States so you would not be drafted into the military?',
        ],
      },
      {
        id: 'p9-24',
        label: '24',
        status: 'approved',
        official: 'Have you EVER applied for any kind of exemption from military service in the U.S. armed forces?',
        meaning: 'This question asks whether you have ever asked not to be part of military service.',
        words: [
          { word: 'exemption', definition: 'Permission not to do something that most people must do.' },
          { word: 'applied', definition: 'Asked in an official way, usually with a form.' },
        ],
        officerPhrasings: [
          'Have you ever asked to be excused from military service?',
          'Did you ever apply for an exemption from military service?',
        ],
      },
      {
        id: 'p9-25',
        label: '25',
        status: 'approved',
        official: 'Have you EVER served in the U.S. armed forces?',
        meaning: 'This question asks whether you have ever been a member of the U.S. military.',
        words: [
          { word: 'served', definition: 'Worked as a member of a group, like the military.' },
          { word: 'armed forces', definition: 'The military: the Army, Navy, Air Force, Marine Corps, Space Force, and Coast Guard.' },
        ],
        officerPhrasings: [
          'Have you ever been in the U.S. military?',
          'Did you ever serve in the armed forces?',
        ],
      },
      {
        id: 'p9-26',
        label: '26.a - 26.d',
        status: 'approved',
        official:
          '26.a. Are you currently a member of the U.S. armed forces? 26.b. If you answered "Yes" to Item Number 26.a., are you scheduled to deploy outside the United States, including to a vessel, within the next 3 months? 26.c. If you answered "Yes" to Item Number 26.a., are you currently stationed outside the United States? 26.d. If you answered "No" to Item Number 26.a., are you a former U.S. military service member who is currently residing outside of the U.S.?',
        meaning:
          'These questions ask if you are in the U.S. military right now. If you are, they also ask where you will work in the next three months and where you are now. If you are not in the military now, the last question asks if you used to be in the military and now live outside the United States.',
        words: [
          { word: 'currently', definition: 'Now, at this time.' },
          { word: 'deploy', definition: 'To be sent to work somewhere else, often far away.' },
          { word: 'vessel', definition: 'A ship or large boat.' },
          { word: 'stationed', definition: 'Sent to work in a certain place.' },
        ],
        officerPhrasings: [
          'Are you in the military right now?',
          'Are you currently serving in the U.S. armed forces?',
          'Are you stationed outside the United States?',
        ],
      },
      {
        id: 'p9-27',
        label: '27',
        status: 'approved',
        official:
          'Have you EVER been court-martialed or have you received a discharge characterized as other than honorable, bad conduct, or dishonorable, while in the U.S. armed forces?',
        meaning:
          'This question asks two things about your time in the U.S. military. First, whether a military court has ever tried you. Second, whether your release from the military was described as anything other than honorable.',
        words: [
          { word: 'court-martialed', definition: 'Tried in a military court.' },
          { word: 'discharge', definition: 'Release from military service.' },
          { word: 'characterized as', definition: 'Described as.' },
        ],
        officerPhrasings: [
          'Have you ever been court-martialed?',
          'Did you receive any discharge other than an honorable one?',
        ],
      },
      {
        id: 'p9-28',
        label: '28',
        status: 'approved',
        official: 'Have you EVER been discharged from training or service in the U.S. armed forces because you were an alien?',
        meaning:
          'This question asks whether you were ever released from military training or service because you were not a U.S. citizen.',
        words: [
          { word: 'alien', definition: 'An old legal word for a person who is not a U.S. citizen.' },
          { word: 'discharged', definition: 'Released from a job or service.' },
        ],
        officerPhrasings: [
          'Were you ever released from the military because of your immigration status?',
          'Did you ever get discharged from military service because you were not a citizen?',
        ],
      },
      {
        id: 'p9-29',
        label: '29',
        status: 'approved',
        official: 'Have you EVER deserted from the U.S. armed forces?',
        meaning: 'This question asks whether you have ever left the U.S. military without permission.',
        words: [
          { word: 'deserted', definition: 'Left your military job or post without permission.' },
        ],
        officerPhrasings: [
          'Have you ever left the military without permission?',
          'Did you ever leave your post in the armed forces without permission?',
        ],
      },
    ],
  },
  {
    id: 'oath-questions',
    title: 'Oath Questions',
    partLabel: 'Part 9 of Form N-400, Items 30-37',
    status: 'approved',
    questions: [
      {
        id: 'p9-30',
        label: '30.a - 30.b',
        status: 'approved',
        official:
          '30.a. Do you now have, or did you EVER have, a hereditary title or an order of nobility in any foreign country? 30.b. If you answered "Yes," to Item Number 30.a., are you willing to give up any inherited titles or orders of nobility, (list titles), that you have in a foreign country at your naturalization ceremony?',
        meaning:
          'These questions ask whether you have a special rank from another country, like a title that passes down in a family. The second question asks whether you are ready to give up that rank at the ceremony where you become a U.S. citizen.',
        words: [
          { word: 'hereditary', definition: 'Passed down from parent to child in a family.' },
          { word: 'title', definition: "An official rank or special name, like 'Duke' or 'Sir.'" },
          { word: 'order of nobility', definition: 'A special rank given by a king, queen, or government.' },
          { word: 'naturalization ceremony', definition: 'The event where a person becomes a U.S. citizen.' },
        ],
        officerPhrasings: [
          'Do you have any titles or ranks of nobility from another country?',
          'Have you ever had a hereditary title in a foreign country?',
        ],
      },
      {
        id: 'p9-31',
        label: '31',
        status: 'approved',
        official: 'Do you support the Constitution and form of Government of the United States?',
        meaning:
          'This question asks whether you support the U.S. Constitution and the way the United States is governed.',
        words: [
          { word: 'Constitution', definition: 'The main written law of the United States.' },
          { word: 'form of government', definition: 'The way a country is organized and run.' },
        ],
        officerPhrasings: [
          'Do you support the U.S. Constitution?',
          'Do you support the Constitution and the American form of government?',
        ],
      },
      {
        id: 'p9-32',
        label: '32',
        status: 'approved',
        official: 'Do you understand the full Oath of Allegiance to the United States (see Part 16. Oath of Allegiance)?',
        meaning:
          'This question asks whether you understand the full Oath of Allegiance — the promise a person makes when becoming a U.S. citizen.',
        words: [
          { word: 'Oath of Allegiance', definition: 'The special promise a person makes to the United States when becoming a citizen.' },
        ],
        officerPhrasings: [
          'Do you understand the Oath of Allegiance?',
          'Do you understand the full Oath of Allegiance to the United States?',
        ],
      },
      {
        id: 'p9-33',
        label: '33',
        status: 'approved',
        official:
          'Are you unable to take the Oath of Allegiance because of a physical or developmental disability or mental impairment? If you answer "Yes," skip Item Numbers 34. - 37. and see the Legal Guardian, Surrogate, or Designated Representative section in the Instructions.',
        meaning:
          'This question asks whether a disability or impairment makes it impossible for you to take the Oath of Allegiance. The form says people who answer "Yes" should read a special section of the Instructions about legal guardians and representatives.',
        words: [
          { word: 'disability', definition: 'A condition of the body or brain that makes some things hard to do.' },
          { word: 'impairment', definition: 'A condition that makes something weaker or harder.' },
        ],
        officerPhrasings: [
          'Is there a reason you cannot take the Oath of Allegiance?',
        ],
      },
      {
        id: 'p9-34',
        label: '34',
        status: 'approved',
        official: 'Are you willing to take the full Oath of Allegiance to the United States?',
        meaning: 'This question asks whether you are ready and able to say the whole Oath of Allegiance.',
        words: [
          { word: 'willing', definition: 'Ready and OK with doing something.' },
        ],
        officerPhrasings: [
          'Are you willing to take the full Oath of Allegiance?',
          'Are you willing to take the whole Oath, all of it?',
        ],
      },
      {
        id: 'p9-35',
        label: '35',
        status: 'approved',
        official: 'If the law requires it, are you willing to bear arms (carry weapons) on behalf of the United States?',
        meaning:
          'This question asks whether you are willing to carry weapons for the United States if the law ever requires it.',
        words: [
          { word: 'if the law requires it', definition: 'If a law says you must do it.' },
          { word: 'bear arms', definition: 'To carry and use weapons.' },
          { word: 'on behalf of', definition: 'For.' },
        ],
        officerPhrasings: [
          'If the law requires it, are you willing to bear arms for the United States?',
          'Would you be willing to carry weapons for the U.S. if the law requires it?',
        ],
      },
      {
        id: 'p9-36',
        label: '36',
        status: 'approved',
        official:
          'If the law requires it, are you willing to perform noncombatant services (do something that does not include fighting in a war) in the U.S. armed forces?',
        meaning:
          'This question asks whether you are willing to do work for the U.S. military that does not include fighting, if the law ever requires it.',
        words: [
          { word: 'noncombatant', definition: 'A person who is part of the military but does not fight.' },
        ],
        officerPhrasings: [
          'Are you willing to do noncombatant service in the armed forces if the law requires it?',
          'If the law requires it, would you do military work that does not include fighting?',
        ],
      },
      {
        id: 'p9-37',
        label: '37',
        status: 'approved',
        official:
          'If the law requires it, are you willing to perform work of national importance under civilian direction (do non-military work that the U.S. Government says is important to the country)?',
        meaning:
          'This question asks whether you are willing to do non-military work that is important for the country, if the law ever requires it. Civilian direction means the work is led by people who are not in the military.',
        words: [
          { word: 'national importance', definition: 'Important for the whole country.' },
          { word: 'civilian', definition: 'A person who is not in the military.' },
          { word: 'direction', definition: 'Leadership; telling what work to do.' },
        ],
        officerPhrasings: [
          'If the law requires it, are you willing to do work of national importance under civilian direction?',
          'Would you do non-military work that is important to the country, if the law requires it?',
        ],
      },
    ],
  },
];