import React from 'react';
import { ViaMark } from '@/components/pathways/ui';

// The AI tutor is always Vía's V mark (docs/redesign/brand-spec.md), whatever
// name the learner gives it; old picture choices (`avatar`) are ignored. Show
// it once per screen (the tab bar, or the desktop Ask button); elsewhere the
// tutor signs in text ("— Vía"). `decorative` hides it from screen readers
// when the name is already next to it. `expression` is no longer used.
export default function TutorAvatar({ name = 'Vía', size = 56, className = '', decorative = false }) {
  return <ViaMark size={size} className={className} label={decorative ? undefined : `${name} · AI tutor`} />;
}
