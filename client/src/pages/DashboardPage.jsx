import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chart } from 'chart.js/auto';
import { simulateEEAnalysis, getAnalysisDescription, getLocationInsights } from '../services/analysisService';
import GoogleMapComponent from '../components/GoogleMapComponent';
import newsService from '../services/newsService';

function DashboardPageComponent() {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [locationInsights, setLocationInsights] = useState(null);
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
      const result = await newsService.getEnvironmentalNews({ pageSize: 6 });
      if (result.success) {
        setNews(result.articles);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const onMapClick = useCallback(async (e) => {
    const point = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    setSelectedPoint(point);

    // Get location insights immediately when a point is selected
    try {
      const insights = await getLocationInsights(point.lat, point.lng);
      setLocationInsights(insights);
    } catch (error) {
      console.error('Error fetching location insights:', error);
    }
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
    const { values, startYear, endYear, location, analysisType, metricName } = analysisResults;
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
            <GoogleMapComponent
              selectedPoint={selectedPoint}
              onMapClick={onMapClick}
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            />
          </div>

          {/* Results Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all duration-300 ease-out overflow-y-auto max-h-[75vh]">
            <h2 className="text-2xl font-bold text-white mb-4">Analysis Results</h2>

            {/* Location Insights */}
            {locationInsights && !analysisResults && (
              <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">📍 Location Overview</h3>
                <p className="text-white/70">{locationInsights.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="text-sm text-white/60">Elevation: <span className="text-white/80">{locationInsights.elevation}</span></div>
                  <div className="text-sm text-white/60">Climate: <span className="text-white/80">{locationInsights.climate}</span></div>
                  <div className="text-sm text-white/60">Land Use: <span className="text-white/80">{locationInsights.landUse}</span></div>
                  <div className="text-sm text-white/60">Ecoregion: <span className="text-white/80">{locationInsights.ecoregion}</span></div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-full min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : analysisResults ? (
              <div className="space-y-6">
                <div className="h-[250px]"><canvas id="timelineChart"></canvas></div>
                {renderStats()}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full min-h-[300px] text-center text-white/70">
                <div>
                  <div className="text-4xl mb-4">🌎</div>
                  <p>Click anywhere on the map to select a location</p>
                  <p className="text-sm mt-2">Then press "Analyze Point" to see detailed environmental analysis</p>
                </div>
              </div>
            )}
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