import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
import { CUSTOM_AVATAR, SUGGESTED_TUTOR_NAMES } from '@/lib/tutorPersona';
import { TUTOR_PHOTO_EVENT, loadTutorPhoto, resizePhoto, saveTutorPhoto } from '@/lib/tutorPhoto';

const tile = (selected) => `rounded-3xl border-2 p-2 grid place-items-center transition-colors focus-within:ring-2 focus-within:ring-pw-red focus-within:ring-offset-2 ${
  selected ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy/50'
}`;

const DEFAULT_PHOTO_LABELS = {
  add: 'Use my own photo',
  change: 'Change my photo',
  note: 'Your photo stays on this phone. It is not uploaded.',
  error: 'That picture did not work. Please try another one.',
};

// The "my own photo" tile for the tutor picture grid. The photo is cropped,
// shrunk, and kept on this device only; `onPick` runs once it is saved (or
// when the learner taps a photo they already added).
export function CustomPhotoTile({ selected, onPick, size = 88, labels = DEFAULT_PHOTO_LABELS }) {
  const inputRef = useRef(null);
  const [photo, setPhoto] = useState(loadTutorPhoto);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const update = () => setPhoto(loadTutorPhoto());
    window.addEventListener(TUTOR_PHOTO_EVENT, update);
    return () => window.removeEventListener(TUTOR_PHOTO_EVENT, update);
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(false);
    try {
      const dataUrl = await resizePhoto(file);
      if (!saveTutorPhoto(dataUrl)) throw new Error('not saved');
      onPick();
    } catch (err) {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
      {photo ? (
        <button type="button" aria-pressed={selected} onClick={onPick} className={`${tile(selected)} focus-visible:outline-none`}>
          <TutorAvatar avatar={CUSTOM_AVATAR} size={size} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${tile(false)} focus-visible:outline-none min-h-[88px] text-pw-navy`}
        >
          <span className="flex flex-col items-center gap-1 text-center text-sm font-bold">
            {busy ? <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" /> : <Camera className="w-7 h-7" aria-hidden="true" />}
            {labels.add}
          </span>
        </button>
      )}
      <div className="col-span-full space-y-1">
        {photo && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-2xl px-3 -ml-3 text-base font-bold text-pw-navy hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Camera className="w-5 h-5" aria-hidden="true" />} {labels.change}
          </button>
        )}
        <p className="text-sm text-pw-muted">{labels.note}</p>
        {error && <p role="alert" className="text-base font-bold text-pw-red-ink">{labels.error}</p>}
      </div>
    </>
  );
}

// One-tap name ideas; the learner can still type any name.
export function NameSuggestions({ value, onPick, label = 'Name ideas' }) {
  const current = (value || '').trim().toLowerCase();
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {SUGGESTED_TUTOR_NAMES.map((n) => {
        const selected = current === n.toLowerCase();
        return (
          <button
            key={n}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(n)}
            className={`min-h-[44px] rounded-full border-2 px-4 text-base font-bold inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 ${
              selected ? 'border-pw-navy bg-pw-navy text-white' : 'border-pw-line bg-white text-pw-navy hover:border-pw-navy/50'
            }`}
          >
            {selected && <Check className="w-4 h-4" aria-hidden="true" />} {n}
          </button>
        );
      })}
    </div>
  );
}
