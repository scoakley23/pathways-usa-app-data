import React, { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Map for the Resource Hub. Loaded lazily (React.lazy) so Leaflet is only
// downloaded on this page. Tiles come from OpenStreetMap, which sees the map
// area being viewed (like any web map); the learner's location is not sent
// anywhere else and is not saved.

// Simple navy pins; the selected place gets the red dot (style A).
const pin = (selected) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:${selected ? 22 : 16}px;height:${selected ? 22 : 16}px;border-radius:9999px;background:${selected ? '#D9483F' : '#14264A'};border:3px solid #fff;box-shadow:0 2px 6px rgba(20,38,74,.35)"></span>`,
    iconSize: selected ? [22, 22] : [16, 16],
    iconAnchor: selected ? [11, 11] : [8, 8],
  });

const youAreHere = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#fff;border:5px solid #1F4C8F;box-shadow:0 0 0 6px rgba(31,76,143,.2)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitToResults({ origin, places }) {
  const map = useMap();
  useEffect(() => {
    const points = [[origin.lat, origin.lng], ...places.map((p) => [p.latitude, p.longitude])];
    if (points.length === 1) map.setView(points[0], 11);
    else map.fitBounds(points, { padding: [32, 32], maxZoom: 13 });
  }, [map, origin, places]);
  return null;
}

export default function ResourceMap({ origin, places, selectedId, onSelect }) {
  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={11}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FitToResults origin={origin} places={places} />
      <Marker position={[origin.lat, origin.lng]} icon={youAreHere} interactive={false} keyboard={false} />
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={pin(p.id === selectedId)}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          title={p.name}
          eventHandlers={{ click: () => onSelect(p.id) }}
        >
          <Tooltip direction="top" offset={[0, -10]}>{p.name}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
