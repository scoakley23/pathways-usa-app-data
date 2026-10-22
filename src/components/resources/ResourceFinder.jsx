import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crosshair, Loader2, MapPin, Map as MapIcon, List, AlertTriangle, ExternalLink, Maximize2, X, ChevronUp } from 'lucide-react';
import { listAllResources } from '@/components/resources/listAllResources';
import { Input } from '@/components/ui/input';
import { PrimaryButton, SecondaryButton, RaisedCard } from '@/components/pathways/ui';
import {
  RESOURCE_CATEGORIES, COST_LABELS, DIRECTORY_LINKS, PIN_COLORS, nearestResources, formatDistance, fullAddress, categoryById,
  normalizeZip, zipToLatLng, loadZipTable,
} from '@/lib/resourceHub';
import { ServiceTags, PlaceActions, PlaceSummary } from '@/components/resources/PlaceSummary';

const ResourceMap = lazy(() => import('@/components/resources/ResourceMap'));

const RADIUS_OPTIONS = [10, 25, 50, 100];
const LIST_STEP = 30; // list cards shown at a time; the map shows every place
const MAP_LIMIT = 2000;

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
  const [fullscreen, setFullscreen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listCount, setListCount] = useState(LIST_STEP);

  const { data: resources = [], isLoading, isError } = useQuery({
    queryKey: ['communityResources'],
    queryFn: listAllResources,
    staleTime: 30 * 60 * 1000,
  });

  const results = useMemo(
    () => nearestResources(resources, origin, { categories, radiusMiles: radius, limit: MAP_LIMIT }),
    [resources, origin, categories, radius],
  );
  const selected = results.find((r) => r.id === selectedId) || null;

  // A new search starts the list from the top.
  useEffect(() => { setListCount(LIST_STEP); }, [origin, categories, radius]);

  // Full screen: stop the page behind from scrolling; Escape closes it.
  useEffect(() => {
    if (!fullscreen) return undefined;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener('keydown', onKey);
      setSheetOpen(false);
    };
  }, [fullscreen]);

  // "Search this area": the map's center, kept on the device like a ZIP.
  const searchArea = (center) => {
    setOrigin({ ...center, label: 'this map area', fromMap: true });
    setSelectedId(null);
  };

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



  return (
    <div className="space-y-4">
      <RaisedCard className="space-y-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-pw-blue-soft text-pw-blue-ink shrink-0">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-[28px] leading-snug font-display font-normal text-pw-navy">Find help near you</h2>
        </div>
        <p className="text-base text-pw-navy leading-relaxed">
          Free legal help, English and citizenship classes, and USCIS offices. Your location is used only on this
          screen to sort places by distance. It is not saved or shared.
        </p>
        <p className="text-base text-pw-muted leading-relaxed">
          Where these places come from: the U.S. Department of Justice list of recognized legal-help organizations,
          the National Literacy Directory, and the list of USCIS field offices. A person checks each place before it
          is added.
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
                  className={`min-h-[44px] rounded-full px-4 text-base font-semibold border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2
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
              <strong>{results.length}</strong> {results.length === 1 ? 'place' : 'places'} within {radius} miles of {origin.label}
            </p>
            {(results.length > 0 || origin.fromMap) && (
              <SecondaryButton onClick={() => setShowMap((v) => !v)} aria-pressed={showMap}>
                {showMap ? <List className="w-5 h-5" aria-hidden="true" /> : <MapIcon className="w-5 h-5" aria-hidden="true" />}
                {showMap ? 'Hide map' : 'Show map'}
              </SecondaryButton>
            )}
          </div>

          {showMap && (results.length > 0 || origin.fromMap) && (
            <>
              <div
                className={fullscreen
                  ? 'fixed inset-0 !mt-0 z-[70] bg-white flex flex-col'
                  : 'relative h-[380px] sm:h-[440px] rounded-[14px] overflow-hidden border border-pw-line shadow-raised bg-pw-soft isolate'}
                role={fullscreen ? 'dialog' : undefined}
                aria-modal={fullscreen ? 'true' : undefined}
                aria-label={fullscreen ? 'Map of places near you' : undefined}
              >
                {fullscreen && (
                  <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-pw-line bg-white">
                    <p className="text-base font-bold text-pw-navy truncate">{results.length} places · {origin.label}</p>
                    <SecondaryButton onClick={() => setFullscreen(false)} aria-label="Close full-screen map">
                      <X className="w-5 h-5" aria-hidden="true" /> Close
                    </SecondaryButton>
                  </div>
                )}
                <div className="relative flex-1 h-full min-h-0 isolate">
                  <Suspense fallback={<div className="h-full grid place-items-center text-pw-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                    <ResourceMap
                      origin={origin}
                      places={results}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onSearchArea={searchArea}
                      fullscreen={fullscreen}
                    />
                  </Suspense>
                  {!fullscreen && (
                    <button
                      type="button"
                      onClick={() => setFullscreen(true)}
                      aria-label="Open the map full screen"
                      className="absolute bottom-3 right-3 z-[1000] w-11 h-11 rounded-xl bg-white border border-pw-line shadow-raised grid place-items-center text-pw-navy hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
                    >
                      <Maximize2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  )}
                  {selected && (
                    <div className={`absolute inset-x-2 z-[1000] ${fullscreen ? (sheetOpen ? 'hidden' : 'bottom-16') : 'bottom-2'}`}>
                      <div className="relative rounded-2xl bg-white border border-pw-line shadow-lift p-3 pr-12 max-h-[70%] overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedId(null)}
                          aria-label="Close summary"
                          className="absolute top-1 right-1 w-11 h-11 grid place-items-center rounded-xl text-pw-muted hover:bg-pw-soft"
                        >
                          <X className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <PlaceSummary r={selected} />
                      </div>
                    </div>
                  )}
                </div>
                {fullscreen && (
                  <ListSheet
                    places={results}
                    open={sheetOpen}
                    onToggle={setSheetOpen}
                    onPick={(id) => { setSelectedId(id); setSheetOpen(false); }}
                  />
                )}
              </div>
              <MapLegend places={results} />
            </>
          )}

          {results.length === 0 ? (
            <RaisedCard className="space-y-2">
              <p className="text-base font-bold text-pw-navy">No places found here yet.</p>
              <p className="text-base text-pw-muted">
                Try a bigger distance, more categories, or move the map and search that area. You can also search the
                national directories below.
              </p>
            </RaisedCard>
          ) : (
            <>
              <ul className="space-y-3">
                {results.slice(0, listCount).map((r) => (
                  <ResourceCard key={r.id} r={r} selected={r.id === selectedId} onSelect={() => setSelectedId(r.id)} />
                ))}
              </ul>
              {results.length > listCount && (
                <SecondaryButton className="w-full" onClick={() => setListCount((n) => n + LIST_STEP)}>
                  Show more ({results.length - listCount} more)
                </SecondaryButton>
              )}
            </>
          )}
        </div>
      )}

      <RaisedCard className="space-y-3 md:p-6">
        <h2 className="text-[28px] leading-snug font-display font-normal text-pw-navy">Search national directories</h2>
        <p className="text-base text-pw-muted">Our map doesn&apos;t list every place yet. These sites have more.</p>
        <ul className="space-y-2">
          {DIRECTORY_LINKS.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-2xl bg-pw-soft p-4 min-h-[44px] text-pw-navy hover:bg-pw-soft-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
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

      <div className="rounded-[14px] bg-pw-red-soft p-4 sm:p-5 flex items-start gap-3">
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
  const address = fullAddress(r);
  return (
    <li id={`resource-${r.id}`} className="scroll-mt-24">
      <RaisedCard
        padding="p-4 sm:p-5"
        className={`space-y-3 ${selected ? 'ring-2 ring-pw-navy' : ''}`}
        onClick={onSelect}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <ServiceTags r={r} />
          <span className="text-base font-bold text-pw-muted">{formatDistance(r.distance)}</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-pw-navy leading-snug">{r.name}</h3>
          {address && <p className="text-base text-pw-navy">{address}</p>}
          {r.location_precision === 'zip' && (
            <p className="text-sm text-pw-muted">Map pin shows the ZIP code area, not the exact building.</p>
          )}
          {r.description && <p className="text-base text-pw-muted leading-relaxed">{r.description}</p>}
          {r.hours && <p className="text-base text-pw-muted">Hours: {r.hours}</p>}
          {(r.languages?.length > 0 || COST_LABELS[r.cost]) && (
            <p className="text-base text-pw-muted">
              {[COST_LABELS[r.cost], r.languages?.length ? `Languages: ${r.languages.join(', ')}` : ''].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <PlaceActions r={r} />
        {r.last_verified && <p className="text-sm text-pw-muted">Last checked {r.last_verified}</p>}
      </RaisedCard>
    </li>
  );
}

// Which pin color means what, for the categories on the map right now.
function MapLegend({ places }) {
  const shown = [...new Set(places.map((p) => p.category))];
  if (!shown.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 px-1" aria-label="Map key">
      {RESOURCE_CATEGORIES.filter((c) => shown.includes(c.id)).map((c) => (
        <li key={c.id} className="flex items-center gap-2 text-sm text-pw-muted">
          <span className="w-3 h-3 rounded-full border-2 border-white shadow-raised" style={{ background: PIN_COLORS[c.id] }} aria-hidden="true" />
          {c.label}
        </li>
      ))}
      <li className="flex items-center gap-2 text-sm text-pw-muted">
        <span className="w-4 h-4 rounded-full bg-pw-navy text-white text-[9px] font-extrabold grid place-items-center" aria-hidden="true">3</span>
        Group of places (tap to zoom)
      </li>
    </ul>
  );
}

// Full-screen map's list: a panel at the bottom that opens with a tap or an
// upward swipe, and closes with a downward swipe.
function ListSheet({ places, open, onToggle, onPick }) {
  const [startY, setStartY] = useState(null);
  const [count, setCount] = useState(LIST_STEP);
  const onTouchEnd = (e) => {
    if (startY == null) return;
    const dy = e.changedTouches[0].clientY - startY;
    if (dy < -40) onToggle(true);
    if (dy > 40) onToggle(false);
    setStartY(null);
  };
  return (
    <div
      className={`border-t border-pw-line bg-white shadow-lift rounded-t-3xl flex flex-col ${open ? 'h-[60vh]' : ''} pb-[env(safe-area-inset-bottom)]`}
      onTouchStart={(e) => setStartY(e.touches[0].clientY)}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        className="w-full min-h-[52px] flex flex-col items-center justify-center gap-1 text-base font-bold text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pw-navy rounded-t-3xl"
      >
        <span className="w-10 h-1.5 rounded-full bg-pw-line" aria-hidden="true" />
        <span className="flex items-center gap-2">
          <ChevronUp className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          {open ? 'Hide list' : `Show list (${places.length})`}
        </span>
      </button>
      {open && (
        <ul className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {places.slice(0, count).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p.id)}
                className="w-full text-left rounded-2xl border border-pw-line p-3 min-h-[44px] hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-pw-navy leading-snug">{p.name}</span>
                    <span className="flex items-center gap-2 text-sm text-pw-muted mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIN_COLORS[p.category] }} aria-hidden="true" />
                      {categoryById(p.category).label}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-pw-muted whitespace-nowrap">{formatDistance(p.distance)}</span>
                </span>
              </button>
            </li>
          ))}
          {places.length > count && (
            <li>
              <SecondaryButton className="w-full" onClick={() => setCount((n) => n + LIST_STEP)}>
                Show more ({places.length - count} more)
              </SecondaryButton>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
