import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { getAQIColor } from './GlobeView';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const getPollutantLabel = (id) => {
    switch (id) {
        case 'pm25': return 'PM2.5';
        case 'pm10': return 'PM10';
        case 'no2': return 'NO₂';
        case 'o3': return 'O₃';
        case 'forest_loss': return 'Tree Cover Loss';
        default: return 'Value';
    }
};

const getUnit = (id) => {
    switch (id) {
        case 'pm25':
        case 'pm10':
            return 'µg/m³';
        case 'forest_loss':
            return '%'; // Intensity or percentage
        default:
            return 'ppb';
    }
};

const LocationPanel = ({
    location,
    historicalData = [],
    isLoadingHistory = false,
    onClose,
    pollutant = 'pm25',
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();

    // Handle navigation to TerraBot with location data
    const handleAnalyzeWithTerraBot = () => {
        const params = new URLSearchParams({
            city: location.city || '',
            country: location.country || '',
            lat: location.lat?.toString() || '',
            lng: location.lng?.toString() || '',
            value: location.value?.toString() || '',
            pollutant: pollutant
        });
        navigate(`/terrabot?${params.toString()}`);
    };

    // Compute statistics from historical data
    const stats = useMemo(() => {
        if (!historicalData || historicalData.length === 0) {
            return null;
        }

        const values = historicalData
            .filter(d => d)
            .map(d => d.value ?? d.summary?.avg)
            .filter(v => v !== null && v !== undefined);

        if (values.length === 0) return null;

        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            count: values.length,
        };
    }, [historicalData]);

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!historicalData || historicalData.length === 0) {
            return null;
        }

        const sortedData = [...historicalData].filter(d => d).sort((a, b) => {
            const dateA = new Date(a.date || a.period?.datetimeFrom?.utc || 0);
            const dateB = new Date(b.date || b.period?.datetimeFrom?.utc || 0);
            return dateA - dateB;
        });

        const labels = sortedData.map(d => {
            const date = new Date(d.date || d.period?.datetimeFrom?.utc || d.period?.datetimeFrom?.local);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const values = sortedData.map(d => d.value ?? d.summary?.avg ?? 0);
        const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;

        return {
            labels,
            datasets: [
                {
                    label: getPollutantLabel(pollutant),
                    data: values,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                },
                {
                    label: 'Average',
                    data: Array(values.length).fill(avgValue),
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                },
            ],
        };
    }, [historicalData, pollutant]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    maxTicksLimit: 6,
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                },
            },
        },
    };



    if (!location) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-[340px] top-20 bottom-20 w-80 z-40 
          bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10
          overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-semibold text-white truncate">
                                {location.city}
                            </h2>
                            <p className="text-sm text-white/60 mt-1 flex items-center gap-2">
                                <span>{location.country}</span>
                                {location.countryCode && (
                                    <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs">
                                        {location.countryCode}
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Coordinates */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {location.lat?.toFixed(4)}°, {location.lng?.toFixed(4)}°
                            </span>
                            {location.provider && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    {location.provider}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleAnalyzeWithTerraBot}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-white text-xs font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            🤖 Analyze with TerraBot
                        </button>
                    </div>
                </div>

                {/* Current Value */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                                Current {getPollutantLabel(pollutant)}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span
                                    className="text-4xl font-bold"
                                    style={{ color: getAQIColor(location.value) }}
                                >
                                    {location.value?.toFixed(1)}
                                </span>
                                <span className="text-sm text-white/50">{getUnit(pollutant)}</span>
                            </div>
                        </div>
                        {location.date && (
                            <div className="text-right">
                                <p className="text-xs text-white/40">Last Updated</p>
                                <p className="text-sm text-white/70">
                                    {new Date(location.date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-white/40">
                                    {new Date(location.date).toLocaleTimeString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expandable Historical Trend Section */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-6 py-3 flex items-center justify-between text-sm text-white/70 hover:text-white transition-colors border-b border-white/10"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            Historical Trend
                        </span>
                        <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex-1 overflow-y-auto p-4"
                            >
                                {isLoadingHistory ? (
                                    <div className="flex items-center justify-center py-12">
                                        <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                ) : chartData ? (
                                    <>
                                        {/* Chart */}
                                        <div className="h-48 mb-6">
                                            <Line data={chartData} options={chartOptions} />
                                        </div>

                                        {/* Statistics */}
                                        {stats && (
                                            <div className="grid grid-cols-4 gap-3">
                                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-white/40 mb-1">Min</p>
                                                    <p className="text-lg font-semibold text-emerald-400">
                                                        {stats.min.toFixed(1)}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-white/40 mb-1">Average</p>
                                                    <p className="text-lg font-semibold text-blue-400">
                                                        {stats.avg.toFixed(1)}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-white/40 mb-1">Max</p>
                                                    <p className="text-lg font-semibold text-red-400">
                                                        {stats.max.toFixed(1)}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-white/40 mb-1">Records</p>
                                                    <p className="text-lg font-semibold text-white">
                                                        {stats.count}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-12 text-white/40">
                                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <p>No historical data available</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Attribution */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <p className="text-xs text-white/30 text-center">
                        Data source: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Open-Meteo</a>
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LocationPanel;
