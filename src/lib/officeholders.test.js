import { describe, it, expect } from "vitest";
import {
  OFFICEHOLDERS,
  KINDS,
  gradeOfficeholderAnswer as grade,
  detectOfficeholderKind,
  normalizePlace,
  normalizeDistrict,
  validateLocation,
  getOfficialsFor,
  buildViaOfficeholderContext,
  placesMentioned,
  isStale,
} from "./officeholders.js";

// These tests read real names from the JSON so they keep working after monthly updates.
const N = OFFICEHOLDERS.national;
const P = OFFICEHOLDERS.places;
const last = (name) => name.replace(/,.*$/, "").trim().split(/\s+/).pop();

describe("data file", () => {
  it("has the expected shape", () => {
    const states = Object.values(P).filter((p) => p.type === "state");
    expect(states).toHaveLength(50);
    expect(states.reduce((n, p) => n + Object.keys(p.representatives).length, 0)).toBe(435);
    expect(states.every((p) => p.senators.length === 2)).toBe(true);
    expect(N.associateJustices).toHaveLength(8);
    expect(OFFICEHOLDERS.meta.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("question detection (2008 and 2025 wording)", () => {
  const cases = [
    ["What is the name of the President of the United States now?", KINDS.PRESIDENT],
    ["What is the name of the Vice President of the United States now?", KINDS.VICE_PRESIDENT],
    ["What is the name of the Speaker of the House of Representatives now?", KINDS.SPEAKER],
    ["Who is the Chief Justice of the United States now?", KINDS.CHIEF_JUSTICE],
    ["Who is one of your state's U.S. Senators now?", KINDS.SENATOR],
    ["Name your U.S. Representative.", KINDS.REPRESENTATIVE],
    ["Who is the Governor of your state now?", KINDS.GOVERNOR],
    ["What is the capital of your state?", KINDS.CAPITAL],
    ["How many justices are on the Supreme Court?", null],
    ["What does the President's Cabinet do?", null],
  ];
  it.each(cases)("%s", (q, kind) => expect(detectOfficeholderKind(q)).toBe(kind));
});

describe("national officeholders", () => {
  it("accepts full name, first+last, last name, and small slips", () => {
    const pres = N.president.name; // e.g. "Donald J. Trump"
    for (const a of [pres, last(pres), `President ${last(pres)}`, pres.toUpperCase()]) {
      expect(grade({ kind: KINDS.PRESIDENT, answer: a }).correct, a).toBe(true);
    }
    expect(grade({ kind: KINDS.SPEAKER, answer: N.speaker.name }).correct).toBe(true);
    expect(grade({ kind: KINDS.CHIEF_JUSTICE, answer: N.chiefJustice.name }).correct).toBe(true);
    expect(grade({ kind: KINDS.CHIEF_JUSTICE, answer: "John Robert" }).correct).toBe(true); // speech slip
  });
  it("rejects wrong names and empty answers", () => {
    expect(grade({ kind: KINDS.PRESIDENT, answer: "Abraham Lincoln" }).correct).toBe(false);
    expect(grade({ kind: KINDS.VICE_PRESIDENT, answer: N.president.name }).correct).toBe(false);
    expect(grade({ kind: KINDS.SPEAKER, answer: "" }).correct).toBe(false);
  });
});

describe("state-based answers", () => {
  it("asks for location when there is none", () => {
    const r = grade({ kind: KINDS.SENATOR, answer: "anything" });
    expect(r.correct).toBe(null);
    expect(r.needsLocation).toBe(true);
  });
  it("senators: either senator, or both", () => {
    const [a, b] = P.Texas.senators.map((s) => s.name);
    expect(grade({ kind: KINDS.SENATOR, answer: a, state: "TX" }).correct).toBe(true);
    expect(grade({ kind: KINDS.SENATOR, answer: `${b} and ${a}`, state: "Texas" }).correct).toBe(true);
    expect(grade({ kind: KINDS.SENATOR, answer: a, state: "Ohio" }).correct).toBe(false);
  });
  it("South Carolina: the table's name wins over memory", () => {
    const names = P["South Carolina"].senators.map((s) => s.name);
    expect(grade({ kind: KINDS.SENATOR, answer: names[0], state: "SC" }).correct).toBe(true);
    if (!names.includes("Lindsey Graham")) {
      expect(grade({ kind: KINDS.SENATOR, answer: "Lindsey Graham", state: "SC" }).correct).toBe(false);
    }
  });
  it("two Florida senators named Scott", () => {
    const fl = P.Florida.senators.map((s) => s.name);
    const tim = P["South Carolina"].senators.find((s) => /Tim Scott/.test(s.name));
    if (tim && !fl.includes("Tim Scott")) {
      expect(grade({ kind: KINDS.SENATOR, answer: "Tim Scott", state: "FL" }).correct).toBe(false);
    }
  });
  it("representative by district, including at-large and vacant", () => {
    const tx2 = P.Texas.representatives["2"].name;
    expect(grade({ kind: KINDS.REPRESENTATIVE, answer: tx2, state: "TX", district: "2nd" }).correct).toBe(true);
    expect(grade({ kind: KINDS.REPRESENTATIVE, answer: tx2, state: "TX", district: 3 }).correct).toBe(false);
    const ak = P.Alaska.representatives["At-large"].name;
    expect(grade({ kind: KINDS.REPRESENTATIVE, answer: ak, state: "AK", district: "at large" }).correct).toBe(true);
    const vacant = Object.entries(P.Texas.representatives).find(([, r]) => r.name === "VACANT");
    if (vacant) {
      const r = grade({ kind: KINDS.REPRESENTATIVE, answer: "someone", state: "TX", district: vacant[0] });
      expect(r.correct).toBe(null);
      expect(r.message).toMatch(/empty/);
    }
  });
  it("nicknames in quotes", () => {
    const crawford = P.Arkansas.representatives["1"].name; // Eric A. "Rick" Crawford
    if (/"Rick"/.test(crawford)) {
      for (const a of ["Rick Crawford", "Eric Crawford", "Crawford"]) {
        expect(grade({ kind: KINDS.REPRESENTATIVE, answer: a, state: "AR", district: 1 }).correct, a).toBe(true);
      }
    }
  });
  it("governor and capital", () => {
    expect(grade({ kind: KINDS.GOVERNOR, answer: P.Ohio.governor.name, state: "OH" }).correct).toBe(true);
    expect(grade({ kind: KINDS.CAPITAL, answer: "Austin", state: "TX" }).correct).toBe(true);
    expect(grade({ kind: KINDS.CAPITAL, answer: "Austin, Texas", state: "TX" }).correct).toBe(true);
    expect(grade({ kind: KINDS.CAPITAL, answer: "Houston", state: "TX" }).correct).toBe(false);
    expect(grade({ kind: KINDS.CAPITAL, answer: "St. Paul", state: "MN" }).correct).toBe(true);
    expect(grade({ kind: KINDS.CAPITAL, answer: "Hagatna", state: "Guam" }).correct).toBe(true);
  });
});

describe("D.C. and territories (USCIS answer notes)", () => {
  it("D.C. has no senators", () => {
    expect(grade({ kind: KINDS.SENATOR, answer: "D.C. has no senators", state: "DC" }).correct).toBe(true);
    expect(grade({ kind: KINDS.SENATOR, answer: "None", state: "DC" }).correct).toBe(true);
    expect(grade({ kind: KINDS.SENATOR, answer: "No sé", state: "DC" }).correct).toBe(false); // "I don't know"
    expect(grade({ kind: KINDS.SENATOR, answer: "I don't know", state: "DC" }).correct).toBe(false);
  });
  it("D.C. has no governor; mayor is not accepted", () => {
    expect(grade({ kind: KINDS.GOVERNOR, answer: "D.C. does not have a governor", state: "DC" }).correct).toBe(true);
    expect(grade({ kind: KINDS.GOVERNOR, answer: P["District of Columbia"].mayor.name, state: "DC" }).correct).toBe(false);
  });
  it("territories: delegate name OR no voting representative", () => {
    const d = P["Puerto Rico"].delegate.name;
    expect(grade({ kind: KINDS.REPRESENTATIVE, answer: d, state: "PR" }).correct).toBe(true);
    expect(grade({ kind: KINDS.REPRESENTATIVE, answer: "We don't have a voting representative", state: "PR" }).correct).toBe(true);
    expect(grade({ kind: KINDS.SENATOR, answer: "no senators", state: "Guam" }).correct).toBe(true);
  });
  it("D.C. capital is not graded", () => {
    expect(grade({ kind: KINDS.CAPITAL, answer: "Washington", state: "DC" }).correct).toBe(null);
  });
});

describe("locations", () => {
  it("normalizes places and districts", () => {
    expect(normalizePlace("tx")).toBe("Texas");
    expect(normalizePlace("Washington, D.C.")).toBe("District of Columbia");
    expect(normalizePlace("Washington")).toBe("Washington"); // the state
    expect(normalizePlace("Atlantis")).toBe(null); // never guessed
    expect(normalizePlace("D.C.")).toBe("District of Columbia");
    expect(normalizePlace("Virgin Islands")).toBe("U.S. Virgin Islands");
    expect(normalizeDistrict("TX", "07")).toBe("7");
    expect(normalizeDistrict("TX", 99)).toBe(null);
    expect(normalizeDistrict("WY", 0)).toBe("At-large");
  });
  it("validateLocation rejects districts that don't exist", () => {
    expect(validateLocation({ state: "CA", district: 52 }).ok).toBe(true);
    expect(validateLocation({ state: "CA", district: 53 }).ok).toBe(false);
    expect(validateLocation({ state: "Guam" })).toEqual({ ok: true, state: "Guam", district: "At-large" });
  });
  it("getOfficialsFor returns names from the table", () => {
    const o = getOfficialsFor({ state: "NY", district: 14 });
    expect(o.representative.name).toBe(P["New York"].representatives["14"].name);
  });
});

describe("Vía context", () => {
  it("includes national names, the learner's place, and places in the message", () => {
    const ctx = buildViaOfficeholderContext({ state: "TX", district: 2, message: "Who is the governor of Ohio?" });
    expect(ctx).toContain(N.president.name);
    expect(ctx).toContain(P.Texas.representatives["2"].name);
    expect(ctx).toContain(P.Ohio.governor.name);
    expect(ctx).not.toMatch(/Republican|Democrat/);
  });
  it("West Virginia doesn't pull in Virginia", () => {
    expect(placesMentioned("who are the senators of west virginia")).toEqual(["West Virginia"]);
    expect(placesMentioned("virginia and west virginia").sort()).toEqual(["Virginia", "West Virginia"]);
  });
  it("warns when the list is old", () => {
    const later = new Date(OFFICEHOLDERS.meta.checkedOn + "T00:00:00Z");
    later.setUTCDate(later.getUTCDate() + 60);
    expect(isStale(later)).toBe(true);
    expect(buildViaOfficeholderContext({ today: later })).toMatch(/more than 45 days old/);
  });
});

describe("every name in the table", () => {
  it("grades correct in its own place, and a neighbor's name grades wrong", () => {
    const bad = [];
    for (const [place, p] of Object.entries(P)) {
      for (const s of p.senators) {
        if (!grade({ kind: KINDS.SENATOR, answer: s.name, state: place }).correct) bad.push(`${place} senator ${s.name}`);
      }
      if (p.governor && !grade({ kind: KINDS.GOVERNOR, answer: p.governor.name, state: place }).correct) bad.push(`${place} governor`);
      const reps = Object.entries(p.representatives).filter(([, r]) => r.name !== "VACANT");
      for (const [d, r] of reps) {
        if (!grade({ kind: KINDS.REPRESENTATIVE, answer: r.name, state: place, district: d }).correct) bad.push(`${place} ${d} ${r.name}`);
        const other = reps.find(([d2]) => d2 !== d);
        if (other && grade({ kind: KINDS.REPRESENTATIVE, answer: other[1].name, state: place, district: d }).correct) {
          bad.push(`${place} ${d} wrongly accepted ${other[1].name}`);
        }
      }
      if (p.capital?.name && p.capital.name !== "UNCONFIRMED" && !grade({ kind: KINDS.CAPITAL, answer: p.capital.name, state: place }).correct) {
        bad.push(`${place} capital`);
      }
    }
    expect(bad).toEqual([]);
  });
});
