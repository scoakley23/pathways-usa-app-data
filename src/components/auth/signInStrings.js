// The sign-in screen's words, in plain English. Translated on demand through
// useTranslatedLines (bump SIGN_IN_CACHE_KEY when the English changes).
// {name} is filled in on the device with the learner's email, so the email
// is never sent for translation.
export const SIGN_IN_CACHE_KEY = 'signin_v1';

export const SIGN_IN_STRINGS = {
  title: 'Sign in',
  intro: "Type your email. We'll send you a 6-digit code. No password needed.",
  emailLabel: 'Email',
  sendCode: 'Send me a code',
  sending: 'Sending…',
  checkTitle: 'Check your email',
  sentTo: 'We sent a 6-digit code to {name}.',
  sentHelp: 'It can take a minute. Check your spam folder too.',
  codeLabel: '6-digit code',
  signIn: 'Sign in',
  checking: 'Checking…',
  resend: 'Send a new code',
  resendIn: 'Send a new code in {name} seconds',
  newCodeSent: 'We sent a new code.',
  otherEmail: 'Use a different email',
  back: 'Back',
  expiredNote: 'You were signed out. Sign in again to keep going.',
  // Errors: always words, never color alone.
  bad_email: 'That email doesn\'t look right. Check it and try again.',
  wrong_code: "That code didn't work. Check the 6 numbers and try again.",
  expired_code: 'That code has expired. Tap "Send a new code".',
  too_many: 'Too many tries. Wait a minute, then try again.',
  network: "We couldn't reach Pathways. Check your internet and try again.",
  unknown: 'Something went wrong. Please try again.',
  footer: 'Free practice · Not affiliated with USCIS · Not legal advice',
  // The small notice when a login ends by itself (SessionNotice).
  signedOutNotice: 'You were signed out.',
  signInAgain: 'Sign in again',
  close: 'Close',
};

export const fill = (text, value) => String(text).replace('{name}', value);
