import React, { useState } from 'react';
import { Navigation, Phone, Globe } from 'lucide-react';
import { Tag } from '@/components/pathways/ui';
import {
  categoryById, placeServices, formatDistance, fullAddress, directionsUrl, telHref, safeWebsite, safeLogoUrl, isPoBoxOnly,
} from '@/lib/resourceHub';

// Text colors use ! so Leaflet's popup link color can't override them.
const LINK_BTN =
  'min-h-[44px] rounded-2xl font-bold inline-flex items-center justify-center gap-2 px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2';

// One tag per service the place offers, main category first.
export function ServiceTags({ r }) {
  return (
    <div className="flex flex-wrap gap-2">
      {placeServices(r).map((s) => {
        const c = categoryById(s);
        return <Tag key={s} tone={c.tone}>{c.label}</Tag>;
      })}
    </div>
  );
}

export function PlaceActions({ r }) {
  const tel = telHref(r.phone);
  const site = safeWebsite(r.website);
  return (
    <div className="flex flex-wrap gap-2">
      {!isPoBoxOnly(r.address) && (
        <a href={directionsUrl(r)} target="_blank" rel="noopener noreferrer" className={`${LINK_BTN} bg-pw-navy !text-white hover:bg-pw-navy-deep`}>
          <Navigation className="w-5 h-5" aria-hidden="true" /> Directions
        </a>
      )}
      {tel && (
        <a href={tel} className={`${LINK_BTN} bg-white !text-pw-navy border-2 border-pw-navy hover:bg-pw-soft`}>
          <Phone className="w-5 h-5" aria-hidden="true" /> Call
        </a>
      )}
      {site && (
        <a href={site} target="_blank" rel="noopener noreferrer" className={`${LINK_BTN} bg-white !text-pw-navy border-2 border-pw-navy hover:bg-pw-soft`}>
          <Globe className="w-5 h-5" aria-hidden="true" /> Website
        </a>
      )}
    </div>
  );
}

// The place's own logo (e.g. from the National Literacy Directory). Only
// loaded when a learner opens a place's summary; sends no referrer.
function Logo({ r }) {
  const [failed, setFailed] = useState(false);
  const src = safeLogoUrl(r.logo_url);
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-12 w-auto max-w-[140px] object-contain rounded-lg bg-white"
    />
  );
}

// Summary shown when a learner taps a pin on the map.
export function PlaceSummary({ r }) {
  return (
    <div className="space-y-2 font-sans text-pw-navy min-w-[220px] max-w-[260px]">
      <div className="flex items-start justify-between gap-3">
        <Logo r={r} />
        <span className="text-sm font-bold text-pw-muted whitespace-nowrap">{formatDistance(r.distance)}</span>
      </div>
      <p className="text-base font-extrabold leading-snug !m-0">{r.name}</p>
      <ServiceTags r={r} />
      {fullAddress(r) && <p className="text-sm !m-0">{fullAddress(r)}</p>}
      {r.hours && <p className="text-sm text-pw-muted !m-0">Hours: {r.hours}</p>}
      <PlaceActions r={r} />
    </div>
  );
}
