export const speakText = (text, language = 'en', { onStart, onEnd } = {}) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'en' ? 'en-US' : language;
  
  // Use Google US English voice
  const voices = window.speechSynthesis.getVoices();
  const googleVoice = voices.find(v => v.name === 'Google US English');
  if (googleVoice) {
    utterance.voice = googleVoice;
  }
  
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
};