import React, { useEffect, useState } from 'react';
import { Volume2, Play } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PillButton } from '@/components/pathways/ui';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  getAvailableVoices, getVoiceSettings, saveVoiceSettings, rankVoice, speakText, stopSpeaking
} from '@/components/utils/textToSpeech';

export default function VoiceSettings() {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [voiceName, setVoiceName] = useState(null);
  const [rate, setRate] = useState(0.9);
  const [playingSample, setPlayingSample] = useState(false);

  useEffect(() => {
    const settings = getVoiceSettings();
    setVoiceName(settings.voiceName);
    setRate(settings.rate);
    let active = true;
    getAvailableVoices('en').then((list) => {
      if (!active) return;
      setVoices(list);
      setVoicesLoaded(true);
    });
    return () => { active = false; };
  }, [open]);

  const handleVoiceChange = (value) => {
    const next = value === 'best' ? null : value;
    setVoiceName(next);
    saveVoiceSettings({ voiceName: next });
  };

  const handleRateChange = (value) => {
    const next = value[0];
    setRate(next);
    saveVoiceSettings({ rate: next });
  };

  const playSample = () => {
    stopSpeaking();
    setPlayingSample(true);
    speakText('What is the supreme law of the land?', 'en', {
      voiceName: voiceName || undefined,
      onEnd: () => setPlayingSample(false),
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) stopSpeaking(); }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full min-h-[44px] border-pw-line text-pw-navy font-bold">
          <Volume2 className="w-4 h-4" aria-hidden="true" /> Voice
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 max-w-[calc(100vw-2rem)] space-y-5 rounded-[14px] border-pw-line shadow-lift p-5 text-pw-navy">
        <div>
          <p className="text-base font-bold mb-2">Voice</p>
          {voicesLoaded && voices.length === 0 ? (
            <p className="text-sm text-pw-muted leading-relaxed">
              Your browser has limited voices. For the most natural voices, try Microsoft Edge or Google Chrome, or install enhanced voices in your device's speech settings.
            </p>
          ) : (
            <Select value={voiceName || 'best'} onValueChange={handleVoiceChange}>
              <SelectTrigger aria-label="Voice"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best available (recommended)</SelectItem>
                {voices.map((v) => (
                  <SelectItem key={v.name} value={v.name}>
                    <span className="flex items-center gap-2">
                      <span className="truncate">{v.name}</span>
                      {rankVoice(v) >= 3 && (
                        <span className="text-[10px] font-bold uppercase bg-pw-green-soft text-pw-green-ink rounded-full px-1.5 shrink-0">Natural</span>
                      )}
                      <span className="text-xs text-pw-muted">{v.lang}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-base font-bold">Speed</p>
            <span className="text-sm font-bold text-pw-navy tabular-nums bg-pw-soft rounded-full px-2.5 py-0.5">{rate.toFixed(2)}×</span>
          </div>
          <Slider
            value={[rate]}
            min={0.6}
            max={1.3}
            step={0.05}
            onValueChange={handleRateChange}
            aria-label="Speed"
          />
          <p className="text-sm text-pw-muted mt-2 leading-snug">
            Tip: practice at slower speeds first, then at 1.0× like the real interview.
          </p>
        </div>

        <PillButton
          className="w-full"
          onClick={playSample}
          disabled={playingSample}
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          {playingSample ? 'Playing…' : 'Play sample'}
        </PillButton>
      </PopoverContent>
    </Popover>
  );
}