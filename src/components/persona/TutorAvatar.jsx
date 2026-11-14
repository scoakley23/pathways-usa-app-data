import React from 'react';
import { Amio } from '@/components/pathways/Amio';
import { TUTOR_NAME } from '@/lib/tutorPersona';

// The AI tutor is always Amio (docs/redesign/amio-style-guide.md); old
// picture choices (`avatar`) and old saved names are ignored. Elsewhere the
// tutor signs in text ("— Amio"). `decorative` hides it from screen readers
// when the name is already next to it. `mood`: one of Amio's moods.
export default function TutorAvatar({ mood = 'happy', size = 56, onNavy = false, className = '', decorative = false }) {
  return <Amio mood={mood} size={size} onNavy={onNavy} className={className} title={decorative ? undefined : `${TUTOR_NAME} · AI tutor`} />;
}
