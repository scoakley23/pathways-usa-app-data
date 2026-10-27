// Pilot settings (docs/AI-Policy-updated.md, "Pilot Check-ins").
//
// ALLOWED_PROGRAM_CODES: one code per partner organization. A learner can
// arrive with ?code=XXXX on any link, or type it on the "Help us improve
// Pathways" screen or their Profile. Codes are compared without regard to
// case or spaces. Separate from the tutor invite code.
export const ALLOWED_PROGRAM_CODES = ['HARVARD-PILOT'];

// U.S. states, D.C. and territories for "Which state do you live in?".
// Only the two-letter code is saved; never a zip code or city.
export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
  ['PR', 'Puerto Rico'], ['GU', 'Guam'], ['VI', 'U.S. Virgin Islands'],
  ['AS', 'American Samoa'], ['MP', 'Northern Mariana Islands'],
];

// The partner program's own numbers before Pathways, shown on the pilot
// dashboard (/admin/pilot) as a reference. They come from the program, not
// from the app, and its retention may be measured differently.
export const PROGRAM_BASELINE = {
  label: 'Harvard program before Pathways',
  retention: 0.6, // about 60% of learners stay in the class
  firstTryPass: 0.98, // 98% pass
};
