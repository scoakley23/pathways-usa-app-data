import { useCallback, useEffect, useState } from 'react';
import { TEXT_SIZES, getTextSize, saveTextSize } from '@/lib/textSize';

const EVENT = 'pathways-text-size';

// Learner's text size for tutor screens (saved on this device).
export default function useTextSize() {
  const [size, setSize] = useState(getTextSize);

  useEffect(() => {
    const onChange = () => setSize(getTextSize());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const changeSize = useCallback((next) => {
    saveTextSize(next);
    setSize(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { size, className: TEXT_SIZES[size].className, changeSize };
}
