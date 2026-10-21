import React from 'react';

// Six tutor portraits (a1 is Vía, the default), each with four expressions.
// Adults of varied ages, hair, and skin tones in navy, with a small Pathways
// pin; no cartoon features, uniforms, or government imagery. Images are in
// src/assets/tutors as `{id}-{expression}-{160|384}.webp`, cropped to the
// portrait circle.
const IMAGES = import.meta.glob('../../assets/tutors/*.webp', { eager: true, import: 'default', query: '?no-inline' });

export const TUTOR_EXPRESSIONS = ['default', 'greeting', 'listening', 'proud'];

const AVATARS = {
  a1: 'Tutor portrait: woman with dark wavy shoulder-length hair',
  a2: 'Tutor portrait: young man with short dark hair',
  a3: 'Tutor portrait: older man with gray hair and a beard',
  a4: 'Tutor portrait: woman with curly hair',
  a5: 'Tutor portrait: woman with her hair in a bun',
  a6: 'Tutor portrait: older woman with gray hair and glasses',
};

function imageFor(avatar, expression, size) {
  const id = AVATARS[avatar] ? avatar : 'a1';
  const expr = TUTOR_EXPRESSIONS.includes(expression) ? expression : 'default';
  const px = size > 64 ? 384 : 160;
  return IMAGES[`../../assets/tutors/${id}-${expr}-${px}.webp`];
}

// `expression`: 'greeting' (hello, welcome), 'listening' (thinking or
// waiting for the learner), 'proud' (a correct answer, a finished day), or
// 'default'. `decorative` hides the portrait from screen readers when the
// tutor's name is already in the text next to it.
export default function TutorAvatar({ avatar = 'a1', size = 56, className = '', decorative = false, expression = 'default' }) {
  return (
    <img
      src={imageFor(avatar, expression, size)}
      width={size}
      height={size}
      alt={decorative ? '' : AVATARS[avatar] || AVATARS.a1}
      draggable={false}
      className={`rounded-full shrink-0 bg-pw-blue-soft object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
