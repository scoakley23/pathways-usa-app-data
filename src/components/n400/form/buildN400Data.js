// Turns one fictional practice applicant into the values shown on the
// practice copy of Form N-400. Every value here is made up for learning.

const SEX_BY_ID = {
  maria: 'Female',
  ahmed: 'Male',
  grace: 'Female',
  dmitri: 'Male',
  priya: 'Female',
  kwame: 'Male',
};

function parseOneJob(j) {
  if (/^Retired/i.test(j)) {
    return { occupation: 'Retired', employer: 'N/A', city: '', state: '', zip: '', from: '', to: '' };
  }
  const m = j.match(/^(.+?)(?: at (.+?))? (?:since|from) (\d{4})(?: to (\d{4}))?$/);
  if (!m) return { occupation: j, employer: 'N/A', city: '', state: '', zip: '', from: '', to: '' };
  return {
    occupation: m[1],
    employer: (m[2] || 'N/A').replace(/^the /, ''),
    from: m[3],
    to: m[4] || 'PRESENT',
  };
}

export function buildN400Data(applicant) {
  const now = new Date();
  const year = now.getFullYear();
  const birthYear = year - applicant.age;
  const lprYear = year - applicant.yearsInUS;

  const nameParts = applicant.name.split(' ');
  const family = nameParts[nameParts.length - 1];
  const given = nameParts.slice(0, -1).join(' ');

  const [cityOfBirth, countryOfBirth] = applicant.birthplace.split(', ');
  const sex = SEX_BY_ID[applicant.id] || '';

  // "482 Maple Street, Apt 3C, Riverton, Ohio 45000" → parts
  const am = applicant.address.match(/^(.*?)(?:,\s*(Apt[^,]*))?,\s*([^,]+),\s*([A-Za-z .]+?)\s+(\d{5})$/);
  const address = am
    ? { street: am[1], apt: am[2] || '', city: am[3], state: am[4], zip: am[5] }
    : { street: applicant.address, apt: '', city: '', state: '', zip: '' };

  // Current spouse, only for currently married applicants
  let spouse = null;
  if (applicant.maritalStatus === 'Married') {
    const nm = applicant.marital.match(/(?:Married to|Married) ([A-Z][a-z]+ [A-Z][a-z]+)/);
    const yr = applicant.marital.match(/since (\d{4})/);
    if (nm) {
      const parts = nm[1].split(' ');
      spouse = { given: parts[0], family: parts[1], year: yr ? yr[1] : '' };
    }
  }

  const children =
    applicant.children[0] === 'No children'
      ? []
      : applicant.children.map((c) => {
          const [main, ...rest] = c.split(' — ');
          const [cname, agePart] = main.split(', ');
          return {
            name: cname,
            age: parseInt((agePart || '').replace('age ', ''), 10) || null,
            note: rest.join(', '),
          };
        });
  const childrenUnder18 = children.filter((c) => c.age !== null && c.age < 18).length;

  // Trips outside the United States
  const trips = applicant.trips.map((t) => {
    const [country, date, length] = t.split(', ');
    const reason = t.split(' — ')[1] || '';
    const days = parseInt(length, 10) || 0;
    const dep = new Date(date);
    const ok = !Number.isNaN(dep.getTime());
    const ret = ok ? new Date(dep.getTime() + days * 86400000) : null;
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { country, reason, days, departure: ok ? fmt(dep) : date, return: ret ? fmt(ret) : '' };
  });
  const totalDaysOut = trips.reduce((s, t) => s + t.days, 0);

  // Jobs / schools
  const jobs = applicant.jobs.map(parseOneJob);
  jobs.forEach((j, i) => {
    if (i > 0 && /same/i.test(j.employer || '')) j.employer = jobs[i - 1].employer;
  });

  // Good-moral-character answers that need "Yes" boxes and explanations
  const flags = { arrested: false, ticket: false, charged: false };
  const part14Rows = [];
  applicant.gmc.forEach((g) => {
    const isYes = /^Yes/i.test(g.a);
    const detail = g.a.replace(/^Yes\s*[—-]\s*/i, '');
    if (/arrested/i.test(g.q)) flags.arrested = isYes;
    if (/ticket/i.test(g.q) && isYes) {
      flags.ticket = true;
      part14Rows.push({ item: '15.', text: `Traffic citation — ${detail}` });
    }
    if (/charged|cited/i.test(g.q) && isYes) {
      flags.charged = true;
      part14Rows.push({ item: '15. and 16.', text: detail.charAt(0).toUpperCase() + detail.slice(1) });
    }
  });
  const cited = flags.ticket || flags.arrested || flags.charged;

  // Selective Service: men who were under 26 when they moved to the U.S.
  const ageAtEntry = applicant.age - applicant.yearsInUS;
  const selectiveService = sex === 'Male' ? ageAtEntry < 26 : null;

  return {
    applicant,
    name: applicant.name,
    given,
    family,
    sex,
    birthYear,
    lprYear,
    filingYear: year,
    cityOfBirth,
    countryOfBirth,
    address,
    spouse,
    maritalStatus: applicant.maritalStatus,
    marriages: applicant.marriages,
    children,
    childrenUnder18,
    jobs,
    trips,
    totalDaysOut,
    cited,
    charged: flags.charged,
    part14Rows,
    selectiveService,
  };
}