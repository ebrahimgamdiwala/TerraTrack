import { useEffect, useRef, useState } from 'react';

// Global flag to track if Google Maps is being loaded
let isLoadingGoogleMaps = false;
let loadPromise = null;

const GoogleMapComponent = ({ selectedPoint, onMapClick, apiKey }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Load Google Maps JavaScript API
  useEffect(() => {
    // Validate API key first
    if (!apiKey || apiKey === 'undefined') {
      setError('Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
      return;
    }

    // If already loaded, set state immediately
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // If currently loading, wait for existing promise
    if (isLoadingGoogleMaps && loadPromise) {
      loadPromise.then(() => setIsLoaded(true)).catch(() => setError('Failed to load Google Maps API'));
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      if (window.google && window.google.maps) {
        setIsLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        existingScript.addEventListener('error', () => setError('Failed to load Google Maps API'));
      }
      return;
    }

    // Create and load new script
    isLoadingGoogleMaps = true;
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        isLoadingGoogleMaps = false;
        setIsLoaded(true);
        resolve();
      };
      
      script.onerror = () => {
        isLoadingGoogleMaps = false;
        setError('Failed to load Google Maps API');
        reject();
      };

      document.head.appendChild(script);
    });

    return () => {
      // Don't remove script on unmount as it may be used by other components
      // Script removal would cause errors for other GoogleMapComponent instances
    };
  }, [apiKey]);

  // Initialize map when loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 3,
        mapTypeId: 'satellite',
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: true,
      });

      // Add click listener
      mapInstanceRef.current.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onMapClick({
          latLng: {
            lat: () => lat,
            lng: () => lng
          }
        });
      });

    } catch (err) {
      console.error('Error initializing Google Maps:', err);
      setError('Failed to initialize Google Maps');
    }
  }, [isLoaded, onMapClick]);

  // Update marker when selectedPoint changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new marker if point selected
    if (selectedPoint) {
      markerRef.current = new window.google.maps.Marker({
        position: selectedPoint,
        map: mapInstanceRef.current,
        title: `Selected Location: ${selectedPoint.lat.toFixed(4)}, ${selectedPoint.lng.toFixed(4)}`
      });
    }
  }, [selectedPoint]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p>{error}</p>
          <p className="text-sm text-white/60 mt-2">Please check your API key and internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-2"></div>
          <p>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
};

export default GoogleMapComponent;