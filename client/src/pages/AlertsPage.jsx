import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import newsService from '../services/newsService';
import emissionsService from '../services/emissionsService';
import { campaignService } from '../services/campaignService';

export default function AlertsPage() {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('userLocation');
    return saved ? JSON.parse(saved) : null;
  });
  const [locationName, setLocationName] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [news, setNews] = useState([]);
  const [emissionsAlerts, setEmissionsAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const OpenWeatherAPIKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

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

  const getEnvironmentalAlerts = async (latitude, longitude) => {
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OpenWeatherAPIKey}&units=metric`
      );
      const weatherData = await weatherRes.json();
      const weatherAlerts = await geminiService.getLocationAlerts(latitude, longitude, weatherData);
      setAlerts(weatherAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([{
        message: 'Unable to fetch environmental alerts at this time.',
        severity: 'high',
        category: 'system'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationName = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.address) {
        const { city, town, village, hamlet, state, region, country } = data.address;
        const name = city || town || village || hamlet || state || region || country;
        setLocationName(name);
        return name;
      }
    } catch (err) {
      console.error("Error fetching location name:", err);
    }
    return "";
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

  const fetchNewsForLocation = async (locationQuery) => {
    setNewsLoading(true);
    try {
      const result = await newsService.getNewsByLocation(locationQuery, 5);
      if (result.success) {
        setNews(result.articles);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchEmissionsAlerts = async (country) => {
    try {
      console.log('Fetching emissions alerts for:', country);
      
      // Fetch multiple emissions datasets
      const [
        annualData,
        growthData,
        perCapitaData,
        ghgData
      ] = await Promise.all([
        emissionsService.getAnnualCO2(country).catch(err => null),
        emissionsService.getCO2GrowthRate(country).catch(err => null),
        emissionsService.getCO2PerCapita(country).catch(err => null),
        emissionsService.getTotalGHG(country).catch(err => null)
      ]);

      const alerts = [];

      // Analyze growth rate
      if (growthData && growthData.filteredData) {
        const latestGrowth = growthData.filteredData.sort((a, b) => b.year - a.year)[0];
        if (latestGrowth && latestGrowth.value > 3) {
          alerts.push({
            type: 'emissions',
            severity: 'high',
            category: 'emissions',
            title: '⚠️ Rapid CO₂ Growth',
            message: `${country} has experienced ${latestGrowth.value.toFixed(1)}% annual CO₂ growth in ${latestGrowth.year}`,
            icon: '📈'
          });
        }
      }

      // Analyze per capita
      if (perCapitaData && perCapitaData.filteredData) {
        const latestPerCapita = perCapitaData.filteredData.sort((a, b) => b.year - a.year)[0];
        if (latestPerCapita && latestPerCapita.value > 8) {
          alerts.push({
            type: 'emissions',
            severity: 'medium',
            category: 'emissions',
            title: '🏭 High Per Capita Emissions',
            message: `${country} emits ${latestPerCapita.value.toFixed(1)} tonnes CO₂ per person (${latestPerCapita.year})`,
            icon: '🏭'
          });
        }
      }

      // Analyze annual emissions
      if (annualData && annualData.filteredData) {
        const latestAnnual = annualData.filteredData.sort((a, b) => b.year - a.year)[0];
        if (latestAnnual && latestAnnual.value > 1000000000) {
          alerts.push({
            type: 'emissions',
            severity: 'high',
            category: 'emissions',
            title: '🌍 High Total Emissions',
            message: `${country} emitted ${(latestAnnual.value / 1000000000).toFixed(2)} billion tonnes of CO₂ in ${latestAnnual.year}`,
            icon: '🌍'
          });
        }
      }

      // Analyze GHG
      if (ghgData && ghgData.filteredData) {
        const latestGHG = ghgData.filteredData.sort((a, b) => b.year - a.year)[0];
        if (latestGHG) {
          alerts.push({
            type: 'emissions',
            severity: 'medium',
            category: 'emissions',
            title: '💨 Total GHG Emissions',
            message: `${country}'s total greenhouse gas emissions: ${(latestGHG.value / 1000000000).toFixed(2)} billion tonnes CO₂e (${latestGHG.year})`,
            icon: '💨'
          });
        }
      }

      console.log('Generated emissions alerts:', alerts);
      setEmissionsAlerts(alerts);
    } catch (error) {
      console.error('Error fetching emissions alerts:', error);
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
        getEnvironmentalAlerts(newLocation.latitude, newLocation.longitude);
        fetchCampaignsByLocation(customLocation);
        fetchNewsForLocation(customLocation);
        
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
        getEnvironmentalAlerts(location.latitude, location.longitude);
        if (name) {
          fetchCampaignsByLocation(name);
          fetchEmissionsAlerts(name);
          fetchNewsForLocation(name);
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
              getEnvironmentalAlerts(latitude, longitude);
              if (name) {
                fetchCampaignsByLocation(name);
                fetchNewsForLocation(name);
                fetchEmissionsAlerts(name);
              }
            },
            (error) => {
              console.error('Error getting location:', error);
              setLoading(false);
            }
          );
        }
      }
    };

    initLocation();
  }, []);

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
                <p className="text-white/70 text-lg">
                  📍 {locationName}
                </p>
                <button
                  onClick={() => setShowLocationInput(!showLocationInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition"
                >
                  Change Location
                </button>
              </div>
            )}
          </div>

          {/* Location Input */}
          {showLocationInput && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationChange()}
                  placeholder="Enter city, state, or country..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-white/40"
                />
                <button
                  onClick={handleLocationChange}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  Update
                </button>
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
              {/* Environmental Alerts Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">⚠️ Active Alerts</h2>
                <div className="space-y-3">
                  {[...alerts, ...emissionsAlerts].length === 0 ? (
                    <p className="text-white/50 text-center py-4 bg-white/5 rounded-xl">
                      No environmental alerts for your location at this time. ✅
                    </p>
                  ) : (
                    [...alerts, ...emissionsAlerts].map((alert, index) => (
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

              {/* Environmental News Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">📰 Environmental News</h2>
                {newsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                ) : news.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {news.map((article, index) => (
                      <a
                        key={index}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 transition-all duration-300 group"
                      >
                        {article.urlToImage && (
                          <img
                            src={article.urlToImage}
                            alt={article.title}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-emerald-400 transition">
                          {article.title}
                        </h3>
                        <p className="text-white/60 text-sm line-clamp-2 mb-2">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>{article.source.name}</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 text-center py-4 bg-white/5 rounded-xl">
                    No environmental news found for your area.
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
