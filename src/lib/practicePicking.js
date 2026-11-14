// Which items a Practice round shows, on Supabase (the switch on), where the
// old review fields are gone (Prompt 4). Base44 keeps Practice's old picking.
//
// Civics questions: due review questions first (review_items, oldest due
// first), then questions not seen yet, then the rest (longest ago first),
// mastered ones last.
// Sentences and words: missed last time first, then not seen yet, then the
// rest (longest ago first), mastered ones last.
//
// Pure: progressRows = the learner's user_progress rows for this kind,
// reviewItems = their review_items rows (civics only).
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const time = (iso) => { const t = new Date(iso).getTime(); return Number.isNaN(t) ? 0 : t; };

export function pickForPractice(items = [], progressRows = [], reviewItems = [], { civics = false, today = new Date(), limit = 10, random = Math.random } = {}) {
  const progressOf = new Map(progressRows.map((p) => [p.content_id, p]));
  const dueOn = new Map(reviewItems.filter((r) => r.next_due <= ymd(today)).map((r) => [r.question_id, r.next_due]));

  const ranked = items.map((item) => {
    const p = progressOf.get(item.id);
    let tier;
    let key;
    if (civics && dueOn.has(item.id)) { tier = 0; key = dueOn.get(item.id); }
    else if (!civics && p && p.status !== 'mastered' && p.last_result === 'incorrect') { tier = 0; key = time(p.last_practiced); }
    else if (!p) { tier = 1; key = random(); }
    else if (p.status !== 'mastered') { tier = 2; key = time(p.last_practiced); }
    else { tier = 3; key = time(p.last_practiced); }
    return { item, tier, key };
  });
  ranked.sort((a, b) => a.tier - b.tier || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return ranked.slice(0, limit).map((r) => r.item);
}
