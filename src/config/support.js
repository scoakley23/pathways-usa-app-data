// "Talk to a person" contact form settings.
// Fill these in before launch. The form stays disabled ("Contact form coming
// soon.") until BOTH are set.
//   SUPPORT_EMAIL: the Pathways USA team inbox, e.g. 'help@example.org'
//   REPLY_TIME:    shown as "We reply within {REPLY_TIME}.", e.g. '2 business days'
export const SUPPORT_EMAIL = '';
export const REPLY_TIME = '';

export const SUPPORT_SUBJECT = 'Pathways USA question';
export const SUPPORT_MAX_LENGTH = 1000;

// Where messages are stored, and for how long:
// - Messages to a human tutor (My Classroom): Base44 `Message` entity, visible
//   to the learner and that tutor, kept until the learner uses Delete My Data
//   (which also removes them from the tutor's history).
// - Contact-form messages: NOT stored in the app. They are sent by email to
//   SUPPORT_EMAIL (with the learner's account email so the team can reply) and
//   live in that mailbox under the team's own email retention.
// - Ask Vía questions and answers: Base44 `AIStudyLog`, shown only to the
//   learner in Study History, kept until Delete My Data. Questions the tutor
//   declines (about the learner's own case or eligibility) are not saved.

export function supportFormReady() {
  return !!SUPPORT_EMAIL.trim() && !!REPLY_TIME.trim();
}
