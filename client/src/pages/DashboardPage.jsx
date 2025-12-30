import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chart } from 'chart.js/auto';
import { simulateEEAnalysis, getAnalysisDescription } from '../services/analysisService';
import MapComponent from '../components/MapComponent';
import newsService from '../services/newsService';
import { geminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

function DashboardPageComponent() {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [locationInsights, setLocationInsights] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const [startYear, setStartYear] = useState('2020');
  const [endYear, setEndYear] = useState('2023');
  const [analysisType, setAnalysisType] = useState('ndvi');

  const chartRef = useRef(null);

  // Fetch environmental news on component mount
  useEffect(() => {
    fetchEnvironmentalNews();
  }, []);

  const fetchEnvironmentalNews = async () => {
    setNewsLoading(true);
    try {
      // Fetch more articles with India priority (70% Indian news)
      const result = await newsService.getEnvironmentalNews({ 
        pageSize: 15, 
        includeIndia: true,
        indiaPriority: 0.7  // 70% Indian news
      });
      if (result.success) {
        setNews(result.articles);
        console.log(`Loaded ${result.indianCount || 0} Indian + ${result.globalCount || 0} global articles`);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  // Reverse geocoding to get location address
  const fetchLocationAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.address) {
        const { city, town, village, hamlet, county, state, region, country } = data.address;
        const locationName = city || town || village || hamlet || county || state || region || 'Unknown Location';
        const fullAddress = [
          city || town || village || hamlet,
          county,
          state || region,
          country
        ].filter(Boolean).join(', ');
        
        return {
          name: locationName,
          fullAddress: fullAddress || data.display_name,
          country: country || 'Unknown',
          raw: data.address
        };
      }
    } catch (err) {
      console.error('Error fetching location address:', err);
    }
    return {
      name: `Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
      fullAddress: `Coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
      country: 'Unknown',
      raw: null
    };
  };

  // Get AI analysis for the location using Gemini
  const fetchAILocationAnalysis = async (address, lat, lng) => {
    setAiAnalysisLoading(true);
    try {
      const query = `Provide a brief environmental analysis for ${address.fullAddress || address.name} (coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E). Include:
1. General climate and ecosystem type
2. Key environmental challenges in this region
3. Notable environmental features or concerns
4. Air quality and pollution trends if known
5. Climate change impacts affecting this area

Keep the response concise but informative.`;

      const response = await geminiService.analyzeClimateQuery(query, true);
      
      if (response && response.content) {
        setAiAnalysis(response);
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      // Set a fallback analysis
      setAiAnalysis({
        content: `Environmental overview for ${address.name}. This location is at coordinates ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E. For detailed environmental analysis, please click "Analyze Point" after selecting your parameters.`,
        sources: []
      });
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const onMapClick = useCallback(async (e) => {
    const point = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    setSelectedPoint(point);
    setAiAnalysis(null);
    setLocationInsights(null);
    setAnalysisResults(null);

    // Fetch location address using reverse geocoding
    const address = await fetchLocationAddress(point.lat, point.lng);
    setLocationAddress(address);
    
    // Get AI-powered location insights from Gemini
    await fetchAILocationAnalysis(address, point.lat, point.lng);
    
    // Set basic location insights
    setLocationInsights({
      description: `${address.fullAddress}`,
      coordinates: `${point.lat.toFixed(4)}°N, ${point.lng.toFixed(4)}°E`,
      country: address.country
    });
  }, []);

  const handleAnalyze = async () => {
    if (!selectedPoint) {
      alert('Please select a point on the map first.');
      return;
    }
    setLoading(true);
    setAnalysisResults(null);
    if (chartRef.current) chartRef.current.destroy();

    try {
      const results = await simulateEEAnalysis(
        selectedPoint.lat,
        selectedPoint.lng,
        startYear,
        endYear,
        analysisType,
        false
      );
      
      // Include location name in results for better context
      if (locationAddress) {
        results.locationName = locationAddress.name;
        results.fullAddress = locationAddress.fullAddress;
      }
      
      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analysisResults && analysisResults.years && analysisResults.values && analysisResults.values.length > 0) {
      const ctx = document.getElementById('timelineChart');
      if (chartRef.current) chartRef.current.destroy();

      // Determine chart color based on trend
      const startValue = analysisResults.values[0];
      const endValue = analysisResults.values[analysisResults.values.length - 1];
      const trendColor = endValue >= startValue ? '#10B981' : '#EF4444';

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: analysisResults.years,
          datasets: [{
            label: analysisResults.metricName,
            data: analysisResults.values,
            borderColor: trendColor,
            backgroundColor: trendColor + '20',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: trendColor,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: trendColor,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              title: { display: true, text: analysisResults.metricName, color: '#065f46' },
              ticks: { color: '#047857' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              title: { display: true, text: 'Year', color: '#065f46' },
              ticks: { color: '#047857' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          },
          plugins: {
            legend: { labels: { color: '#065f46' } },
            title: { display: true, text: `${analysisResults.metricName} Trend`, color: '#065f46', font: { size: 16 } },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
            }
          }
        }
      });
    }
  }, [analysisResults]);

  const renderStats = () => {
    if (!analysisResults || !analysisResults.values || analysisResults.values.length === 0) return null;
    const { values, startYear, endYear, location, locationName, fullAddress, analysisType, metricName } = analysisResults;
    const startValue = values[0];
    const endValue = values[values.length - 1];
    const change = ((endValue - startValue) / Math.abs(startValue)) * 100;
    const changeType = change >= 0 ? 'increased' : 'decreased';
    const interpretation = getAnalysisDescription(analysisType, values, startYear, endYear);

    // Debug logging
    console.log('Analysis Results:', analysisResults);
    console.log('Interpretation:', interpretation);

    return (
      <div className="space-y-6">
        {/* Location Info */}
        {(locationName || fullAddress) && (
          <div className="p-4 bg-emerald-500/10 backdrop-blur-xl rounded-3xl border border-emerald-500/20 shadow-2xl">
            <h3 className="text-lg font-semibold text-emerald-400 mb-2">📍 Analyzed Location</h3>
            <p className="text-white/90 font-medium">{locationName || 'Selected Location'}</p>
            {fullAddress && <p className="text-white/60 text-sm mt-1">{fullAddress}</p>}
          </div>
        )}

        {/* Summary Card */}
        <div className="p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-2">Analysis Summary</h3>
          <p className="text-white/80">{interpretation.summary}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl text-center">
            <div className="text-sm text-white/70 mb-1">Initial Value</div>
            <div className="text-xl font-bold text-white">{startValue.toFixed(4)}</div>
            <div className="text-xs text-white/50 mt-1">{startYear}</div>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl text-center">
            <div className="text-sm text-white/70 mb-1">Final Value</div>
            <div className="text-xl font-bold text-white">{endValue.toFixed(4)}</div>
            <div className="text-xs text-white/50 mt-1">{endYear}</div>
          </div>
        </div>

        {/* Change Indicator */}
        <div className="p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl text-center">
          <div className="text-sm text-white/70 mb-1">Overall Change</div>
          <div className={`text-2xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
          </div>
          <div className="text-sm text-white/60 mt-1">
            {changeType} from {startYear} to {endYear}
          </div>
        </div>

        {/* Detailed Interpretation */}
        {interpretation?.details && interpretation.details.length > 0 && (
          <div className="p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">What This Means</h3>
            <ul className="space-y-2">
              {interpretation.details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span className="text-white/80">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {interpretation?.recommendations && interpretation.recommendations.length > 0 && (
          <div className="p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Recommendations</h3>
            <ul className="space-y-2">
              {interpretation.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span className="text-white/80">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Debug log to ensure component is rendering
  useEffect(() => {
    console.log('DashboardPage component mounted');
    return () => console.log('DashboardPage component unmounted');
  }, []);

  return (
    <div style={{ marginTop: '50px' }} className="min-h-screen flex items-center justify-center px-4 py-20 relative z-10">
      <div className="w-full max-w-7xl">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 
                        hover:bg-white/15 transition-all duration-300 ease-out">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <h1 className="text-3xl font-bold text-white">🌍 Environmental Analysis Dashboard</h1>
            <div className="flex flex-wrap items-center gap-3">
              <select value={startYear} onChange={e => setStartYear(e.target.value)} className="bg-white/50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition">
                <option value="2018">2018</option><option value="2019">2019</option><option value="2020">2020</option><option value="2021">2021</option><option value="2022">2022</option>
              </select>
              <select value={endYear} onChange={e => setEndYear(e.target.value)} className="bg-white/50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition">
                <option value="2020">2020</option><option value="2021">2021</option><option value="2022">2022</option><option value="2023">2023</option>
              </select>
              <select value={analysisType} onChange={e => setAnalysisType(e.target.value)} className="bg-white/50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition">
                <option value="ndvi">🌱 Vegetation</option><option value="ndwi">💧 Water Bodies</option><option value="urban">🏙️ Urban Expansion</option>
                <option value="temperature">🌡️ Temperature</option><option value="precipitation">🌧️ Precipitation</option>
              </select>
              <button onClick={handleAnalyze} disabled={!selectedPoint || loading} className="bg-emerald-600 text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-emerald-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {loading ? 'Analyzing...' : '🔍 Analyze Point'}
              </button>
            </div>
          </div>
        </div>
        <br />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="h-[50vh] lg:h-[75vh] bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <MapComponent
              selectedPoint={selectedPoint}
              onMapClick={onMapClick}
            />
          </div>

          {/* Results Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300 ease-out overflow-y-auto max-h-[75vh]">
            <h2 className="text-2xl font-bold text-white mb-4">Analysis Results</h2>

            {/* Location Insights - Always show when available */}
            {locationInsights && (
              <div className="mb-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">📍 Analyzed Location</h3>
                <p className="text-white font-medium">{locationAddress?.name || 'Selected Location'}</p>
                <p className="text-white/70 text-sm mb-2">{locationInsights.description}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="text-sm text-white/60">Coordinates: <span className="text-white/80">{locationInsights.coordinates}</span></div>
                  <div className="text-sm text-white/60">Country: <span className="text-white/80">{locationInsights.country}</span></div>
                </div>
              </div>
            )}

            {/* AI Analysis Section - Always show when available */}
            {aiAnalysisLoading && (
              <div className="mb-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                  <span className="text-white/60 text-sm">Analyzing location with AI...</span>
                </div>
              </div>
            )}
            
            {aiAnalysis && !aiAnalysisLoading && (
              <div className="mb-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                <h4 className="text-lg font-semibold text-emerald-400 mb-3">🤖 AI Environmental Analysis</h4>
                <div className="text-white/80 text-sm prose prose-sm prose-invert max-w-none prose-headings:text-emerald-400 prose-headings:text-base prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown>
                    {typeof aiAnalysis.content === 'string' 
                      ? aiAnalysis.content.substring(0, 1500)
                      : 'Analysis available'}
                  </ReactMarkdown>
                </div>
                {aiAnalysis.sources && aiAnalysis.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <p className="text-xs text-white/50">Sources: {aiAnalysis.sources.slice(0, 2).map(s => s.title).join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Chart Section */}
            {loading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : analysisResults ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">📊 Analysis Summary</h3>
                <div className="h-[250px] bg-white/5 rounded-xl p-2"><canvas id="timelineChart"></canvas></div>
                {renderStats()}
              </div>
            ) : !locationInsights ? (
              <div className="flex justify-center items-center min-h-[200px] text-center text-white/70">
                <div>
                  <div className="text-4xl mb-4">🌎</div>
                  <p>Click anywhere on the map to select a location</p>
                  <p className="text-sm mt-2">Then press "Analyze Point" to see detailed environmental analysis</p>
                </div>
              </div>
            ) : !analysisResults && locationInsights ? (
              <div className="flex justify-center items-center min-h-[100px] text-center text-white/70">
                <div>
                  <p className="text-sm">📊 Press <span className="text-emerald-400 font-semibold">"Analyze Point"</span> to see NDVI, temperature, and other environmental data</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Environmental News Section */}
        <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📰 Latest Environmental News</h2>
          {newsLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.slice(0, 6).map((article, index) => (
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
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition">
                    {article.title}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 mb-2">
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{article.source.name}</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPageComponent;