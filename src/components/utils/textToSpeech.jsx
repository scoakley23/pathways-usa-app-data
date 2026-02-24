export const speakText = (text, language = 'en', { onStart, onEnd } = {}) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'en' ? 'en-US' : language;
  
  // Use Samantha voice if available
  const voices = window.speechSynthesis.getVoices();
  const samanthaVoice = voices.find(v => v.name.includes('Samantha'));
  if (samanthaVoice) {
    utterance.voice = samanthaVoice;
  } else {
    // Fallback to Google US English if Samantha not available
    const googleVoice = voices.find(v => v.name === 'Google US English');
    if (googleVoice) {
      utterance.voice = googleVoice;
    }
  }
  
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
};