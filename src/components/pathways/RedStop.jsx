import React from 'react';

// A celebration headline (Lesson done, Done for today, Unit complete) with its
// last punctuation mark in Amio red: "Red means Amio or a celebration."
// Works on translated text: the final . ! 。 ！ ? ؟ … (or a run of them) is
// coloured; anything else is shown as it is. Red is decoration here, never
// the only way something is said.
const END = /([.!?。！？؟۔…]+)(\s*)$/u;

export function splitStop(text = '') {
  const s = String(text);
  const m = END.exec(s);
  if (!m) return [s, ''];
  return [s.slice(0, m.index), m[1]];
}

export default function RedStop({ children }) {
  const [body, stop] = splitStop(children);
  if (!stop) return <>{body}</>;
  return <>{body}<span className="text-amio-red">{stop}</span></>;
}
