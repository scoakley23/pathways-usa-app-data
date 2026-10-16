// Static N-400 Question Guide content, based on Form N-400 (Edition 01/20/25).
// All cards are DRAFT status: they are NOT shown to learners until the app
// owner approves them (change status to 'approved' after review).
// "meaning" text is based on the form's own wording and does not tell a
// learner how to answer.

export const N400_SECTIONS = [
  {
    id: 'time-outside-us',
    title: 'Time Outside the U.S.',
    partLabel: 'Part 8 of Form N-400',
    status: 'draft',
    questions: [
      {
        id: 'p8-1',
        label: '8.1',
        status: 'draft',
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
    id: 'selective-service-military',
    title: 'Selective Service and Military',
    partLabel: 'Part 9 of Form N-400, Items 22-29',
    status: 'draft',
    questions: [
      {
        id: 'p9-22a',
        label: '22.a',
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
    status: 'draft',
    questions: [
      {
        id: 'p9-30',
        label: '30.a - 30.b',
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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
        status: 'draft',
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