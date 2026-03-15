const getSamanthaVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.name === 'Samantha') || voices.find(v => v.name.includes('Samantha')) || null;
};

export const speakText = (text, language = 'en', { onStart, onEnd } = {}) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'en' ? 'en-US' : language;

  // Always use Samantha voice; voices may load async so retry if empty
  const setVoice = () => {
    const samantha = getSamanthaVoice();
    if (samantha) utterance.voice = samantha;
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    setVoice();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
  }
  
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
};