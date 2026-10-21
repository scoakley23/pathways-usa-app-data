import L from 'leaflet';

// leaflet.markercluster extends the global `L`, which Leaflet's ES module
// build doesn't create. Import this file before 'leaflet.markercluster'.
if (typeof window !== 'undefined' && !window.L) window.L = L;

export default L;
