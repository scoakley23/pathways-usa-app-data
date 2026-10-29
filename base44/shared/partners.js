// Partner programs: pure helpers shared by the `partner` backend function
// (base44/functions/partner) and tested from src/lib/partners.test.js.
//
// A learner says which partner program they study with (Getting started or
// Profile). That makes a pending ProgramMembership; the program's staff
// confirm it or mark it "not ours". Staff see the optional name the learner
// gave (or their email), never their answers, chats or pilot check-ins.

export const STATUSES = ["pending", "confirmed", "removed"];
export const MAX_NAME_LENGTH = 60;

export const normalizeEmail = (email) => String(email || "").toLowerCase().trim();
export const normalizeCode = (code) => String(code || "").trim().toUpperCase().replace(/\s+/g, "-").slice(0, 40);

// What learners may know about a partner: never the staff list.
export const publicPartner = (p) => ({ code: normalizeCode(p.code), name: p.name || "", shareLearners: p.share_learners === true });

export const activePartners = (partners = []) =>
  partners.filter((p) => p.active !== false && normalizeCode(p.code) && p.name).map(publicPartner);

export const findActivePartner = (partners, code) =>
  activePartners(partners).find((p) => p.code === normalizeCode(code)) || null;

const staffOf = (p) => (Array.isArray(p.staff_emails) ? p.staff_emails : []).map(normalizeEmail).filter(Boolean);

// The partner programs this person works for.
export const partnersForStaff = (partners = [], email) => {
  const me = normalizeEmail(email);
  return me ? activePartners(partners.filter((p) => staffOf(p).includes(me))) : [];
};

// The optional name a learner gives their program: a name only, so nothing
// that looks like an email address or a case or phone number.
export function cleanName(name) {
  const s = String(name || "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
  if (!s || s.includes("@") || /\d{3,}/.test(s)) return "";
  return s;
}

// A learner picks (or re-picks) a program. Returns the fields to save.
// Same program as before: keep its status, unless the program said "not ours"
// (then it asks them again). A different program starts over as pending.
// Sharing their own progress is possible only where the program has it on.
export function planJoin(existing, partner, { name, share } = {}) {
  const same = existing && normalizeCode(existing.partner_code) === partner.code;
  const status = same && existing.status !== "removed" ? existing.status : "pending";
  return {
    partner_code: partner.code,
    status,
    display_name: cleanName(name),
    share_progress: partner.shareLearners && share === true,
    ...(same && status === existing.status ? {} : { status_changed_at: new Date().toISOString() }),
  };
}

// What staff see in the confirm list.
export const memberView = (m) => ({
  id: m.id,
  name: m.display_name || normalizeEmail(m.user_email),
  status: STATUSES.includes(m.status) ? m.status : "pending",
  since: m.created_date || null,
});

export const canManage = (membership, staffPartners = []) =>
  !!membership && staffPartners.some((p) => p.code === normalizeCode(membership.partner_code));

// ---- Totals for a program (/Partner) ----
// Counted over confirmed learners only, shown as exact numbers. Per-learner
// rows only for learners who chose to share, in programs that allow it, and
// only quick check levels, lessons finished and N-400 sections read.

export const SKILLS = ["civics", "reading", "writing", "speaking"];
export const LEVELS = ["start_here", "getting_there", "strong"];

const dayString = (d) => d.toISOString().slice(0, 10);
const daysAgo = (today, n) => {
  const d = new Date(`${dayString(today)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return dayString(d);
};

const countBy = (rows, key) => {
  const map = new Map();
  for (const r of rows) {
    const k = normalizeEmail(r[key]);
    if (k) map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
};

// confirmed: ProgramMembership rows with status "confirmed".
// data: { users, lessons, sections, activity } rows for those learners.
export function programSummary(confirmed, { users = [], lessons = [], sections = [], activity = [] } = {}, { today = new Date(), shareAllowed = false } = {}) {
  const emails = new Set(confirmed.map((m) => normalizeEmail(m.user_email)));
  const mine = (rows, key) => rows.filter((r) => emails.has(normalizeEmail(r[key])));

  const levelsByEmail = new Map(mine(users, "email").map((u) => [normalizeEmail(u.email), u.skill_levels || null]));
  const lessonsDone = countBy(mine(lessons, "user_email").filter((r) => r.completed === true), "user_email");
  const sectionsDone = countBy(mine(sections, "user_email").filter((r) => r.completed === true), "user_email");

  const weekStart = daysAgo(today, 6);
  const monthStart = daysAgo(today, 29);
  const days = mine(activity, "user_email");
  const activeSince = (start) => new Set(days.filter((d) => String(d.date || "") >= start).map((d) => normalizeEmail(d.user_email))).size;

  const levels = Object.fromEntries(SKILLS.map((s) => [s, Object.fromEntries(LEVELS.map((l) => [l, 0]))]));
  let checked = 0;
  for (const email of emails) {
    const sl = levelsByEmail.get(email);
    if (!sl || !SKILLS.some((s) => LEVELS.includes(sl[s]))) continue;
    checked += 1;
    for (const s of SKILLS) if (LEVELS.includes(sl[s])) levels[s][sl[s]] += 1;
  }

  const sum = (map) => [...map.values()].reduce((a, b) => a + b, 0);
  const totals = {
    learners: emails.size,
    activeWeek: activeSince(weekStart),
    activeMonth: activeSince(monthStart),
    quickCheckDone: checked,
    levels,
    lessonsCompleted: sum(lessonsDone),
    learnersWithLesson: lessonsDone.size,
    n400SectionsRead: sum(sectionsDone),
    learnersWithN400: sectionsDone.size,
  };

  const learners = shareAllowed
    ? confirmed
      .filter((m) => m.share_progress === true)
      .map((m) => {
        const email = normalizeEmail(m.user_email);
        const sl = levelsByEmail.get(email) || {};
        return {
          id: m.id,
          name: m.display_name || email,
          levels: Object.fromEntries(SKILLS.map((s) => [s, LEVELS.includes(sl[s]) ? sl[s] : null])),
          lessonsCompleted: lessonsDone.get(email) || 0,
          n400SectionsRead: sectionsDone.get(email) || 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return { totals, learners };
}
