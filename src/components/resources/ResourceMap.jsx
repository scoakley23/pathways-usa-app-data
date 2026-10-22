import React, { useEffect, useRef, useState } from 'react';
import L from '@/components/resources/leafletGlobal';
import 'leaflet.markercluster';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
// MapLibre draws the map in a web worker; Vite bundles it (with its shared
// code) and gives its address, since the bundler can't find it on its own.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { MapContainer, useMap, useMapEvents } from 'react-leaflet';
import { Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PIN_COLORS } from '@/lib/resourceHub';

// Map for the Resource Hub. Loaded lazily (React.lazy) so the map libraries
// are only downloaded on this page. The map picture comes from OpenFreeMap
// (free, no key; "Positron" light style), or from the USGS National Map on
// devices that can't draw it. Either service sees the map area being viewed
// (like any web map); the learner's location is not sent anywhere else and
// is not saved.

setWorkerUrl(maplibreWorkerUrl);

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const OPENFREEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const USGS_URL = 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}';
const USGS_ATTRIBUTION = 'Map: <a href="https://www.usgs.gov/programs/national-geospatial-program/national-map">USGS The National Map</a>';

function canDrawVectorMaps() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Light street map; falls back to the (paler) USGS map if the light map
// can't be drawn or doesn't load.
function BaseLayer() {
  const map = useMap();
  useEffect(() => {
    let layer;
    let timer;
    const showUsgsMap = () => {
      if (layer) map.removeLayer(layer);
      // The referrer policy makes each tile request name this site even if
      // the page sends no referrer; tile servers require that.
      layer = L.tileLayer(USGS_URL, {
        attribution: USGS_ATTRIBUTION, maxNativeZoom: 16, maxZoom: 18,
        referrerPolicy: 'strict-origin-when-cross-origin', className: 'pw-muted-tiles',
      }).addTo(map);
    };
    if (canDrawVectorMaps()) {
      try {
        layer = maplibreGL({ style: OPENFREEMAP_STYLE, attribution: OPENFREEMAP_ATTRIBUTION }).addTo(map);
        const gl = layer.getMaplibreMap();
        timer = setTimeout(() => { if (!gl.isStyleLoaded()) showUsgsMap(); }, 10000);
        gl.once('load', () => clearTimeout(timer));
      } catch {
        showUsgsMap();
      }
    } else {
      showUsgsMap();
    }
    return () => {
      clearTimeout(timer);
      if (layer) map.removeLayer(layer);
    };
  }, [map]);
  return null;
}

const pinIcon = (category, selected) => {
  const size = selected ? 26 : 18;
  const color = PIN_COLORS[category] || PIN_COLORS.other;
  const ring = selected ? 'box-shadow:0 0 0 4px #14264A,0 4px 10px rgba(20,38,74,.45)' : 'box-shadow:0 2px 6px rgba(20,38,74,.35)';
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const clusterIcon = (cluster) => {
  const n = cluster.getChildCount();
  const size = n < 10 ? 36 : n < 100 ? 42 : 50;
  return L.divIcon({
    className: '',
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:9999px;background:#14264A;color:#fff;font:700 15px 'Instrument Sans',system-ui,sans-serif;border:3px solid #fff;box-shadow:0 2px 8px rgba(20,38,74,.4)">${n}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const youAreHere = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#fff;border:5px solid #1F4C8F;box-shadow:0 0 0 6px rgba(31,76,143,.2)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Pins, grouped into numbered circles when they're close together.
function Pins({ places, selectedId, onSelect, programmatic }) {
  const map = useMap();
  const groupRef = useRef(null);
  const markersRef = useRef(new Map());
  const selectedRef = useRef(selectedId);

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 44,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: clusterIcon,
    });
    groupRef.current = group;
    map.addLayer(group);
    return () => { map.removeLayer(group); };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    const markers = markersRef.current;
    group.clearLayers();
    markers.clear();
    const list = places.map((p) => {
      const m = L.marker([p.latitude, p.longitude], {
        icon: pinIcon(p.category, p.id === selectedRef.current),
        title: p.name,
        alt: p.name,
        keyboard: true,
      });
      m.on('click', () => onSelect(p.id));
      markers.set(p.id, { marker: m, category: p.category });
      return m;
    });
    group.addLayers(list);
  }, [places, onSelect]);

  // Restyle only the pins whose selection changed.
  useEffect(() => {
    const markers = markersRef.current;
    const before = markers.get(selectedRef.current);
    if (before) before.marker.setIcon(pinIcon(before.category, false));
    const now = markers.get(selectedId);
    if (now) {
      now.marker.setIcon(pinIcon(now.category, true));
      now.marker.setZIndexOffset(1000);
      programmatic.current = true;
      groupRef.current.zoomToShowLayer(now.marker, () => { setTimeout(() => { programmatic.current = false; }, 400); });
    }
    selectedRef.current = selectedId;
  }, [selectedId, programmatic]);

  return null;
}

function OriginMarker({ origin }) {
  const map = useMap();
  useEffect(() => {
    if (origin.fromMap) return undefined;
    const m = L.marker([origin.lat, origin.lng], { icon: youAreHere, interactive: false, keyboard: false }).addTo(map);
    return () => { map.removeLayer(m); };
  }, [map, origin]);
  return null;
}

// Fits the view to the search, and offers "Search this area" after the
// learner drags or zooms the map themselves.
function ViewControl({ origin, places, onSearchArea, programmatic }) {
  const map = useMap();
  const [moved, setMoved] = useState(false);
  const buttonRef = useRef(null);
  useEffect(() => {
    // Taps on the button shouldn't also drag or zoom the map.
    if (buttonRef.current) {
      L.DomEvent.disableClickPropagation(buttonRef.current);
      L.DomEvent.disableScrollPropagation(buttonRef.current);
    }
  }, [moved]);

  useEffect(() => {
    setMoved(false);
    if (origin.fromMap) return; // keep the view the learner chose
    programmatic.current = true;
    const near = places.slice(0, 15).map((p) => [p.latitude, p.longitude]);
    if (!near.length) map.setView([origin.lat, origin.lng], 12);
    else map.fitBounds([[origin.lat, origin.lng], ...near], { padding: [36, 36], maxZoom: 14 });
    const t = setTimeout(() => { programmatic.current = false; }, 600);
    return () => clearTimeout(t);
  }, [map, origin, places, programmatic]);

  useMapEvents({
    dragstart: () => setMoved(true),
    zoomstart: () => { if (!programmatic.current) setMoved(true); },
  });

  if (!moved) return null;
  return (
    <div ref={buttonRef} className="absolute top-3 inset-x-0 z-[1000] flex justify-center pointer-events-none">
      <button
        type="button"
        onClick={() => {
          const c = map.getCenter();
          setMoved(false);
          onSearchArea({ lat: c.lat, lng: c.lng });
        }}
        className="pointer-events-auto min-h-[44px] rounded-full bg-white px-5 text-base font-bold text-pw-navy shadow-lift border border-pw-line inline-flex items-center gap-2 hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
      >
        <Search className="w-5 h-5" aria-hidden="true" /> Search this area
      </button>
    </div>
  );
}

// Leaflet must re-measure when the map goes full screen or back.
function ResizeOnChange({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map, trigger]);
  return null;
}

export default function ResourceMap({ origin, places, selectedId, onSelect, onSearchArea, fullscreen }) {
  const programmatic = useRef(false); // true while code (not the learner) moves the map
  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={11}
      minZoom={3}
      maxZoom={18}
      scrollWheelZoom={fullscreen}
      className="h-full w-full"
      attributionControl
    >
      <BaseLayer />
      <OriginMarker origin={origin} />
      <Pins places={places} selectedId={selectedId} onSelect={onSelect} programmatic={programmatic} />
      <ViewControl origin={origin} places={places} onSearchArea={onSearchArea} programmatic={programmatic} />
      <ResizeOnChange trigger={fullscreen} />
    </MapContainer>
  );
}
