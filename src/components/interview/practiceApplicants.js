// Six fictional practice applicants for the N-400 review interview mode.
// Every one of these people is made up for practice. The disclaimer
// "Practice person. Not real." is shown on every card that displays them.

export const PRACTICE_APPLICANTS = [
  {
    id: 'maria',
    name: 'Maria Santos',
    age: 41,
    job: 'Home health aide',
    birthplace: 'Monterrey, Mexico',
    yearsInUS: 12,
    blurb: 'Home health aide from Mexico. Married, two kids, two short trips home — and a speeding ticket to explain.',
    address: '482 Maple Street, Apt 3C, Riverton, Ohio 45000',
    street: 'Maple Street',
    city: 'Riverton',
    jobs: [
      'Home health aide at Riverton Home Care since 2019',
      'Housekeeper at the Park Hotel from 2014 to 2019',
    ],
    trips: [
      'Mexico, June 2019, 10 days — visited her mother',
      'Mexico, December 2022, 8 days — holiday with family',
    ],
    marital: 'Married to Carlos Santos since 2015. This is her only marriage.',
    children: ['Diego, age 10', 'Sofia, age 7'],
    gmc: [
      { q: 'Have you ever been arrested?', a: 'No' },
      {
        q: 'Have you ever received a traffic ticket?',
        a: 'Yes — a speeding ticket in 2018. I paid the $150 fine the same month.',
      },
      { q: 'Have you ever been charged with a crime?', a: 'No' },
      { q: 'Have you ever claimed to be a U.S. citizen?', a: 'No' },
      { q: 'Have you ever failed to pay your taxes?', a: 'No' },
    ],
  },
  {
    id: 'ahmed',
    name: 'Ahmed Hassan',
    age: 35,
    job: 'Rideshare driver',
    birthplace: 'Cairo, Egypt',
    yearsInUS: 8,
    blurb: 'Rideshare driver from Egypt. Divorced with one daughter, one long trip for a brother’s wedding.',
    address: '2201 Harbor Lane, Apt 12, Fairview, Ohio 45001',
    street: 'Harbor Lane',
    city: 'Fairview',
    jobs: [
      'Rideshare driver since 2020',
      'Gas station cashier from 2018 to 2020',
    ],
    trips: [
      'Egypt, March 2020, 21 days — his brother’s wedding',
      'Canada, July 2023, 5 days — visited Niagara Falls by car',
    ],
    marital: 'Divorced. Married in 2019, divorced in 2023.',
    children: ['Yara, age 4 — lives with her mother'],
    gmc: [
      { q: 'Have you ever been arrested?', a: 'No' },
      { q: 'Have you ever received a traffic ticket?', a: 'No' },
      { q: 'Have you ever been charged with a crime?', a: 'No' },
      { q: 'Have you ever claimed to be a U.S. citizen?', a: 'No' },
      { q: 'Have you ever failed to pay your taxes?', a: 'No' },
    ],
  },
  {
    id: 'grace',
    name: 'Grace Kim',
    age: 67,
    job: 'Retired math teacher',
    birthplace: 'Busan, South Korea',
    yearsInUS: 25,
    blurb: 'Retired teacher from South Korea. Widowed after 33 years of marriage, two grown children, two visits home.',
    address: '77 Ridge Road, Fairview, Ohio 45002',
    street: 'Ridge Road',
    city: 'Fairview',
    jobs: [
      'Retired in 2021',
      'Math teacher at Fairview Middle School from 2004 to 2021',
    ],
    trips: [
      'South Korea, 2016, 14 days — visited her sister',
      'South Korea, 2019, 12 days — family visit',
    ],
    marital: 'Widowed. Married to James Kim from 1988 until he passed away in 2021.',
    children: ['Daniel, age 35 — lives in another state', 'Esther, age 32 — lives in another state'],
    gmc: [
      { q: 'Have you ever been arrested?', a: 'No' },
      { q: 'Have you ever received a traffic ticket?', a: 'No' },
      { q: 'Have you ever been charged with a crime?', a: 'No' },
      { q: 'Have you ever claimed to be a U.S. citizen?', a: 'No' },
      { q: 'Have you ever failed to pay your taxes?', a: 'No' },
    ],
  },
  {
    id: 'dmitri',
    name: 'Dmitri Volkov',
    age: 29,
    job: 'Line cook',
    birthplace: 'Lviv, Ukraine',
    yearsInUS: 6,
    blurb: 'Line cook from Ukraine. Never married, no children, one trip home when his father was sick.',
    address: '12 Alder Court, Riverton, Ohio 45003',
    street: 'Alder Court',
    city: 'Riverton',
    jobs: [
      'Line cook at the Blue Door Bistro since 2022',
      'Dishwasher at the same bistro from 2020 to 2022',
    ],
    trips: [
      'Ukraine, May 2024, 16 days — his father was sick',
    ],
    marital: 'Never married.',
    children: ['No children'],
    gmc: [
      { q: 'Have you ever been arrested?', a: 'No' },
      { q: 'Have you ever received a traffic ticket?', a: 'No' },
      { q: 'Have you ever been charged with a crime?', a: 'No' },
      { q: 'Have you ever claimed to be a U.S. citizen?', a: 'No' },
      { q: 'Have you ever failed to pay your taxes?', a: 'No' },
    ],
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    age: 47,
    job: 'Grocery store manager',
    birthplace: 'Mumbai, India',
    yearsInUS: 15,
    blurb: 'Grocery store manager from India. Married twice, three kids — and a shoplifting citation from age 18 to explain.',
    address: '960 Willow Place, Fairview, Ohio 45004',
    street: 'Willow Place',
    city: 'Fairview',
    jobs: [
      'Assistant manager at Price Mart since 2018',
      'Cashier at Price Mart from 2011 to 2018',
    ],
    trips: [
      'India, 2018, 30 days — a family wedding',
      'India, 2022, 21 days — visited her parents',
    ],
    marital: 'Married twice. First marriage from 2005 to 2012, ended in divorce. Married Sunil Sharma since 2016.',
    children: ['Anaya, age 15 — from her first marriage', 'Vikram, age 8'],
    gmc: [
      { q: 'Have you ever been arrested?', a: 'No' },
      { q: 'Have you ever received a traffic ticket?', a: 'No' },
      {
        q: 'Have you ever been charged with or cited for a crime?',
        a: 'Yes — when I was 18 I was cited for shoplifting. The case was dismissed and I paid a small fine. It was a mistake I have not repeated.',
      },
      { q: 'Have you ever claimed to be a U.S. citizen?', a: 'No' },
      { q: 'Have you ever failed to pay your taxes?', a: 'No' },
    ],
  },
  {
    id: 'kwame',
    name: 'Kwame Mensah',
    age: 52,
    job: 'Bus mechanic',
    birthplace: 'Accra, Ghana',
    yearsInUS: 10,
    blurb: 'Bus mechanic from Ghana. Married since 2009, two kids, one trip home for a funeral.',
    address: '333 Sunset Boulevard, Riverton, Ohio 45005',
    street: 'Sunset Boulevard',
    city: 'Riverton',
    jobs: [
      'Mechanic at Riverton Transit since 2017',
      'Auto shop worker from 2015 to 2017',
    ],
    trips: [
      'Ghana, 2021, 20 days — his mother’s funeral',
      'United Kingdom, 2023, 7 days — visited a cousin',
    ],
    marital: 'Married to Abena Mensah since 2009. This is his only marriage.',
    children: ['Kofi, age 14', 'Ama, age 11'],
    gmc: [
      { q: 'Have you ever been arrested?', a: 'No' },
      { q: 'Have you ever received a traffic ticket?', a: 'No' },
      { q: 'Have you ever been charged with a crime?', a: 'No' },
      { q: 'Have you ever claimed to be a U.S. citizen?', a: 'No' },
      { q: 'Have you ever failed to pay your taxes?', a: 'No' },
    ],
  },
];

// Plain-text summary of a practice person, used inside the AI prompt so the
// officer scores the learner's answers against the card, not their real life.
export function profileSummary(applicant) {
  return [
    `Name: ${applicant.name}`,
    `Age: ${applicant.age}`,
    `Birthplace: ${applicant.birthplace}`,
    `Years living in the U.S.: ${applicant.yearsInUS}`,
    `Current address: ${applicant.address}`,
    `Work: ${applicant.jobs.join('; ')}`,
    `Marital history: ${applicant.marital}`,
    `Children: ${applicant.children.join('; ')}`,
    `Trips outside the U.S.: ${applicant.trips.join('; ')}`,
    `Good moral character answers: ${applicant.gmc.map((g) => `${g.q} — ${g.a}`).join('; ')}`,
  ].join('\n');
}

// The officer's N-400 review questions for a practice person. Every expected
// answer comes straight from the profile card.
export function getReviewQuestions(applicant) {
  return [
    {
      question: 'Where do you live?',
      expected_response: `I live at ${applicant.address}.`,
      section: 'n400_review',
    },
    {
      question: 'What kind of work do you do? Where do you work?',
      expected_response: `${applicant.job}. ${applicant.jobs[0]}.`,
      section: 'n400_review',
    },
    {
      question: 'Are you married? Tell me about it.',
      expected_response: applicant.marital,
      section: 'n400_review',
    },
    {
      question: 'Do you have any children? How many?',
      expected_response: `${applicant.children.join('; ')}.`,
      section: 'n400_review',
    },
    {
      question: 'Have you traveled outside the United States since you became a permanent resident? Tell me about your trips.',
      expected_response: `Yes. ${applicant.trips.join('; ')}.`,
      section: 'n400_review',
    },
    {
      question: 'Where were you born?',
      expected_response: applicant.birthplace,
      section: 'n400_review',
    },
    ...applicant.gmc.map((g) => ({
      question: g.q,
      expected_response: g.a,
      section: 'n400_review',
    })),
  ];
}