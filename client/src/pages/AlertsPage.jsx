import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { campaignService } from '../services/campaignService';

function AlertsPage() {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('userLocation');
    return saved ? JSON.parse(saved) : null;
  });
  const [locationName, setLocationName] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [geminiError, setGeminiError] = useState(false);
  const OpenWeatherAPIKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const canvasRef = useRef(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  const categoryColors = {
    air: 'bg-yellow-500/20 border-yellow-500/30',
    water: 'bg-blue-500/20 border-blue-500/30',
    storm: 'bg-gray-500/20 border-gray-500/30',
    heat: 'bg-red-500/20 border-red-500/30',
    ecosystem: 'bg-green-500/20 border-green-500/30',
    system: 'bg-purple-500/20 border-purple-500/30',
    weather: 'bg-gray-400/20 border-gray-400/30',
    emissions: 'bg-orange-500/20 border-orange-500/30'
  };

  const badgeColors = {
    air: 'bg-yellow-600/50 text-white',
    water: 'bg-blue-600/50 text-white',
    storm: 'bg-gray-600/50 text-white',
    heat: 'bg-red-600/50 text-white',
    ecosystem: 'bg-green-600/50 text-white',
    system: 'bg-purple-600/50 text-white',
    weather: 'bg-gray-600/50 text-white',
    emissions: 'bg-orange-600/50 text-white',
    high: 'bg-red-600/50 text-white',
    medium: 'bg-yellow-600/50 text-white'
  };

  const getEnvironmentalAlerts = async (locationNameForSearch) => {
    try {
      setLoading(true);
      
      console.log('Fetching environmental data for:', locationNameForSearch);
      
      // Get all environmental data from Gemini web search
      const data = await geminiService.getEnvironmentalData(locationNameForSearch);
      
      console.log('Received environmental data:', data);
      
      // Check if Gemini returned an error
      if (data.airQuality?.level === 'Error' || 
          data.airQuality?.level === 'Quota Exceeded' || 
          data.weather?.condition === 'Error' ||
          data.weather?.condition === 'Quota Exceeded' ||
          data.isQuotaError) {
        setGeminiError(true);
      }
      
      setEnvironmentalData(data);
      setAlerts(data.alerts || []);

    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([{
        message: 'Unable to fetch environmental alerts at this time.',
        severity: 'high',
        category: 'system',
        icon: '⚠️'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationName = async (latitude, longitude) => {
    try {
      // Add timeout and better error handling for Nominatim API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'TerraTrack Environmental App'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Nominatim API error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data && data.address) {
        const { city, town, village, hamlet, state, region, country } = data.address;
        const name = city || town || village || hamlet || state || region || country;
        setLocationName(name);
        return name;
      }
    } catch (err) {
      console.error("Error fetching location name:", err);
      
      // Fallback: Use coordinates to guess location name
      const fallbackName = getFallbackLocationName(latitude, longitude);
      if (fallbackName) {
        setLocationName(fallbackName);
        return fallbackName;
      }
    }
    
    // Ultimate fallback
    setLocationName("Unknown Location");
    return "Unknown Location";
  };

  // Fallback location name based on coordinates
  const getFallbackLocationName = (lat, lon) => {
    // Major cities approximate coordinates
    const cities = [
      { name: 'Delhi', lat: 28.7, lon: 77.1, radius: 2 },
      { name: 'Mumbai', lat: 19.1, lon: 72.9, radius: 2 },
      { name: 'New York', lat: 40.7, lon: -74.0, radius: 2 },
      { name: 'London', lat: 51.5, lon: -0.1, radius: 2 },
      { name: 'Tokyo', lat: 35.7, lon: 139.7, radius: 2 },
      { name: 'Singapore', lat: 1.3, lon: 103.8, radius: 2 },
      { name: 'Dubai', lat: 25.3, lon: 55.3, radius: 2 },
      { name: 'Paris', lat: 48.9, lon: 2.3, radius: 2 },
      { name: 'Los Angeles', lat: 34.1, lon: -118.2, radius: 2 },
      { name: 'Chicago', lat: 41.9, lon: -87.6, radius: 2 },
      { name: 'Sydney', lat: -33.9, lon: 151.2, radius: 2 },
      { name: 'Hong Kong', lat: 22.3, lon: 114.2, radius: 2 }
    ];
    
    for (const city of cities) {
      const latDiff = Math.abs(lat - city.lat);
      const lonDiff = Math.abs(lon - city.lon);
      if (latDiff < city.radius && lonDiff < city.radius) {
        return city.name;
      }
    }
    
    return null;
  };

  const fetchCampaignsByLocation = async (locationQuery) => {
    setCampaignsLoading(true);
    try {
      const response = await campaignService.getAllCampaigns();
      console.log('All campaigns:', response);
      if (response && response.data) {
        // Show all campaigns, prioritize those matching location
        const allCampaigns = response.data;
        const matchingCampaigns = allCampaigns.filter(campaign =>
          campaign.location?.toLowerCase().includes(locationQuery?.toLowerCase() || '')
        );
        const otherCampaigns = allCampaigns.filter(campaign =>
          !campaign.location?.toLowerCase().includes(locationQuery?.toLowerCase() || '')
        );
        
        // Show matching campaigns first, then others
        const sortedCampaigns = [...matchingCampaigns, ...otherCampaigns];
        setCampaigns(sortedCampaigns.slice(0, 12)); // Show latest 12 campaigns
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleLocationChange = async () => {
    if (!customLocation.trim()) return;
    
    try {
      // Geocode the custom location
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(customLocation)}&format=json&limit=1`
      );
      const data = await res.json();
      
      if (data && data[0]) {
        const { lat, lon, display_name } = data[0];
        const newLocation = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        };
        
        setLocation(newLocation);
        setLocationName(customLocation);
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        
        // Fetch all data for new location
        getEnvironmentalAlerts(customLocation);
        fetchCampaignsByLocation(customLocation);
        
        setShowLocationInput(false);
        setCustomLocation("");
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  useEffect(() => {
    const initLocation = async () => {
      // Check if we have a saved location
      if (location) {
        const name = await fetchLocationName(location.latitude, location.longitude);
        if (name) {
          getEnvironmentalAlerts(name);
          fetchCampaignsByLocation(name);
        }
      } else {
        // Get current location
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const newLocation = { latitude, longitude };
              setLocation(newLocation);
              localStorage.setItem('userLocation', JSON.stringify(newLocation));
              
              const name = await fetchLocationName(latitude, longitude);
              if (name) {
                getEnvironmentalAlerts(name);
                fetchCampaignsByLocation(name);
              }
            },
            async (error) => {
              console.error('Error getting location:', error);
              // Fallback to a default location (e.g., New York)
              const defaultLocation = { latitude: 40.7128, longitude: -74.0060 };
              setLocation(defaultLocation);
              localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
              
              const name = await fetchLocationName(defaultLocation.latitude, defaultLocation.longitude);
              if (name) {
                getEnvironmentalAlerts(name);
                fetchCampaignsByLocation(name);
              }
            }
          );
        }
      }
    };

    initLocation();
  }, []);

  // Canvas Speedometer Drawing Effect
  useEffect(() => {
    if (!canvasRef.current || !environmentalData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const targetSpeed = Math.min(environmentalData.airQuality.aqi, 500);
    
    // Animate speed change
    const animateSpeed = () => {
      const step = targetSpeed > currentSpeed ? 2 : -2;
      if (Math.abs(targetSpeed - currentSpeed) < Math.abs(step)) {
        setCurrentSpeed(targetSpeed);
      } else {
        setCurrentSpeed(prev => prev + step);
      }
    };
    
    if (currentSpeed !== targetSpeed) {
      const interval = setInterval(animateSpeed, 10);
      return () => clearInterval(interval);
    }
  }, [environmentalData, currentSpeed]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Draw the speedometer
    const drawSpeedometer = (speed) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 120;

      // Color segments for AQI ranges
      const segments = [
        { start: 0, end: 50, color: '#10b981', label: 'Good' },
        { start: 50, end: 100, color: '#fbbf24', label: 'Moderate' },
        { start: 100, end: 150, color: '#fb923c', label: 'Unhealthy SG' },
        { start: 150, end: 200, color: '#ef4444', label: 'Unhealthy' },
        { start: 200, end: 300, color: '#a855f7', label: 'Very Unhealthy' },
        { start: 300, end: 500, color: '#991b1b', label: 'Hazardous' }
      ];

      // Draw colored arc segments
      segments.forEach(segment => {
        const startAngle = 0.75 * Math.PI + (segment.start / 500) * (1.5 * Math.PI);
        const endAngle = 0.75 * Math.PI + (segment.end / 500) * (1.5 * Math.PI);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineWidth = 20;
        ctx.strokeStyle = segment.color;
        ctx.stroke();
      });

      // Draw ticks and numbers
      for (let i = 0; i <= 500; i += 50) {
        const angle = (0.75 * Math.PI) + (i / 500) * (1.5 * Math.PI);
        const innerRadius = radius - 20;
        const outerRadius = radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX + innerRadius * Math.cos(angle), centerY + innerRadius * Math.sin(angle));
        ctx.lineTo(centerX + outerRadius * Math.cos(angle), centerY + outerRadius * Math.sin(angle));
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw numbers
        const textRadius = radius - 40;
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, centerX + textRadius * Math.cos(angle), centerY + textRadius * Math.sin(angle));
      }

      // Draw needle
      const needleAngle = (0.75 * Math.PI) + (speed / 500) * (1.5 * Math.PI);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + (radius - 40) * Math.cos(needleAngle), centerY + (radius - 40) * Math.sin(needleAngle));
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Draw speed text (AQI value)
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = speed <= 50 ? '#10b981' :
                      speed <= 100 ? '#fbbf24' :
                      speed <= 150 ? '#fb923c' :
                      speed <= 200 ? '#ef4444' :
                      speed <= 300 ? '#a855f7' : '#991b1b';
      ctx.fillText(`${Math.round(speed)} AQI`, centerX, centerY + 60);
    };

    drawSpeedometer(currentSpeed);
  }, [currentSpeed]);

  return (
    <div style={{marginTop: '50px'}} className="min-h-screen px-4 py-20">      
      <div className="w-full max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 
                        hover:bg-white/15 transition-all duration-300 ease-out">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white">Environmental Alerts</h1>
              <p className="text-white/60 mt-2">
                Real-time environmental monitoring and updates
              </p>
            </div>
            {locationName && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                  <span className="text-2xl">📍</span>
                  <span className="text-white font-medium">{locationName}</span>
                </div>
                <button
                  onClick={() => setShowLocationInput(!showLocationInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition shadow-lg hover:shadow-emerald-500/50"
                >
                  {showLocationInput ? '✕ Cancel' : '🌍 Change Location'}
                </button>
              </div>
            )}
          </div>

          {/* Location Input */}
          {showLocationInput && (
            <div className="mb-6 p-5 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-xl border border-emerald-500/30 shadow-lg">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                Update Your Location
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationChange()}
                  placeholder="Enter city, state, or country (e.g., Mumbai, London, USA)..."
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-white/50 backdrop-blur-sm"
                />
                <button
                  onClick={handleLocationChange}
                  disabled={!customLocation.trim()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition shadow-md hover:shadow-lg"
                >
                  ✓ Update
                </button>
                <button
                  onClick={() => {
                    if ("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const { latitude, longitude } = position.coords;
                          const newLocation = { latitude, longitude };
                          setLocation(newLocation);
                          localStorage.setItem('userLocation', JSON.stringify(newLocation));
                          
                          const name = await fetchLocationName(latitude, longitude);
                          if (name) {
                            getEnvironmentalAlerts(name);
                            fetchCampaignsByLocation(name);
                          }
                          setShowLocationInput(false);
                          setCustomLocation('');
                        },
                        (error) => {
                          alert('Unable to get your location. Please enter manually.');
                        }
                      );
                    } else {
                      alert('Geolocation is not supported by your browser.');
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  📍 Use My Location
                </button>
              </div>
              <p className="text-white/50 text-xs mt-2">
                💡 Tip: Try "Mumbai", "New York", "London", or any city/country name
              </p>
            </div>
          )}

          {/* Gemini API Error Notice */}
          {geminiError && (
            <div className="mb-6 p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <div className="flex items-start gap-4">
                <span className="text-4xl">⏰</span>
                <div className="flex-1">
                  <h3 className="text-orange-400 font-bold text-xl mb-2">Gemini AI Daily Quota Exceeded</h3>
                  <p className="text-white/80 mb-3">
                    You've reached the free tier limit of <strong>20 AI requests per day</strong>. The quota will reset in approximately 24 hours.
                  </p>
                  <div className="bg-black/30 p-4 rounded-lg mb-3">
                    <p className="text-white/70 text-sm mb-2"><strong>Current Status:</strong></p>
                    <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
                      <li>Gemini API quota: <span className="text-red-400 font-semibold">20/20 used</span></li>
                      <li>Model: gemini-2.5-flash (Free Tier)</li>
                      <li>Retry available: Tomorrow (quota resets daily)</li>
                    </ul>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                    <p className="text-blue-400 font-semibold text-sm mb-2">💡 Immediate Solutions:</p>
                    <div className="space-y-3">
                      <div className="bg-white/5 p-3 rounded">
                        <p className="text-white font-semibold text-sm mb-1">Option 1: Use Direct APIs (Recommended)</p>
                        <p className="text-white/70 text-xs">Switch to OpenWeather API + WAQI for unlimited environmental data without AI quota limits.</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded">
                        <p className="text-white font-semibold text-sm mb-1">Option 2: Upgrade Gemini API</p>
                        <p className="text-white/70 text-xs">Get a paid Google AI Studio account for 1,500 requests/day (still free tier) or unlimited with billing.</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded">
                        <p className="text-white font-semibold text-sm mb-1">Option 3: Wait 24 Hours</p>
                        <p className="text-white/70 text-xs">Come back tomorrow when the quota resets automatically.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weather Alerts */}
          {loading ? (
            <div className="text-white/70 flex items-center justify-center space-x-2 py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              <span>Analyzing your environment...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Air Quality Overview - From Gemini Web Search */}
              {environmentalData && environmentalData.airQuality && environmentalData.airQuality.aqi > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-6">🌫️ Air Quality Index</h2>
                  <div className="text-xs text-white/50 mb-4">
                    📡 Real-time data via web search • Source: {environmentalData.airQuality.source || 'Multiple sources'}
                  </div>
                  {environmentalData.airQuality.lastUpdated && (
                    <div className="text-xs text-white/40 mb-4">
                      Last updated: {environmentalData.airQuality.lastUpdated}
                    </div>
                  )}
                  
                  {/* AQI Speedometer Gauge */}
                  <div className="mb-6">
                    <div className="relative w-full max-w-md mx-auto">
                      {/* Canvas Speedometer */}
                      <div className="relative h-80 flex items-center justify-center">
                        <canvas 
                          ref={canvasRef} 
                          width="400" 
                          height="400"
                          className="drop-shadow-2xl"
                        />
                      </div>
                      
                      {/* AQI Level Display below speedometer */}
                      <div className="text-center mt-4">
                        <div className="text-white font-bold text-xl tracking-wide">{environmentalData.airQuality.level}</div>
                      </div>
                      
                      <div className="text-center text-white/80 text-sm mt-3 px-4 leading-relaxed">
                        {environmentalData.airQuality.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Pollutants with Progress Bars */}
                  {environmentalData.airQuality.pollutants && environmentalData.airQuality.pollutants.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-white font-semibold mb-4 text-lg">Main Pollutants</h3>
                      <div className="space-y-4">
                        {environmentalData.airQuality.pollutants.map((pollutant, idx) => {
                          // Calculate intensity percentage based on pollutant type
                          const getIntensity = () => {
                            if (pollutant.name === 'PM2.5') return Math.min((pollutant.value / 150) * 100, 100);
                            if (pollutant.name === 'PM10') return Math.min((pollutant.value / 250) * 100, 100);
                            if (pollutant.name === 'Ozone') return Math.min((pollutant.value / 100) * 100, 100);
                            if (pollutant.name === 'NO2') return Math.min((pollutant.value / 100) * 100, 100);
                            if (pollutant.name === 'SO2') return Math.min((pollutant.value / 50) * 100, 100);
                            if (pollutant.name === 'CO') return Math.min((pollutant.value / 15) * 100, 100);
                            return 50;
                          };
                          
                          const intensity = getIntensity();
                          const getColor = () => {
                            if (intensity < 33) return 'from-green-500 to-green-600';
                            if (intensity < 66) return 'from-yellow-500 to-orange-500';
                            return 'from-red-500 to-purple-600';
                          };
                          
                          return (
                            <div key={idx} className="bg-white/5 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-white font-medium">{pollutant.name}</span>
                                <span className="text-white font-bold">{pollutant.value} {pollutant.unit}</span>
                              </div>
                              <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`absolute h-full bg-gradient-to-r ${getColor()} transition-all duration-500 rounded-full`}
                                  style={{ width: `${intensity}%` }}
                                >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-white/50 mt-1">
                                <span>Low</span>
                                <span className={intensity > 66 ? 'text-red-400 font-semibold' : ''}>
                                  {intensity > 66 ? 'High Risk' : intensity > 33 ? 'Moderate' : 'Safe'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Weather Conditions - From Gemini Web Search */}
              {environmentalData && environmentalData.weather && environmentalData.weather.temperature && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">🌤️ Current Weather Conditions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🌡️</div>
                      <div className="text-2xl font-bold text-white">{environmentalData.weather.temperature.toFixed(1)}°C</div>
                      <div className="text-white/70 text-sm">Temperature</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">💧</div>
                      <div className="text-2xl font-bold text-white">{environmentalData.weather.humidity || 0}%</div>
                      <div className="text-white/70 text-sm">Humidity</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">💨</div>
                      <div className="text-2xl font-bold text-white">{environmentalData.weather.windSpeed || 0} m/s</div>
                      <div className="text-white/70 text-sm">Wind Speed</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🔽</div>
                      <div className="text-2xl font-bold text-white">{environmentalData.weather.pressure || 0} hPa</div>
                      <div className="text-white/70 text-sm">Pressure</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-white/5 rounded-lg">
                    <div className="text-white font-semibold mb-1">{environmentalData.weather.condition}</div>
                    <div className="text-white/70 text-sm">{environmentalData.weather.description}</div>
                  </div>
                </div>
              )}

              {/* Environmental Alerts Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">⚠️ Active Alerts</h2>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <p className="text-white/50 text-center py-4 bg-white/5 rounded-xl">
                      No environmental alerts for your location at this time. ✅
                    </p>
                  ) : (
                    alerts.map((alert, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between gap-4 p-4 rounded-xl border shadow-sm backdrop-blur-sm
                          ${categoryColors[alert.category] || categoryColors[alert.severity] || 'bg-gray-500/20 border-gray-500/30'}`}
                      >
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {alert.icon && <span className="text-2xl">{alert.icon}</span>}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                              ${badgeColors[alert.category] || badgeColors[alert.severity] || 'bg-gray-600/50 text-white'}`}>
                              {(alert.category || alert.severity || 'ALERT').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-white font-semibold">{alert.title || alert.message}</p>
                          {alert.title && <p className="text-white/70 text-sm mt-1">{alert.message}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Campaigns Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">🌱 Local Campaigns</h2>
                {campaignsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                ) : campaigns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaigns.map((campaign) => (
                      <Link
                        key={campaign._id}
                        to={`/campaigns/${campaign._id}`}
                        className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 transition-all duration-300 group"
                      >
                        {campaign.imageUrl && (
                          <img
                            src={campaign.imageUrl}
                            alt={campaign.title}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h3 className="text-white font-semibold mb-2 group-hover:text-emerald-400 transition">
                          {campaign.title}
                        </h3>
                        <p className="text-white/60 text-sm line-clamp-2 mb-2">
                          {campaign.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>📍 {campaign.location}</span>
                          <span className="text-emerald-400">{campaign.status}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 text-center py-4 bg-white/5 rounded-xl">
                    No local campaigns found for your area.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("AlertsPage Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-8">
                    <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/50 rounded-3xl p-8 max-w-2xl w-full">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Something went wrong</h2>
                        <p className="mb-4 text-white/80">The alerts page encountered an error. This may be due to API connectivity issues.</p>
                        <div className="bg-black/30 p-4 rounded-lg mb-4">
                            <p className="text-red-300 text-sm font-mono">
                                {this.state.error && this.state.error.toString()}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
                            >
                                🔄 Reload Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors"
                            >
                                🏠 Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const AlertsPageWithErrorBoundary = () => (
    <ErrorBoundary>
        <AlertsPage />
    </ErrorBoundary>
);

export default AlertsPageWithErrorBoundary;
