// "Delete all my data": every Base44 record tied to the learner's email, and
// the learner fields reset on the sign-in account (which the app can't
// delete). Used by src/components/profile/DeleteMyData.jsx; the test checks
// every learner entity is covered.
import { PILOT_ACCOUNT_RESET } from '@/lib/pilot';

// [what the learner sees, entity, filter]
export function deleteSteps(userEmail) {
  const email = userEmail.toLowerCase().trim();
  const variants = [...new Set([email, userEmail])];
  const mine = { user_email: { $in: variants } };
  return [
    ['AI study buddy history', 'AIStudyLog', mine],
    ['lesson notes', 'LessonNotes', mine],
    ['lesson progress & quiz history', 'LessonProgress', mine],
    ['practice progress', 'UserProgress', mine],
    ['notifications', 'Notification', mine],
    ['interview history', 'InterviewSession', mine],
    ['profile', 'PublicProfile', mine],
    ['N-400 guide progress', 'N400SectionProgress', mine],
    ['saved places', 'SavedPlace', mine],
    ['check-in answers', 'OutcomeCheckIn', mine],
    ['activity dates', 'ActivityDay', mine],
    ['your program', 'ProgramMembership', mine],
  ];
}

// Records the learner can't reach themselves, removed by a backend function:
// [what the learner sees, function, body].
export const FUNCTION_STEPS = [
  ['reminder email records', 'pilot-reminders', { action: 'forget' }],
];

export const ACCOUNT_RESET = {
  display_name: 'Learner',
  points: 0,
  badges: [],
  max_streak: 0,
  tutor_profile: null,
  skill_levels: null,
  ...PILOT_ACCOUNT_RESET,
};
