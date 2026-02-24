export const speakText = (text, language = 'en', { onStart, onEnd } = {}) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'en' ? 'en-US' : language;
  
  // Use saved voice preference
  const savedVoice = localStorage.getItem('preferredVoice');
  if (savedVoice) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === savedVoice);
    if (voice) utterance.voice = voice;
  }
  
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
};