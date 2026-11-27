import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crosshair, Loader2, MapPin, Map as MapIcon, List, AlertTriangle, ExternalLink, Maximize2, X, ChevronUp, Bookmark } from 'lucide-react';
import { listAllResources } from '@/components/resources/listAllResources';
import { Input } from '@/components/ui/input';
import { PrimaryButton, SecondaryButton, RaisedCard } from '@/components/pathways/ui';
import {
  RESOURCE_CATEGORIES, DIRECTORY_LINKS, PIN_COLORS, nearestResources, fullAddress,
  normalizeZip, zipToLatLng, loadZipTable, savedResources, mappedResources, US_VIEW,
} from '@/lib/resourceHub';
import { ServiceTags, PlaceActions, PlaceSummary } from '@/components/resources/PlaceSummary';
import useSavedPlaces from '@/components/resources/useSavedPlaces';
import useResourceText from '@/components/resources/useResourceText';

const ResourceMap = lazy(() => import('@/components/resources/ResourceMap'));

const RADIUS_OPTIONS = [10, 25, 50, 100];
const LIST_STEP = 30; // list cards shown at a time; the map shows every place
const MAP_LIMIT = 2000;
const OVERVIEW_ORIGIN = { ...US_VIEW, overview: true };

// "Help near you": the learner shares their location (browser permission) or
// types a ZIP code. Either way the location stays in this component's memory
// only: it is not saved, not put in the URL, and not sent to the AI or to
// Base44. Places are filtered and sorted by distance on the device. Before
// that, the map opens on the whole country with every place on it (no
// location used), so learners see what this is without typing anything.
// Every line is translated (useResourceText); place data stays as it is.
export default function ResourceFinder() {
  const { t, category } = useResourceText();
  const [origin, setOrigin] = useState(null); // { lat, lng, fromMap? | you? | zip? }
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

  const overview = !origin; // no location yet: the whole country
  const mapOrigin = origin || OVERVIEW_ORIGIN;
  const results = useMemo(
    () => (origin
      ? nearestResources(resources, origin, { categories, radiusMiles: radius, limit: MAP_LIMIT })
      : mappedResources(resources, { categories })),
    [resources, origin, categories, radius],
  );
  const selected = results.find((r) => r.id === selectedId) || null;
  const { savedIds } = useSavedPlaces();
  const saved = useMemo(() => savedResources(resources, savedIds, origin), [resources, savedIds, origin]);

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
    setOrigin({ ...center, fromMap: true });
    setSelectedId(null);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setStatus({ busy: false, error: 'no_geo' });
      return;
    }
    setStatus({ busy: true, error: '' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, you: true });
        setSelectedId(null);
        setStatus({ busy: false, error: '' });
      },
      () => setStatus({ busy: false, error: 'geo_failed' }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const searchZip = async (e) => {
    e.preventDefault();
    const zip = normalizeZip(zipInput);
    if (zip.length !== 5 || zipInput.replace(/\D/g, '').length < 5) {
      setStatus({ busy: false, error: 'zip_invalid' });
      return;
    }
    setStatus({ busy: true, error: '' });
    try {
      const point = zipToLatLng(zip, await loadZipTable());
      if (!point) {
        setStatus({ busy: false, error: 'zip_unknown' });
        return;
      }
      setOrigin({ ...point, zip });
      setSelectedId(null);
      setStatus({ busy: false, error: '' });
    } catch {
      setStatus({ busy: false, error: 'went_wrong' });
    }
  };

  const toggleCategory = (id) =>
    setCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  // Where the search is centred, in words: the ZIP itself is never translated.
  const placeLabel = (o) => {
    if (!o || o.overview) return t('origin_us');
    if (o.fromMap) return t('origin_area');
    if (o.zip) return t('origin_zip', { zip: o.zip });
    return t('origin_you');
  };

  return (
    <div className="space-y-4">
      <RaisedCard className="space-y-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-tint text-navy shrink-0">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-[1.75rem] leading-snug font-display font-normal text-navy">{t('find_help')}</h2>
        </div>

        {isLoading && (
          <p className="flex items-center gap-2 text-base text-muted"><Loader2 className="w-5 h-5 animate-spin" /> {t('loading')}</p>
        )}
        {isError && (
          <p className="text-base text-not-yet font-semibold" role="alert">{t('load_error')}</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {overview ? (
                <p className="text-base text-navy" aria-live="polite">
                  {t(results.length === 1 ? 'overview_one' : 'overview_many', { count: results.length })}
                </p>
              ) : (
                <p className="text-base text-navy" aria-live="polite">
                  {t(results.length === 1 ? 'within_one' : 'within_many', { count: results.length, miles: radius, place: placeLabel(origin) })}
                </p>
              )}
              {(results.length > 0 || overview || origin.fromMap) && (
                <SecondaryButton onClick={() => setShowMap((v) => !v)} aria-pressed={showMap}>
                  {showMap ? <List className="w-5 h-5" aria-hidden="true" /> : <MapIcon className="w-5 h-5" aria-hidden="true" />}
                  {showMap ? t('hide_map') : t('show_map')}
                </SecondaryButton>
              )}
            </div>

            {showMap && (results.length > 0 || overview || origin.fromMap) && (
              <>
                <div
                  className={fullscreen
                    ? 'fixed inset-0 !mt-0 z-[70] bg-white flex flex-col'
                    : 'relative h-[380px] sm:h-[440px] rounded-card overflow-hidden border border-line shadow-raised bg-tint isolate'}
                  role={fullscreen ? 'dialog' : undefined}
                  aria-modal={fullscreen ? 'true' : undefined}
                  aria-label={fullscreen ? t('map_dialog') : undefined}
                >
                  {fullscreen && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-line bg-white">
                      <p className="text-base font-bold text-navy truncate">{t('fullscreen_title', { count: results.length, place: placeLabel(mapOrigin) })}</p>
                      <SecondaryButton onClick={() => setFullscreen(false)} aria-label={t('close_fullscreen')}>
                        <X className="w-5 h-5" aria-hidden="true" /> {t('close')}
                      </SecondaryButton>
                    </div>
                  )}
                  <div className="relative flex-1 h-full min-h-0 isolate">
                    <Suspense fallback={<div className="h-full grid place-items-center text-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                      <ResourceMap
                        origin={mapOrigin}
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
                        aria-label={t('open_fullscreen')}
                        className="absolute bottom-3 end-3 z-[1000] w-11 h-11 rounded-xl bg-white border border-line shadow-raised grid place-items-center text-navy hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                      >
                        <Maximize2 className="w-5 h-5" aria-hidden="true" />
                      </button>
                    )}
                    {selected && (
                      <div className={`absolute inset-x-2 z-[1000] ${fullscreen ? (sheetOpen ? 'hidden' : 'bottom-16') : 'bottom-2'}`}>
                        <div className="relative rounded-2xl bg-white border border-line shadow-lift p-3 pe-12 max-h-[70%] overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedId(null)}
                            aria-label={t('close_summary')}
                            className="absolute top-1 end-1 w-11 h-11 grid place-items-center rounded-xl text-muted hover:bg-tint"
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
          </div>
        )}

        <p className="text-base text-navy leading-relaxed">{t('intro')}</p>
        <p className="text-base text-muted leading-relaxed">{t('sources')}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <PrimaryButton onClick={locateMe} disabled={status.busy} className="sm:shrink-0">
            {status.busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Crosshair className="w-5 h-5" aria-hidden="true" />}
            {t('use_location')}
          </PrimaryButton>
          <form onSubmit={searchZip} className="flex gap-2 flex-1" role="search" aria-label={t('zip_search')}>
            <label htmlFor="resource-zip" className="sr-only">{t('zip_label')}</label>
            <Input
              id="resource-zip"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              placeholder={t('zip_placeholder')}
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              className="min-h-[44px] text-base flex-1 min-w-0"
            />
            <SecondaryButton type="submit" disabled={status.busy}>{t('search')}</SecondaryButton>
          </form>
        </div>
        {status.error && <p className="text-base font-semibold text-not-yet" role="alert">{t(status.error)}</p>}

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-muted mb-2">{t('show')}</legend>
          <div className="flex flex-wrap gap-2">
            {RESOURCE_CATEGORIES.map((c) => {
              const on = categories.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCategory(c.id)}
                  className={`min-h-[44px] rounded-button px-4 text-base font-semibold border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2
                    ${on ? 'bg-navy border-navy text-white hover:bg-navy-deep' : 'bg-white border-line text-navy hover:bg-tint'}`}
                >
                  {category(c.id)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="resource-radius" className="text-base font-bold text-navy">{t('within')}</label>
          <select
            id="resource-radius"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="min-h-[44px] rounded-2xl border-2 border-line bg-white px-3 text-base text-navy focus-visible:outline-none focus-visible:border-navy"
          >
            {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{t('miles', { miles: r })}</option>)}
          </select>
        </div>
      </RaisedCard>


      {saved.length > 0 && <SavedPlaces places={saved} />}

      {!overview && !isLoading && !isError && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <RaisedCard className="space-y-2">
              <p className="text-base font-bold text-navy">{t('none_title')}</p>
              <p className="text-base text-muted">{t('none_body')}</p>
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
                  {t('show_more', { count: results.length - listCount })}
                </SecondaryButton>
              )}
            </>
          )}
        </div>
      )}

      <RaisedCard className="space-y-3 md:p-6">
        <h2 className="text-[1.75rem] leading-snug font-display font-normal text-navy">{t('directories_title')}</h2>
        <p className="text-base text-muted">{t('directories_sub')}</p>
        <ul className="space-y-2">
          {DIRECTORY_LINKS.map((link, i) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-2xl bg-tint p-4 min-h-[44px] text-navy hover:bg-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-base font-bold group-hover:underline">{link.label}</span>
                  <span className="block text-base text-muted">{t(`dir_${i}`)}</span>
                </span>
                <ExternalLink className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </RaisedCard>

      <div className="rounded-card bg-not-yet-bg p-4 sm:p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-not-yet shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-base text-navy leading-relaxed">{t('disclaimer')}</p>
      </div>
    </div>
  );
}

// The learner's saved places, from their account. Shown whether or not they
// have searched; with a search they come nearest first.
function SavedPlaces({ places }) {
  const { t } = useResourceText();
  const [open, setOpen] = useState(true);
  return (
    <RaisedCard className="space-y-3 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-tint text-navy shrink-0">
            <Bookmark className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-[1.75rem] leading-snug font-display font-normal text-navy">{t('saved_title')}</h2>
        </div>
        <SecondaryButton onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="saved-places-list">
          {open ? t('hide') : t('show_count', { count: places.length })}
        </SecondaryButton>
      </div>
      {open && (
        <ul id="saved-places-list" className="space-y-3">
          {places.map((r) => <ResourceCard key={r.id} r={r} idPrefix="saved" />)}
        </ul>
      )}
    </RaisedCard>
  );
}

function ResourceCard({ r, selected, onSelect, idPrefix = 'resource' }) {
  const { t, cost, distance } = useResourceText();
  const address = fullAddress(r);
  return (
    <li id={`${idPrefix}-${r.id}`} className="scroll-mt-24">
      <RaisedCard
        padding="p-4 sm:p-5"
        className={`space-y-3 ${selected ? 'ring-2 ring-navy' : ''}`}
        onClick={onSelect}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <ServiceTags r={r} />
          <span className="text-base font-bold text-muted">{distance(r.distance)}</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-navy leading-snug">{r.name}</h3>
          {address && <p className="text-base text-navy">{address}</p>}
          {r.location_precision === 'zip' && (
            <p className="text-sm text-muted">{t('zip_area_pin')}</p>
          )}
          {r.description && <p className="text-base text-muted leading-relaxed">{r.description}</p>}
          {r.hours && <p className="text-base text-muted">{t('hours', { hours: r.hours })}</p>}
          {(r.languages?.length > 0 || cost(r.cost)) && (
            <p className="text-base text-muted">
              {[cost(r.cost), r.languages?.length ? t('languages', { languages: r.languages.join(', ') }) : ''].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <PlaceActions r={r} />
        {r.last_verified && <p className="text-sm text-muted">{t('last_checked', { date: r.last_verified })}</p>}
      </RaisedCard>
    </li>
  );
}

// Which pin color means what, for the categories on the map right now.
function MapLegend({ places }) {
  const { t, category } = useResourceText();
  const shown = [...new Set(places.map((p) => p.category))];
  if (!shown.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 px-1" aria-label={t('map_key')}>
      {RESOURCE_CATEGORIES.filter((c) => shown.includes(c.id)).map((c) => (
        <li key={c.id} className="flex items-center gap-2 text-sm text-muted">
          <span className="w-3 h-3 rounded-full border-2 border-white shadow-raised" style={{ background: PIN_COLORS[c.id] }} aria-hidden="true" />
          {category(c.id)}
        </li>
      ))}
      <li className="flex items-center gap-2 text-sm text-muted">
        <span className="w-4 h-4 rounded-full bg-navy text-white text-[0.5625rem] font-extrabold grid place-items-center" aria-hidden="true">3</span>
        {t('group_key')}
      </li>
    </ul>
  );
}

// Full-screen map's list: a panel at the bottom that opens with a tap or an
// upward swipe, and closes with a downward swipe.
function ListSheet({ places, open, onToggle, onPick }) {
  const { t, category, distance } = useResourceText();
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
      className={`border-t border-line bg-white shadow-lift rounded-t-3xl flex flex-col ${open ? 'h-[60vh]' : ''} pb-[env(safe-area-inset-bottom)]`}
      onTouchStart={(e) => setStartY(e.touches[0].clientY)}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        className="w-full min-h-[52px] flex flex-col items-center justify-center gap-1 text-base font-bold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy rounded-t-3xl"
      >
        <span className="w-10 h-1.5 rounded-full bg-line" aria-hidden="true" />
        <span className="flex items-center gap-2">
          <ChevronUp className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          {open ? t('hide_list') : t('show_list', { count: places.length })}
        </span>
      </button>
      {open && (
        <ul className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {places.slice(0, count).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p.id)}
                className="w-full text-left rounded-2xl border border-line p-3 min-h-[44px] hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-navy leading-snug">{p.name}</span>
                    <span className="flex items-center gap-2 text-sm text-muted mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIN_COLORS[p.category] }} aria-hidden="true" />
                      {category(p.category)}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-muted whitespace-nowrap">{distance(p.distance)}</span>
                </span>
              </button>
            </li>
          ))}
          {places.length > count && (
            <li>
              <SecondaryButton className="w-full" onClick={() => setCount((n) => n + LIST_STEP)}>
                {t('show_more', { count: places.length - count })}
              </SecondaryButton>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
