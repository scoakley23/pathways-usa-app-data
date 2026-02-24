import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Check } from 'lucide-react';
import { toast } from "sonner";

export default function VoiceSelector({ onVoiceSelect }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const enVoices = availableVoices.filter(v => v.lang.startsWith('en'));
      setVoices(enVoices);
      
      // Load saved preference
      const saved = localStorage.getItem('preferredVoice');
      if (saved) {
        const match = enVoices.find(v => v.name === saved);
        setSelectedVoice(match);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const testVoice = (voice) => {
    window.speechSynthesis.cancel();
    setPlaying(voice.name);

    const utterance = new SpeechSynthesisUtterance("Hello, this is how I sound. I will read your lessons with this voice.");
    utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onend = () => setPlaying(null);
    utterance.onerror = () => setPlaying(null);

    window.speechSynthesis.speak(utterance);
  };

  const selectVoice = (voice) => {
    setSelectedVoice(voice);
    localStorage.setItem('preferredVoice', voice.name);
    if (onVoiceSelect) onVoiceSelect(voice);
    toast.success(`Voice set to: ${voice.name}`);
  };

  const clearSelection = () => {
    setSelectedVoice(null);
    localStorage.removeItem('preferredVoice');
    if (onVoiceSelect) onVoiceSelect(null);
    toast.success('Using browser default voice');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Text-to-Speech Voice Settings</CardTitle>
        <p className="text-sm text-slate-600">Choose your preferred voice for lessons and practice</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {voices.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Loading voices...</p>
          ) : (
            <>
              <div className="mb-4">
                <Button 
                  variant={selectedVoice ? "outline" : "default"} 
                  onClick={clearSelection}
                  className="w-full"
                >
                  {!selectedVoice && <Check className="w-4 h-4 mr-2" />}
                  Browser Default Voice
                </Button>
              </div>
              
              {voices.map((voice, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    selectedVoice?.name === voice.name 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{voice.name}</p>
                    <p className="text-xs text-slate-500">{voice.lang} {voice.localService ? '(Local)' : '(Online)'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => testVoice(voice)}
                      disabled={playing === voice.name}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm"
                      variant={selectedVoice?.name === voice.name ? "default" : "outline"}
                      onClick={() => selectVoice(voice)}
                    >
                      {selectedVoice?.name === voice.name ? (
                        <>
                          <Check className="w-4 h-4 mr-1" /> Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}