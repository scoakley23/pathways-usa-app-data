import useTranslatedLines from '@/components/persona/useTranslatedLines';

// English text for the "Help us improve Pathways" screen and the Profile
// card, translated on demand like Today's text. Bump PILOT_CACHE_KEY when the
// English changes.
export const PILOT_CACHE_KEY = 'pilot_v2';

export const PILOT_EN = {
  eyebrow: 'Optional',
  title: 'Help us improve Pathways',
  intro: "These questions are optional. They help us learn if Pathways works. Don't share case numbers or personal details. Programs you study with can't see your answers. You can delete them any time with 'Delete all my data.'",
  prefer_not: "I'd rather not say",
  state_label: 'Which state do you live in?',
  state_choose: 'Choose a state',
  stage_label: 'Where are you in the citizenship process?',
  stage_not_filed: 'Not filed yet',
  stage_filed_waiting: 'Filed, waiting for my interview',
  stage_interview_scheduled: 'My interview is scheduled',
  ready_label: 'How ready do you feel for your citizenship interview?',
  ready_low: 'Not ready',
  ready_high: 'Very ready',
  reminders_label: 'Email me a short reminder in 3, 6 and 12 months.',
  save: 'Save',
  skip: 'Skip',
  saving: 'Saving…',
  saved: 'Thank you.',
  error: 'Something went wrong. Please try again.',
  card_title: 'Help us improve Pathways',
  card_desc: "Optional. Programs you study with can't see this. 'Delete all my data' erases it.",
  reminders_switch: 'Email reminders at 3, 6 and 12 months',
  reminders_help: 'A short email asking a 1-minute question. Off unless you turn it on.',
  card_save: 'Save state',
};

export default function usePilotText(language) {
  const translate = useTranslatedLines(PILOT_EN, language, { cacheKey: PILOT_CACHE_KEY });
  return (key) => (language !== 'en' && translate(key)) || PILOT_EN[key];
}
