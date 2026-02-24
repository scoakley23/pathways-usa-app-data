export const speakText = (text, language = 'en', { onStart, onEnd, randomVoice = false } = {}) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  const speak = () => {
    const voices = window.speechSynthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map simplified language codes to full locales
    const langMap = {
      'en': 'en-US',
      'es': 'es-ES',
      'zh': 'zh-CN',
      'vi': 'vi-VN',
      'ar': 'ar-SA',
      'fr': 'fr-FR',
      'tl': 'en-PH' // Fallback for Tagalog
    };
    
    const targetLang = langMap[language] || 'en-US';
    utterance.lang = targetLang;
    
    // Get all voices matching the language
    const matchingVoices = voices.filter(v => 
      v.lang.startsWith(language === 'en' ? 'en' : language)
    );

    // Use default voice - no explicit voice selection
    // The browser will use its default voice for the language

    // Adjust rate for clarity (slightly slower is better for learning)
    utterance.rate = 0.85; 
    utterance.pitch = 1.0;

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
  };

  // Chrome requires waiting for voices to load
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = speak;
  } else {
    speak();
  }
};