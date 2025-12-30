import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issues with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ selectedPoint, onMapClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Create map instance
      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 3,
        zoomControl: true,
        attributionControl: true,
      });

      // Add satellite tile layer (ESRI World Imagery - free, no API key needed)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18,
      }).addTo(map);

      // Add a labels overlay for better readability
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        opacity: 0.7
      }).addTo(map);

      // Add click listener
      map.on('click', (e) => {
        if (onMapClick) {
          onMapClick({
            latLng: {
              lat: () => e.latlng.lat,
              lng: () => e.latlng.lng
            }
          });
        }
      });

      mapInstanceRef.current = map;

    } catch (err) {
      console.error('Error initializing map:', err);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onMapClick]);

  // Update marker when selectedPoint changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    // Add new marker if point selected
    if (selectedPoint) {
      const marker = L.marker([selectedPoint.lat, selectedPoint.lng], {
        title: `Selected Location: ${selectedPoint.lat.toFixed(4)}, ${selectedPoint.lng.toFixed(4)}`
      }).addTo(mapInstanceRef.current);

      // Add popup with coordinates
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>Selected Location</strong><br/>
          Lat: ${selectedPoint.lat.toFixed(4)}<br/>
          Lng: ${selectedPoint.lng.toFixed(4)}
        </div>
      `).openPopup();

      // Center map on marker
      mapInstanceRef.current.setView([selectedPoint.lat, selectedPoint.lng], 10);

      markerRef.current = marker;
    }
  }, [selectedPoint]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm z-[1000]">
        🗺️ Click anywhere on the map to select a location
      </div>
    </div>
  );
};

export default MapComponent;
