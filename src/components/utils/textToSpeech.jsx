export const speakText = (text, language = 'en') => {
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
    
    // improved voice selection strategy
    // 1. Match language
    // 2. Prefer "Google" (Chrome) or "Natural" (Edge) or "Premium" (Apple)
    let voice = voices.find(v => 
      v.lang.startsWith(language === 'en' ? 'en' : language) && 
      (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Natural'))
    );

    // Fallback to any voice of that language
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(language === 'en' ? 'en' : language));
    }

    if (voice) {
      utterance.voice = voice;
    }

    // Adjust rate for clarity (slightly slower is better for learning)
    utterance.rate = 0.85; 
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  // Chrome requires waiting for voices to load
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = speak;
  } else {
    speak();
  }
};