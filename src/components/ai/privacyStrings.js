// Ask Amio's privacy note (the full note behind "Read more", and the short
// line on the screen). English and Spanish are written by hand; other
// languages come from the translation pack. Plain data, so
// src/lib/translationSources.js can read it without loading the Ask screen.
// ("Your teacher or class" = partner program staff, who never see these chats.)
export const PRIVACY_NOTE = {
  en: "Your questions to Amio are private. Your teacher or class can't see them. Don't share your immigration status, A-number, case details, or address. Your questions are saved to your account so you can see them in History.",
  es: 'Sus preguntas a Amio son privadas. Su maestro o su clase no pueden verlas. No comparta su estatus migratorio, número A, detalles de su caso ni su dirección. Sus preguntas se guardan en su cuenta para que pueda verlas en el Historial.',
};

export const PRIVACY_SHORT = {
  en: "Private: your teacher or class can't see this. Don't share your immigration status, A-number, case details, or address.",
  es: 'Privado: su maestro o su clase no pueden verlo. No comparta su estatus migratorio, número A, detalles de su caso ni su dirección.',
};
