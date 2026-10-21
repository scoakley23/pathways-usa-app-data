import React, { useState } from 'react';

export default function OfficialPhoto({ photoUrl, name, size = 'md' }) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const bgColors = [
    'bg-pw-blue-soft text-pw-blue-ink',
    'bg-pw-red-soft text-pw-red-ink',
    'bg-pw-green-soft text-pw-green-ink',
    'bg-pw-teal-soft text-pw-teal-ink',
    'bg-pw-soft text-pw-navy',
  ];

  const colorIndex = name ? name.charCodeAt(0) % bgColors.length : 0;
  const bgColor = bgColors[colorIndex];

  if (!photoUrl || imgError) {
    return (
      <div className={`${sizes[size]} rounded-full ${bgColor} flex items-center justify-center border-2 border-white shadow-raised`}>
        <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name || 'Official'}
      className={`${sizes[size]} rounded-full object-cover border-2 border-white bg-pw-soft shadow-raised`}
      onError={() => setImgError(true)}
    />
  );
}