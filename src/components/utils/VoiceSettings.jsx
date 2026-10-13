import React, { useEffect, useState } from 'react';
import { Volume2, Play } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
        <Button variant="outline" className="gap-2 rounded-full">
          <Volume2 className="w-4 h-4" /> Voice
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 max-w-[calc(100vw-2rem)] space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-1.5">Voice</p>
          {voicesLoaded && voices.length === 0 ? (
            <p className="text-xs text-slate-500 leading-relaxed">
              Your browser has limited voices. For the most natural voices, try Microsoft Edge or Google Chrome, or install enhanced voices in your device's speech settings.
            </p>
          ) : (
            <Select value={voiceName || 'best'} onValueChange={handleVoiceChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best available (recommended)</SelectItem>
                {voices.map((v) => (
                  <SelectItem key={v.name} value={v.name}>
                    <span className="flex items-center gap-2">
                      <span className="truncate">{v.name}</span>
                      {rankVoice(v) >= 3 && (
                        <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 rounded px-1 shrink-0">Natural</span>
                      )}
                      <span className="text-xs text-slate-400">{v.lang}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800">Speed</p>
            <span className="text-sm font-medium text-slate-600 tabular-nums">{rate.toFixed(2)}×</span>
          </div>
          <Slider
            value={[rate]}
            min={0.6}
            max={1.3}
            step={0.05}
            onValueChange={handleRateChange}
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Tip: practice at slower speeds first, then at 1.0× like the real interview.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={playSample}
          disabled={playingSample}
        >
          <Play className="w-4 h-4" />
          {playingSample ? 'Playing…' : 'Play sample'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}