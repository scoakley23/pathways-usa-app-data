import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crosshair, Loader2, MapPin, Navigation, Phone, Globe, Map as MapIcon, List, AlertTriangle, ExternalLink } from 'lucide-react';
import { listAllResources } from '@/components/resources/listAllResources';
import { Input } from '@/components/ui/input';
import { PrimaryButton, SecondaryButton, RaisedCard, Tag } from '@/components/pathways/ui';
import {
  RESOURCE_CATEGORIES, COST_LABELS, DIRECTORY_LINKS, categoryById, nearestResources, formatDistance, fullAddress,
  directionsUrl, telHref, safeWebsite, normalizeZip, zipToLatLng, loadZipTable, isPoBoxOnly,
} from '@/lib/resourceHub';

const ResourceMap = lazy(() => import('@/components/resources/ResourceMap'));

const RADIUS_OPTIONS = [10, 25, 50, 100];
const LINK_BTN =
  'min-h-[44px] rounded-2xl font-bold inline-flex items-center justify-center gap-2 px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2';

// "Help near you": the learner shares their location (browser permission) or
// types a ZIP code. Either way the location stays in this component's memory
// only: it is not saved, not put in the URL, and not sent to the AI or to
// Base44. Places are filtered and sorted by distance on the device.
export default function ResourceFinder() {
  const [origin, setOrigin] = useState(null); // { lat, lng, label }
  const [zipInput, setZipInput] = useState('');
  const [status, setStatus] = useState({ busy: false, error: '' });
  const [categories, setCategories] = useState(() => RESOURCE_CATEGORIES.map((c) => c.id));
  const [radius, setRadius] = useState(25);
  const [selectedId, setSelectedId] = useState(null);
  const [showMap, setShowMap] = useState(true);

  const { data: resources = [], isLoading, isError } = useQuery({
    queryKey: ['communityResources'],
    queryFn: listAllResources,
    staleTime: 30 * 60 * 1000,
  });

  const results = useMemo(
    () => nearestResources(resources, origin, { categories, radiusMiles: radius, limit: 30 }),
    [resources, origin, categories, radius],
  );

  const locateMe = () => {
    if (!navigator.geolocation) {
      setStatus({ busy: false, error: "Your browser can't share your location. Type your ZIP code instead." });
      return;
    }
    setStatus({ busy: true, error: '' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'your location' });
        setSelectedId(null);
        setStatus({ busy: false, error: '' });
      },
      () => setStatus({ busy: false, error: "We couldn't get your location. You can type your ZIP code instead." }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const searchZip = async (e) => {
    e.preventDefault();
    const zip = normalizeZip(zipInput);
    if (zip.length !== 5 || zipInput.replace(/\D/g, '').length < 5) {
      setStatus({ busy: false, error: 'Please type a 5-digit ZIP code.' });
      return;
    }
    setStatus({ busy: true, error: '' });
    try {
      const point = zipToLatLng(zip, await loadZipTable());
      if (!point) {
        setStatus({ busy: false, error: "We don't know that ZIP code. Please check it, or try a nearby one." });
        return;
      }
      setOrigin({ ...point, label: `ZIP ${zip}` });
      setSelectedId(null);
      setStatus({ busy: false, error: '' });
    } catch {
      setStatus({ busy: false, error: 'Something went wrong. Please try again.' });
    }
  };

  const toggleCategory = (id) =>
    setCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const selectPlace = (id) => {
    setSelectedId(id);
    document.getElementById(`resource-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="space-y-4">
      <RaisedCard className="space-y-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-pw-blue-soft text-pw-blue-ink shrink-0">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-[22px] leading-snug font-extrabold text-pw-navy">Find help near you</h2>
        </div>
        <p className="text-base text-pw-navy leading-relaxed">
          Free legal help, English and citizenship classes, and USCIS offices. Your location is used only on this
          screen to sort places by distance. It is not saved or shared.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <PrimaryButton onClick={locateMe} disabled={status.busy} className="sm:shrink-0">
            {status.busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Crosshair className="w-5 h-5" aria-hidden="true" />}
            Use my location
          </PrimaryButton>
          <form onSubmit={searchZip} className="flex gap-2 flex-1" role="search" aria-label="Search by ZIP code">
            <label htmlFor="resource-zip" className="sr-only">ZIP code</label>
            <Input
              id="resource-zip"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              placeholder="or ZIP code"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              className="min-h-[44px] text-base flex-1 min-w-0"
            />
            <SecondaryButton type="submit" disabled={status.busy}>Search</SecondaryButton>
          </form>
        </div>
        {status.error && <p className="text-base font-semibold text-pw-red-ink" role="alert">{status.error}</p>}

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-pw-muted mb-2">Show</legend>
          <div className="flex flex-wrap gap-2">
            {RESOURCE_CATEGORIES.map((c) => {
              const on = categories.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCategory(c.id)}
                  className={`min-h-[44px] rounded-full px-4 text-base font-semibold border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2
                    ${on ? 'bg-pw-navy border-pw-navy text-white hover:bg-pw-navy-deep' : 'bg-white border-pw-line text-pw-navy hover:bg-pw-soft'}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="resource-radius" className="text-base font-bold text-pw-navy">Within</label>
          <select
            id="resource-radius"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="min-h-[44px] rounded-2xl border-2 border-pw-line bg-white px-3 text-base text-pw-navy focus-visible:outline-none focus-visible:border-pw-navy"
          >
            {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} miles</option>)}
          </select>
        </div>
      </RaisedCard>

      {isLoading && (
        <p className="flex items-center gap-2 text-base text-pw-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading places…</p>
      )}
      {isError && (
        <p className="text-base text-pw-red-ink font-semibold" role="alert">We couldn&apos;t load the list of places. Please try again later.</p>
      )}

      {origin && !isLoading && !isError && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base text-pw-navy" aria-live="polite">
              <strong>{results.length === 30 ? '30+' : results.length}</strong> {results.length === 1 ? 'place' : 'places'} within {radius} miles of {origin.label}
            </p>
            {results.length > 0 && (
              <SecondaryButton onClick={() => setShowMap((v) => !v)} aria-pressed={showMap}>
                {showMap ? <List className="w-5 h-5" aria-hidden="true" /> : <MapIcon className="w-5 h-5" aria-hidden="true" />}
                {showMap ? 'Hide map' : 'Show map'}
              </SecondaryButton>
            )}
          </div>

          {showMap && results.length > 0 && (
            <div className="h-[280px] sm:h-[380px] rounded-3xl overflow-hidden border border-pw-line shadow-raised bg-pw-soft isolate">
              <Suspense fallback={<div className="h-full grid place-items-center text-pw-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                <ResourceMap origin={origin} places={results} selectedId={selectedId} onSelect={selectPlace} />
              </Suspense>
            </div>
          )}

          {results.length === 0 ? (
            <RaisedCard className="space-y-2">
              <p className="text-base font-bold text-pw-navy">No places found nearby yet.</p>
              <p className="text-base text-pw-muted">
                Try a bigger distance or more categories. You can also search the national directories below.
              </p>
            </RaisedCard>
          ) : (
            <ul className="space-y-3">
              {results.map((r) => <ResourceCard key={r.id} r={r} selected={r.id === selectedId} onSelect={() => setSelectedId(r.id)} />)}
            </ul>
          )}
        </div>
      )}

      <RaisedCard className="space-y-3 md:p-6">
        <h2 className="text-[22px] leading-snug font-extrabold text-pw-navy">Search national directories</h2>
        <p className="text-base text-pw-muted">Our map doesn&apos;t list every place yet. These sites have more.</p>
        <ul className="space-y-2">
          {DIRECTORY_LINKS.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-2xl bg-pw-soft p-4 min-h-[44px] text-pw-navy hover:bg-pw-soft-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
              >
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-base font-bold group-hover:underline">{link.label}</span>
                  <span className="block text-base text-pw-muted">{link.description}</span>
                </span>
                <ExternalLink className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </RaisedCard>

      <div className="rounded-3xl bg-pw-red-soft p-4 sm:p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-pw-red-ink shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-base text-pw-navy leading-relaxed">
          Pathways USA does not run or endorse these places. Hours and services change, so call before you go. For
          legal advice, see only a lawyer or a DOJ-accredited representative, never a notario.
        </p>
      </div>
    </div>
  );
}

function ResourceCard({ r, selected, onSelect }) {
  const cat = categoryById(r.category);
  const address = fullAddress(r);
  const tel = telHref(r.phone);
  const site = safeWebsite(r.website);
  return (
    <li id={`resource-${r.id}`} className="scroll-mt-24">
      <RaisedCard
        padding="p-4 sm:p-5"
        className={`space-y-3 ${selected ? 'ring-2 ring-pw-red' : ''}`}
        onClick={onSelect}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tag tone={cat.tone}>{cat.label}</Tag>
          <span className="text-base font-bold text-pw-muted">{formatDistance(r.distance)}</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-pw-navy leading-snug">{r.name}</h3>
          {address && <p className="text-base text-pw-navy">{address}</p>}
          {r.location_precision === 'zip' && (
            <p className="text-sm text-pw-muted">Map pin shows the ZIP code area, not the exact building.</p>
          )}
          {r.description && <p className="text-base text-pw-muted leading-relaxed">{r.description}</p>}
          {(r.languages?.length > 0 || COST_LABELS[r.cost]) && (
            <p className="text-base text-pw-muted">
              {[COST_LABELS[r.cost], r.languages?.length ? `Languages: ${r.languages.join(', ')}` : ''].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isPoBoxOnly(r.address) && (
            <a href={directionsUrl(r)} target="_blank" rel="noopener noreferrer" className={`${LINK_BTN} bg-pw-navy text-white hover:bg-pw-navy-deep`}>
              <Navigation className="w-5 h-5" aria-hidden="true" /> Directions
            </a>
          )}
          {tel && (
            <a href={tel} className={`${LINK_BTN} bg-white text-pw-navy border-2 border-pw-navy hover:bg-pw-soft`}>
              <Phone className="w-5 h-5" aria-hidden="true" /> Call
            </a>
          )}
          {site && (
            <a href={site} target="_blank" rel="noopener noreferrer" className={`${LINK_BTN} bg-white text-pw-navy border-2 border-pw-navy hover:bg-pw-soft`}>
              <Globe className="w-5 h-5" aria-hidden="true" /> Website
            </a>
          )}
        </div>
        {r.last_verified && <p className="text-sm text-pw-muted">Last checked {r.last_verified}</p>}
      </RaisedCard>
    </li>
  );
}
