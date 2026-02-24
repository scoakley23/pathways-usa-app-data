export const speakText = (text, language = 'en', { onStart, onEnd, randomVoice } = {}) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  const speak = () => {
    const voices = window.speechSynthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = language === 'en' ? 'en-US' : language;
    
    if (randomVoice && voices.length > 0) {
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      if (enVoices.length > 0) {
        const randomIndex = Math.floor(Math.random() * enVoices.length);
        utterance.voice = enVoices[randomIndex];
      }
    }
    
    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = speak;
  } else {
    speak();
  }
};