// Where a learner starts the course (Prompt 9), from the quick check's civics
// level (User.skill_levels / profiles.skill_levels). Calculated each time,
// never stored. Stops before the starting unit stay "open": the learner can
// still go back and play them, but they don't block the road.
//   start here (or no quick check) → Unit 1 · Section 1
//   getting there                  → Unit 2 · Section 1
//   strong                         → Unit 3 · Section 1
export const START_UNIT_BY_LEVEL = { start_here: 1, getting_there: 2, strong: 3 };

/** The unit number to start at (1 when there is no civics level). */
export function startUnitNumber(skillLevels) {
  return START_UNIT_BY_LEVEL[skillLevels?.civics] || 1;
}

/**
 * The starting unit and section in a (visible) course: the chosen unit's
 * first section with stops; if that unit has none yet, the next unit that
 * does; else the first one. { unit, section } or null for an empty course.
 */
export function startingPoint(course, skillLevels) {
  const n = startUnitNumber(skillLevels);
  const withStops = (u) => u.sections.find((s) => (s.stops || []).length);
  const ordered = [...course.filter((u) => u.number >= n), ...course.filter((u) => u.number < n)];
  for (const unit of ordered) {
    const section = withStops(unit);
    if (section) return { unit, section };
  }
  return null;
}
