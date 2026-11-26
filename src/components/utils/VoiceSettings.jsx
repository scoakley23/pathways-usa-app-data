import React, { useEffect, useState } from 'react';
import { Volume2, Play } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Button as PwButton } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage from '@/hooks/useAppLanguage';
import { SETTINGS_PIECE_LINES } from '@/components/shell/leftoverStrings';
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

  const [language] = useAppLanguage();
  const tr = useTranslatedLines(SETTINGS_PIECE_LINES, language, { cacheKey: 'settings_pieces_v1' });
  const t = (key) => (language !== 'en' && tr(key)) || SETTINGS_PIECE_LINES[key] || key;

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
        <Button variant="outline" className="gap-2 min-h-[44px] border-[1.5px] border-line bg-white text-navy font-semibold hover:border-navy hover:bg-white">
          <Volume2 className="w-4 h-4" aria-hidden="true" /> {t('voice')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 max-w-[calc(100vw-2rem)] space-y-5 rounded-card border-line bg-paper shadow-float p-5 text-navy">
        <div>
          <p className="text-base font-bold mb-2" dir="auto">{t('voice')}</p>
          {voicesLoaded && voices.length === 0 ? (
            <p className="text-small text-muted leading-relaxed" dir="auto">{t('voice_limited')}</p>
          ) : (
            <Select value={voiceName || 'best'} onValueChange={handleVoiceChange}>
              <SelectTrigger aria-label={t('voice')} className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="best">{t('voice_best')}</SelectItem>
                {voices.map((v) => (
                  <SelectItem key={v.name} value={v.name}>
                    <span className="flex items-center gap-2">
                      <span className="truncate">{v.name}</span>
                      {rankVoice(v) >= 3 && (
                        <span className="text-small font-bold bg-correct-bg text-correct rounded-button px-1.5 shrink-0">{t('voice_natural')}</span>
                      )}
                      <span className="text-xs text-muted">{v.lang}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-base font-bold" dir="auto">{t('speed')}</p>
            <span className="text-small font-bold text-navy tabular-nums bg-white border border-line rounded-button px-2.5 py-0.5">{rate.toFixed(2)}×</span>
          </div>
          <Slider
            value={[rate]}
            min={0.6}
            max={1.3}
            step={0.05}
            onValueChange={handleRateChange}
            aria-label={t('speed')}
          />
          <p className="text-small text-muted mt-2 leading-snug" dir="auto">{t('speed_tip')}</p>
        </div>

        <PwButton variant="second" className="w-full" onClick={playSample} disabled={playingSample}>
          <Play className="w-4 h-4" aria-hidden="true" />
          {playingSample ? t('playing') : t('play_sample')}
        </PwButton>
      </PopoverContent>
    </Popover>
  );
}