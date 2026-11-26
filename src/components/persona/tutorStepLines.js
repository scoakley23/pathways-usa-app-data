import { MAY_CHANGE_SOON } from '@/lib/officeholderQuestions';

// Amio's fixed lines inside lessons: English (pack set "tutor-steps-amio")
// and Spanish by hand. ctx.ui(key) gives { en, mine } (see TutorLesson).
export const UI_LINES = {
  showEnglish: 'Here is the question and the answers the officer accepts. Listen and repeat.',
  speakPrompt: 'Now answer out loud, in English.',
  writePrompt: 'Listen to the sentence. Then write it in English.',
  readPrompt: 'Read this sentence out loud, in English.',
  interviewPrompt: "Answer the officer's question in English.",
  understandPrompt: "Don't answer this question. Say in English what the officer is asking.",
  keyWordsTip: 'Use the key words from one of the accepted answers.',
  correctIs: 'The correct answer is:',
  listenAgain: 'Listen again and check these words:',
  readAgain: 'Read these words again slowly:',
  checkNext: 'Thank you. On to the next one.',
  currentAnswer: 'Current answer',
  checkedOn: 'Checked on official government websites on {date}',
  mayChangeSoon: MAY_CHANGE_SOON,
  findYours: 'This answer depends on where you live. Use “Who Represents Me?” on the Learn page.',
  findButton: 'Who Represents Me?',
  notCounted: "We can't check this one yet, so it isn't counted as right or wrong.",
  askedAgain: 'Sure. Here’s the question again.',
  checkFailed: "I couldn't check that answer. Please try again.",
};
export const UI_LINES_ES = {
  showEnglish: 'Aquí está la pregunta y las respuestas que acepta el oficial. Escuche y repita.',
  speakPrompt: 'Ahora conteste en voz alta, en inglés.',
  writePrompt: 'Escuche la oración. Luego escríbala en inglés.',
  readPrompt: 'Lea esta oración en voz alta, en inglés.',
  interviewPrompt: 'Conteste la pregunta del oficial en inglés.',
  understandPrompt: 'No conteste esta pregunta. Diga en inglés qué está preguntando el oficial.',
  keyWordsTip: 'Use las palabras clave de una de las respuestas aceptadas.',
  correctIs: 'La respuesta correcta es:',
  listenAgain: 'Escuche otra vez y revise estas palabras:',
  readAgain: 'Lea otra vez, despacio, estas palabras:',
  checkNext: 'Gracias. Vamos a la siguiente.',
  currentAnswer: 'Respuesta actual',
  checkedOn: 'Revisado en sitios oficiales del gobierno el {date}',
  mayChangeSoon: 'Esto puede cambiar pronto. En su entrevista, diga el nombre de la persona que tenga el cargo ese día.',
  findYours: 'Esta respuesta depende de dónde vive. Use “Who Represents Me?” en la página Learn.',
  findButton: 'Who Represents Me?',
  notCounted: 'Todavía no podemos revisar esta, así que no cuenta como correcta ni incorrecta.',
  askedAgain: 'Claro. Aquí está la pregunta otra vez.',
  checkFailed: 'No pude revisar esa respuesta. Por favor, intente otra vez.',
};
// Older shape ({ key: { en, es } }), kept for callers that read it directly.
