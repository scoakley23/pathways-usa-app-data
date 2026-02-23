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

    let voice;
    
    if (randomVoice && matchingVoices.length > 0) {
      // Random voice selection for practice variability
      voice = matchingVoices[Math.floor(Math.random() * matchingVoices.length)];
    } else {
      // Default: prefer high-quality voices
      voice = voices.find(v => 
        v.lang.startsWith(language === 'en' ? 'en' : language) && 
        (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Natural'))
      );

      // Fallback to any voice of that language
      if (!voice) {
        voice = matchingVoices[0];
      }
    }

    if (voice) {
      utterance.voice = voice;
    }

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