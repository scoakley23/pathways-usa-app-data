// Pathways USA: current officeholders and capitals.
//
// src/data/officeholders.json is the ONLY source the app uses for officeholder names.
// It is built from officeholders.csv, which is checked against official government
// websites (senate.gov, clerk.house.gov, supremecourt.gov, whitehouse.gov, nga.org,
// state .gov sites). Never fill in a name from AI memory or a web search.
//
// No network calls happen in this file, and nothing about the learner is sent anywhere.

import data from "../data/officeholders.json";

export const OFFICEHOLDERS = data;
export const OFFICEHOLDERS_CHECKED_ON = data.meta.checkedOn; // "YYYY-MM-DD"

/** Days after which the app warns that the list may be out of date. */
export const STALE_AFTER_DAYS = 45;

export const KINDS = /** @type {const} */ ({
  PRESIDENT: "president",
  VICE_PRESIDENT: "vicePresident",
  SPEAKER: "speaker",
  CHIEF_JUSTICE: "chiefJustice",
  SENATOR: "senator",
  REPRESENTATIVE: "representative",
  GOVERNOR: "governor",
  CAPITAL: "capital",
});

const WHERE_TO_CHECK = {
  president: "whitehouse.gov",
  vicePresident: "whitehouse.gov",
  speaker: "house.gov",
  chiefJustice: "supremecourt.gov",
  senator: "senate.gov",
  representative: "house.gov",
  governor: "usa.gov/states-and-territories",
  capital: "your state's official website",
};

// ---------------------------------------------------------------------------
// Places and staleness

export function listPlaces() {
  return Object.keys(data.places);
}

const PLACE_ALIASES = {
  "dc": "District of Columbia",
  "d c": "District of Columbia",
  "washington dc": "District of Columbia",
  "washington d c": "District of Columbia",
  "virgin islands": "U.S. Virgin Islands",
  "us virgin islands": "U.S. Virgin Islands",
  "usvi": "U.S. Virgin Islands",
  "cnmi": "Northern Mariana Islands",
  "pr": "Puerto Rico",
};
const STATE_CODES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia", PR: "Puerto Rico", GU: "Guam",
  VI: "U.S. Virgin Islands", AS: "American Samoa", MP: "Northern Mariana Islands",
};

/** Accepts "Texas", "TX", "texas", "D.C.", "Virgin Islands"... Returns the canonical name or null. */
export function normalizePlace(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (data.places[raw]) return raw;
  const up = raw.toUpperCase().replace(/\./g, "");
  if (STATE_CODES[up]) return STATE_CODES[up];
  const key = normalizeText(raw);
  if (PLACE_ALIASES[key]) return PLACE_ALIASES[key];
  return listPlaces().find((p) => normalizeText(p) === key) || null;
}

/** Accepts 7, "7", "07", "7th", "At-large", "at large", "AL", 0, "00". Returns the table's key or null. */
export function normalizeDistrict(place, district) {
  const p = data.places[normalizePlace(place)];
  if (!p || district === undefined || district === null || district === "") return null;
  const reps = p.representatives || {};
  const s = String(district).trim().toLowerCase();
  if (/^(at[\s-]?large|al|0+)$/.test(s)) return reps["At-large"] ? "At-large" : null;
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) return null;
  return reps[String(n)] ? String(n) : null;
}

/** For the "Who Represents Me?" result: confirm the state and district exist in the table. */
export function validateLocation({ state, district }) {
  const place = normalizePlace(state);
  if (!place) return { ok: false, reason: "unknown-place" };
  const p = data.places[place];
  if (p.type === "territory") return { ok: true, state: place, district: "At-large" };
  const d = normalizeDistrict(place, district);
  if (!d) return { ok: false, reason: "unknown-district", state: place };
  return { ok: true, state: place, district: d };
}

export function daysSinceChecked(today = new Date()) {
  const checked = new Date(data.meta.checkedOn + "T00:00:00Z");
  return Math.floor((today.getTime() - checked.getTime()) / 86400000);
}

export function isStale(today = new Date()) {
  return daysSinceChecked(today) > STALE_AFTER_DAYS;
}

function mayChangeSoon(entry) {
  return !!entry?.notes && /EXPECTED CHANGE|ballot|term ends|special election|VACANT/i.test(entry.notes);
}

// ---------------------------------------------------------------------------
// Lookups

export function getNational() {
  return data.national;
}

/**
 * Everything the app knows for one learner location.
 * @param {{state?: string, district?: string|number}} loc
 */
export function getOfficialsFor({ state, district } = {}) {
  const place = normalizePlace(state);
  if (!place) return null;
  const p = data.places[place];
  const d = p.type === "state" ? normalizeDistrict(place, district) : null;
  return {
    place,
    type: p.type,
    senators: p.senators,
    noSenators: !!p.noSenators,
    governor: p.governor || null,
    mayor: p.mayor || null,
    capital: p.capital,
    representative: d ? p.representatives[d] : null,
    district: d,
    delegate: p.delegate || null,
    houseSeatCount: Object.keys(p.representatives || {}).length,
  };
}

// ---------------------------------------------------------------------------
// Text and name matching

export function normalizeText(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);
const FILLER = new Set([
  "the", "is", "its", "it", "my", "our", "mr", "mrs", "ms", "dr", "senator", "senators", "sen",
  "governor", "gov", "president", "vice", "speaker", "representative", "rep", "congressman",
  "congresswoman", "congressperson", "delegate", "commissioner", "resident", "chief", "justice",
  "honorable", "of", "house", "now", "name", "i", "think", "a", "an",
]);

/** All the ways a learner might fairly say this person's name. */
export function nameVariants(fullName) {
  const nick = (fullName.match(/"([^"]+)"/) || [])[1];
  const base = fullName.replace(/"[^"]+"/g, " ");
  const tokens = normalizeText(base.replace(/-/g, " "))
    .split(" ")
    .filter((t) => t && !SUFFIXES.has(t));
  const noInitials = tokens.filter((t) => t.length > 1);
  const v = new Set();
  if (!noInitials.length) return v;
  const last = noInitials[noInitials.length - 1];
  v.add(noInitials.join(" "));
  v.add(tokens.join(" "));
  v.add(last);
  if (noInitials.length >= 2) {
    v.add(`${noInitials[0]} ${last}`);
    v.add(noInitials.slice(-2).join(" ")); // compound surnames: "wasserman schultz", "cortez masto"
    if (noInitials.length >= 3) v.add(`${noInitials[0]} ${noInitials.slice(-2).join(" ")}`);
  }
  // hyphenated surnames: "Gonzalez-Colon" -> also "gonzalez colon", "gonzalez"
  const hyph = base.match(/([A-Za-zÀ-ÿ’']+)-([A-Za-zÀ-ÿ’']+)\s*$/);
  if (hyph) v.add(normalizeText(hyph[1]));
  if (nick) {
    v.add(`${normalizeText(nick)} ${last}`);
    // the full name as written, nickname included: "eric a rick crawford"
    v.add(normalizeText(fullName.replace(/-/g, " ")).split(" ").filter((t) => !SUFFIXES.has(t)).join(" "));
  }
  return v;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

// Small spelling and speech-to-text slips are OK; short names must match exactly.
function closeEnough(answer, variant) {
  if (answer === variant) return true;
  const len = variant.length;
  const allowed = len <= 4 ? 0 : len <= 8 ? 1 : 2;
  return allowed > 0 && levenshtein(answer, variant) <= allowed;
}

/** Split "Ted Cruz and John Cornyn" / "Cruz, Cornyn" into separate name attempts. */
// Each part is tried twice: with titles like "Senator" removed, and as typed
// (so a real surname that is also a title word, like "Justice", still matches).
function answerParts(answer) {
  const out = [];
  for (const part of String(answer ?? "").split(/,|;|\/|\band\b|\by\b|\bor\b|&/i)) {
    const tokens = normalizeText(part).split(" ").filter((t) => t && !SUFFIXES.has(t));
    const trimmed = tokens.filter((t) => !FILLER.has(t)).join(" ");
    if (trimmed) out.push(trimmed);
    if (tokens.length) out.push(tokens.join(" "));
  }
  return out;
}

function matchesAnyName(answer, entries) {
  const parts = answerParts(answer);
  for (const e of entries) {
    if (!e || !e.name || e.name === "VACANT" || e.name === "UNCONFIRMED") continue;
    const variants = nameVariants(e.name);
    for (const part of parts) {
      for (const v of variants) if (closeEnough(part, v)) return e;
    }
  }
  return null;
}

// "D.C. has no senators", "none", "it doesn't have one"... but NOT "no sé" / "I don't know".
const NONE_RE = /\bno (u s )?(senators?|governor|senadores|gobernador)\b|\b(none|not any|doesnt have|does not have|dont have|do not have|has no|have no|there are no|there is no|zero|no tiene|no hay|ninguno)\b|^(no|0)$/;
function saysNone(answer) {
  return NONE_RE.test(normalizeText(answer));
}

// Capital names that are written more than one way.
const CAPITAL_ALIASES = {
  "Saint Paul": ["st paul", "saint paul"],
  "Hagåtña": ["hagatna", "agana"],
  "Pago Pago": ["pago pago", "fagatogo"],
  "Charlotte Amalie": ["charlotte amalie"],
};

function matchesCapital(answer, capitalName) {
  const targets = new Set([normalizeText(capitalName), ...(CAPITAL_ALIASES[capitalName] || [])]);
  const parts = String(answer ?? "").split(/,|\bin\b/i).map(normalizeText).filter(Boolean);
  parts.push(normalizeText(answer));
  return parts.some((p) => [...targets].some((t) => closeEnough(p.replace(/^the city of /, ""), t)));
}

// ---------------------------------------------------------------------------
// Civics question detection

/**
 * Works out which officeholder question this is from its text (2008 and 2025 versions).
 * Returns a KINDS value or null if the question isn't about a current officeholder or capital.
 * Prefer mapping by question ID in the app; this is a fallback.
 */
export function detectOfficeholderKind(questionText) {
  const q = normalizeText(questionText);
  if (/vice president.*now|name of the vice president/.test(q)) return KINDS.VICE_PRESIDENT;
  if (/name of the president.*now|president of the united states now|who is the president now/.test(q)) return KINDS.PRESIDENT;
  if (/speaker of the house.*now|name of the speaker/.test(q)) return KINDS.SPEAKER;
  if (/chief justice.*now/.test(q)) return KINDS.CHIEF_JUSTICE;
  if (/senators? now|your states u s senators/.test(q)) return KINDS.SENATOR;
  if (/name your u s representative|your u s representative/.test(q)) return KINDS.REPRESENTATIVE;
  if (/governor of your state/.test(q)) return KINDS.GOVERNOR;
  if (/capital of your state/.test(q)) return KINDS.CAPITAL;
  return null;
}

// ---------------------------------------------------------------------------
// Grading

/**
 * Grades an officeholder or capital answer against the table. No AI, no web lookup.
 *
 * @param {{kind: string, answer: string, state?: string, district?: string|number}} args
 * @returns {{
 *   correct: boolean|null,     // null = can't be graded; don't count it either way
 *   kind: string,
 *   accepted: string[],        // names/places shown to the learner as correct answers
 *   message?: string,          // short, plain-English note to show the learner
 *   needsLocation?: boolean,   // learner must use "Who Represents Me?" first
 *   mayChangeSoon?: boolean,   // show "this may change soon; check before your interview"
 *   checkAt: string,           // where to confirm
 *   checkedOn: string,
 * }}
 */
export function gradeOfficeholderAnswer({ kind, answer, state, district }) {
  const base = { kind, checkAt: WHERE_TO_CHECK[kind] || "uscis.gov", checkedOn: data.meta.checkedOn };
  const n = data.national;

  const national = {
    [KINDS.PRESIDENT]: n.president,
    [KINDS.VICE_PRESIDENT]: n.vicePresident,
    [KINDS.SPEAKER]: n.speaker,
    [KINDS.CHIEF_JUSTICE]: n.chiefJustice,
  }[kind];
  if (national) {
    return {
      ...base,
      correct: !!matchesAnyName(answer, [national]),
      accepted: [national.name],
      mayChangeSoon: mayChangeSoon(national),
    };
  }

  const loc = getOfficialsFor({ state, district });
  if (!loc) {
    return {
      ...base, correct: null, accepted: [], needsLocation: true,
      message: "This answer depends on where you live. Use “Who Represents Me?” on the Learn page first.",
    };
  }

  if (kind === KINDS.SENATOR) {
    if (loc.noSenators) {
      return {
        ...base, correct: saysNone(answer), accepted: [`${loc.place} has no U.S. Senators`],
        message: `${loc.place} has no U.S. Senators. At your interview, say that.`,
      };
    }
    const hit = matchesAnyName(answer, loc.senators);
    return {
      ...base, correct: !!hit, accepted: loc.senators.map((s) => s.name),
      mayChangeSoon: loc.senators.some(mayChangeSoon),
    };
  }

  if (kind === KINDS.REPRESENTATIVE) {
    if (loc.type === "territory") {
      const ok = !!matchesAnyName(answer, [loc.delegate]) || /\bno (voting )?(representative|rep|representatives)\b|\b(not|doesnt|dont) have (a |any )?(voting )?representatives?\b/.test(normalizeText(answer));
      return {
        ...base, correct: ok,
        accepted: [loc.delegate.name, `${loc.place} has no voting Representative`],
        message: `${loc.delegate.name} is ${loc.place}'s ${loc.delegate.title} (non-voting). You can give this name, or say ${loc.place} has no voting Representative.`,
        mayChangeSoon: mayChangeSoon(loc.delegate),
      };
    }
    if (!loc.representative) {
      return {
        ...base, correct: null, accepted: [], needsLocation: true,
        message: "We need your congressional district. Use “Who Represents Me?” on the Learn page.",
      };
    }
    if (loc.representative.name === "VACANT") {
      return {
        ...base, correct: null, accepted: [], mayChangeSoon: true,
        message: `The House seat for your district is empty right now. ${loc.representative.notes || ""} Check house.gov before your interview.`.trim(),
      };
    }
    return {
      ...base, correct: !!matchesAnyName(answer, [loc.representative]),
      accepted: [loc.representative.name], mayChangeSoon: mayChangeSoon(loc.representative),
    };
  }

  if (kind === KINDS.GOVERNOR) {
    if (!loc.governor) {
      // D.C. has a Mayor, not a Governor. USCIS: say that D.C. does not have a Governor.
      return {
        ...base, correct: saysNone(answer), accepted: [`${loc.place} does not have a Governor`],
        message: `${loc.place} does not have a Governor. At your interview, say that.`,
      };
    }
    return {
      ...base, correct: !!matchesAnyName(answer, [loc.governor]),
      accepted: [loc.governor.name], mayChangeSoon: mayChangeSoon(loc.governor),
    };
  }

  if (kind === KINDS.CAPITAL) {
    if (!loc.capital || loc.capital.name === "UNCONFIRMED") {
      return {
        ...base, correct: null, accepted: [],
        message: "We can't grade this one for your location yet. Check the USCIS civics questions for the exact answer.",
      };
    }
    return { ...base, correct: matchesCapital(answer, loc.capital.name), accepted: [loc.capital.name] };
  }

  return { ...base, correct: null, accepted: [], message: "Not an officeholder question." };
}

// ---------------------------------------------------------------------------
// Vía (Study Buddy)

/** Add this to Vía's system instructions. */
export const VIA_OFFICEHOLDER_RULES = `
CURRENT OFFICEHOLDERS (strict rules):
- To name anyone who holds an office now (President, Vice President, Speaker of the House, Chief Justice,
  Supreme Court justices, U.S. senators, U.S. representatives, delegates, governors, mayors of D.C.) or a
  state capital, use ONLY the OFFICIAL LIST below. Never use your own memory, even if you think the list is wrong.
- If the person or place isn't in the list, say you don't have that name, and tell the learner where to check
  (senate.gov, house.gov, usa.gov/states-and-territories, or the USCIS "Check for Test Updates" page).
- If the learner asks about "my" senator, representative, governor or capital and no LEARNER LOCATION is given,
  tell them to use "Who Represents Me?" on the Learn page. Never ask for their address or zip code in chat.
- If an entry's note says the office may change soon (an election, a vacancy, a term ending), say so in one
  short sentence and remind them to check before their interview: at the interview they must name the person
  serving on that day.
- Never mention political parties.
`.trim();

function line(label, e) {
  if (!e) return "";
  const soon = mayChangeSoon(e) ? " (may change soon)" : "";
  return `- ${label}: ${e.name}${soon}\n`;
}

function placeBlock(place, district) {
  const loc = getOfficialsFor({ state: place, district });
  if (!loc) return "";
  let s = `${loc.place}:\n`;
  if (loc.noSenators) s += `- U.S. Senators: none (${loc.place} has no U.S. Senators)\n`;
  else loc.senators.forEach((x) => (s += line("U.S. Senator", x)));
  if (loc.governor) s += line("Governor", loc.governor);
  else s += `- Governor: none (${loc.place} does not have a Governor)\n`;
  if (loc.mayor) s += line("Mayor", loc.mayor);
  if (loc.delegate) s += line(`${loc.delegate.title} in the U.S. House (non-voting)`, loc.delegate);
  if (loc.representative) {
    const r = loc.representative;
    s += r.name === "VACANT"
      ? `- U.S. Representative, district ${loc.district}: seat is empty right now (vacant)\n`
      : line(`U.S. Representative, district ${loc.district}`, r);
  } else if (loc.type === "state") {
    s += `- U.S. Representatives: ${loc.houseSeatCount} seat(s); the learner's district is needed to name one\n`;
  }
  if (loc.capital && loc.capital.name !== "UNCONFIRMED") s += line("Capital", loc.capital);
  return s;
}

/** Find states/territories named in the learner's message (e.g. "who is the governor of Ohio?"). */
export function placesMentioned(message, max = 3) {
  const text = " " + normalizeText(message) + " ";
  const found = [];
  for (const p of listPlaces()) {
    const n = normalizeText(p);
    if (text.includes(" " + n + " ")) found.push(p);
  }
  for (const [alias, p] of Object.entries(PLACE_ALIASES)) {
    if (alias.length > 2 && text.includes(" " + alias + " ") && !found.includes(p)) found.push(p);
  }
  if (/ (d c|dc) /.test(text) && !found.includes("District of Columbia")) found.push("District of Columbia");
  // "Virginia" also matches inside "West Virginia": keep it only if it appears on its own too
  if (found.includes("West Virginia") && found.includes("Virginia") &&
      !text.replace(/ west virginia /g, " ").includes(" virginia ")) {
    found.splice(found.indexOf("Virginia"), 1);
  }
  return found.slice(0, max);
}

/**
 * Text block to add to each Vía request. Includes national officeholders, the learner's own state and
 * district (if they used "Who Represents Me?"), and any states named in the message.
 * Sends names only: no learner name, email or account data.
 */
export function buildViaOfficeholderContext({ state, district, message, today = new Date() } = {}) {
  const n = data.national;
  let s = `OFFICIAL LIST (checked on official government websites on ${data.meta.checkedOn}):\n`;
  if (isStale(today)) {
    s += `NOTE: this list is more than ${STALE_AFTER_DAYS} days old. When you name an officeholder, add that the learner should double-check on the official site.\n`;
  }
  s += "United States:\n";
  s += line("President", n.president) + line("Vice President", n.vicePresident) + line("Speaker of the House", n.speaker);
  s += line("Chief Justice", n.chiefJustice);
  s += `- Associate Justices: ${n.associateJustices.map((j) => j.name).join("; ")}\n`;

  const home = normalizePlace(state);
  if (home) s += "\nLEARNER LOCATION (from Who Represents Me?):\n" + placeBlock(home, district);
  for (const p of placesMentioned(message)) {
    if (p !== home) s += "\n" + placeBlock(p, null);
  }
  return s;
}
