import React from 'react';

// The navy banner on top of a screen (Pathways + Amio style guide): it says
// WHAT this is: the title, where you are, stars, progress. Slots:
// `left` (e.g. a 44px close or back button), `right` (e.g. <StarsPill>),
// `extra` (a row under the title: <StepBar>, a goal bar, chips).
export default function NavyBanner({
  as: Tag = 'header',
  title,
  subtitle,
  left,
  right,
  extra,
  titleAs: Title = 'h1',
  className = '',
  children,
  ...props
}) {
  return (
    <Tag className={`bg-navy text-white px-5 pt-6 pb-4 flex flex-col gap-3 ${className}`} {...props}>
      <div className="flex items-center gap-2">
        {left && <div className="shrink-0 -ms-2.5">{left}</div>}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {title && <Title className="text-title font-bold text-white break-words">{title}</Title>}
          {subtitle && <p className="text-small text-on-navy break-words">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {extra}
      {children}
    </Tag>
  );
}
