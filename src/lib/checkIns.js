// Check-ins (Prompt 8): in-app only, built from progress data the app
// already saves. Pure functions; the Today card shows the messages.
import { daysBetween } from './studyPlan';

export const SKILLS = ['civics', 'reading', 'writing', 'speaking'];
const MIX_ORDER = ['mostly_mine', 'half', 'mostly_english'];
const LOW_RATE = 0.6;
const HIGH_RATE = 0.85;

// Recent results per skill from saved progress (last 7 days).
// progress: UserProgress rows; sessions: InterviewSession rows.
// Reading and dictation both save content_type 'sentence', so sentence
// results count for both reading and writing.
export function recentResults({ progress = [], sessions = [], today = new Date() }) {
  const within = (d) => d && daysBetween(new Date(d), today) <= 7 && daysBetween(new Date(d), today) >= 0;
  const out = Object.fromEntries(SKILLS.map((s) => [s, { attempts: 0, correct: 0 }]));
  for (const p of progress) {
    if (!within(p.last_practiced) || !p.last_result) continue;
    const skills = p.content_type === 'civics_question' ? ['civics'] : p.content_type === 'sentence' ? ['reading', 'writing'] : [];
    for (const s of skills) {
      out[s].attempts++;
      if (p.last_result === 'correct') out[s].correct++;
    }
  }
  for (const s of sessions) {
    if (!within(s.created_date) || typeof s.overall_score !== 'number') continue;
    out.speaking.attempts++;
    if (s.overall_score >= 70) out.speaking.correct++;
  }
  for (const s of SKILLS) out[s].rate = out[s].attempts ? out[s].correct / out[s].attempts : null;
  return out;
}

// Skills that stayed low for a week: the plan has run at least 7 days and
// recent results are low (or the level is still "Start here" with no
// practice at all). These get extra weight in the plan.
export function lowSkills({ levels = {}, recent, planStart, today = new Date() }) {
  if (!planStart || daysBetween(planStart, today) < 7) return [];
  return SKILLS.filter((s) => {
    const r = recent?.[s];
    if (r && r.attempts >= 3) return r.rate < LOW_RATE;
    return levels[s] === 'start_here' && (!r || r.attempts === 0);
  });
}

// Levels the plan should use: low skills are treated as "Start here".
export function adjustedLevels(levels = {}, low = []) {
  const out = { ...levels };
  for (const s of low) out[s] = 'start_here';
  return out;
}

// Weakest checked skill (for the 2-week re-check).
const RANK = { start_here: 0, getting_there: 1, strong: 2 };
export function weakestSkill(levels = {}) {
  const checked = SKILLS.filter((s) => levels[s] in RANK);
  if (!checked.length) return null;
  return checked.reduce((a, b) => (RANK[levels[b]] < RANK[levels[a]] ? b : a));
}

export function nextEnglishMix(mix) {
  const i = MIX_ORDER.indexOf(mix);
  return i >= 0 && i < MIX_ORDER.length - 1 ? MIX_ORDER[i + 1] : null;
}

// Messages for today, most important first. Each: { id, kind, ...data }.
// dismissed: ids the learner closed today.
export function checkIns({ missedDays = 0, levels = {}, checkedAt, recent, planStart, englishMix, language = 'en', today = new Date(), dismissed = [] }) {
  const out = [];
  if (missedDays > 0) out.push({ id: 'welcome-back', kind: 'welcome-back' });

  const low = lowSkills({ levels, recent, planStart, today });
  if (low.length) out.push({ id: `low-${low.join('-')}`, kind: 'low-skill', skills: low });

  if (checkedAt && daysBetween(new Date(checkedAt), today) >= 14) {
    const skill = weakestSkill(levels);
    if (skill) out.push({ id: `recheck-${skill}`, kind: 'recheck', skill });
  }

  const next = nextEnglishMix(englishMix);
  if (next && language !== 'en') {
    const strongCount = SKILLS.filter((s) => levels[s] === 'strong').length;
    const r = recent?.civics;
    const highRecent = r && r.attempts >= 10 && r.rate >= HIGH_RATE;
    if (strongCount >= 3 || highRecent) out.push({ id: `mix-${next}`, kind: 'english-mix', next });
  }

  return out.filter((c) => !dismissed.includes(c.id));
}
