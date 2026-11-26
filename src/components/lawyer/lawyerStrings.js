import { LEGAL_HELP_LINKS } from './lawyerChecklist';

// "Talk to a lawyer first" and "Free help near you" (LawyerPage.jsx, Amio
// v2): the screens' own lines, translated through the pack (set "lawyer").
// The checklist items keep their own translation (lawyer-checklist). The
// wording is unchanged from before; only where it lives moved.
export const LAWYER_LINES = {
  back: 'Back',
  help_title: 'Free help near you',
  help_sub: 'Legal help, classes and libraries',
  call_first: 'Always call before you go.',
  lawyer_title: 'Talk to a lawyer first',
  lawyer_card_body: 'Before you file, see when to get legal help.',
  help_note: 'This page helps you find help. It is not legal advice about your situation. Nothing you read or search here, including your location, is saved or shared.',
  lawyer_sub: 'Before you file, if any of these might be true',
  lawyer_intro: 'Most people can apply on their own. But if any of these are true for you, talk to a lawyer or accredited representative before you file. Filing with one of these issues can cause serious problems, including more than a denied application. You do not need to tell this app anything.',
  if_any: 'If any of these is true for you',
  translating: 'Translating…',
  read_in_guide: '{section}: read it in the N-400 guide',
  the_guide: 'the N-400 guide',
  guide_note: 'Each item links to the part of our N-400 guide that explains those questions. The guide tells you what the form asks. It does not tell you how to answer.',
  machine_note: 'Machine translation. If anything is unclear, ask a person you trust or a lawyer.',
  admin_draft: 'This list is a draft pending legal review. Do not publish changes without the owner’s sign-off.',
  free_help: 'Find free or low-cost legal help',
  opens_outside: 'opens outside the app',
  who_can: 'Who can legally help you',
  who_can_body: 'Only lawyers and DOJ-accredited representatives can give immigration legal advice. Notarios and “immigration consultants” cannot.',
  amio_lawyer: 'I can’t give legal advice. A free legal helper can look at your situation.',
  nothing_saved: 'Nothing you see or tap here is saved. Pathways is not a law office. This page explains when to get legal help; it is not legal advice about your situation.',
  find_near_me: 'Find free legal help near me',
  ...Object.fromEntries(LEGAL_HELP_LINKS.map((l, i) => [`link_${i}`, l.description])),
};
