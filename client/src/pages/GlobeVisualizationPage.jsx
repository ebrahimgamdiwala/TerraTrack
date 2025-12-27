import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    GlobeView,
    LeftSidebar,
    RightSidebar,
    AQILegend,
    LocationPanel,
    TimeControls,
} from '../components/AirQuality';
import useOpenAQData from '../hooks/useOpenAQData';
import useForestData from '../hooks/useForestData';

const GlobeVisualizationPage = () => {
    // Globe ref for external control
    const globeRef = useRef();

    // Dataset Selection
    const [selectedDataset, setSelectedDataset] = useState('air_quality'); // 'air_quality' or 'forests'

    // Air Quality Data Hook
    const aqData = useOpenAQData();

    // Forest Data Hook
    const forestData = useForestData();

    // Active Data Source
    const activeData = selectedDataset === 'air_quality' ? aqData : forestData;
    const {
        measurements,
        loading,
        error,
        loadGlobeData,
        refreshData,
        fetchSensorHistory,
    } = activeData;

    // Globe controls state
    const [autoRotate, setAutoRotate] = useState(true);
    const [rotationSpeed, setRotationSpeed] = useState(0.5);
    const [showAtmosphere, setShowAtmosphere] = useState(true);
    const [enableDayNight, setEnableDayNight] = useState(false);

    // Data controls state
    const [selectedPollutant, setSelectedPollutant] = useState('pm25');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedYear, setSelectedYear] = useState(null);
    const [aggregation, setAggregation] = useState('daily');
    const [visualizationMode, setVisualizationMode] = useState('hex'); // 'hex', 'points', 'bars', 'rings'

    // Location selection state
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [hoveredLocation, setHoveredLocation] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Time controls state
    const [currentDate, setCurrentDate] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Extract available dates from measurements
    const availableDates = useMemo(() => {
        return measurements
            .filter(m => m.date)
            .map(m => m.date.split('T')[0])
            .filter((date, index, self) => self.indexOf(date) === index);
    }, [measurements]);

    // Load initial data when dataset changes
    useEffect(() => {
        loadGlobeData(selectedPollutant);
        setSelectedLocation(null);
        setHistoricalData([]);
    }, [selectedDataset, loadGlobeData]);

    // Reload data when pollutant changes (only for AQ)
    useEffect(() => {
        if (selectedDataset === 'air_quality') {
            loadGlobeData(selectedPollutant, dateRange.start, dateRange.end);
        }
    }, [selectedDataset, selectedPollutant, dateRange.start, dateRange.end, loadGlobeData]);

    // Fetch historical data when location is selected
    useEffect(() => {
        const loadHistory = async () => {
            if (!selectedLocation?.sensorId && !selectedLocation?.locationId) {
                setHistoricalData([]);
                return;
            }

            setIsLoadingHistory(true);
            try {
                // Get last 30 days of data
                const endDate = new Date().toISOString().split('T')[0];
                const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                const id = selectedLocation.sensorId || selectedLocation.locationId;
                const data = await fetchSensorHistory(
                    id,
                    startDate,
                    endDate,
                    aggregation,
                    selectedPollutant
                );
                setHistoricalData(data);
            } catch (err) {
                console.error('Failed to load historical data:', err);
                setHistoricalData([]);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadHistory();
    }, [selectedLocation, aggregation, fetchSensorHistory, selectedPollutant]);

    // Handle location click
    const handleLocationClick = useCallback((location, coords) => {
        setSelectedLocation(location);
        setAutoRotate(false);
    }, []);

    // Handle location hover
    const handleLocationHover = useCallback((location) => {
        setHoveredLocation(location);
    }, []);

    // Handle close location panel
    const handleClosePanel = useCallback(() => {
        setSelectedLocation(null);
        setHistoricalData([]);
    }, []);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refreshData(selectedPollutant);
    }, [refreshData, selectedPollutant]);

    // Globe control handlers
    const handleZoomIn = useCallback(() => globeRef.current?.zoomIn(), []);
    const handleZoomOut = useCallback(() => globeRef.current?.zoomOut(), []);
    const handleResetCamera = useCallback(() => globeRef.current?.resetCamera(), []);
    const handleFocusSelected = useCallback(() => {
        if (selectedLocation) {
            globeRef.current?.focusOnLocation(selectedLocation.lat, selectedLocation.lng);
        }
    }, [selectedLocation]);

    // Filter measurements by current date if time control is active
    const filteredMeasurements = useMemo(() => {
        if (!currentDate) return measurements;
        return measurements.filter(m => {
            if (!m.date) return true;
            return m.date.startsWith(currentDate);
        });
    }, [measurements, currentDate]);

    return (
        <div className="fixed inset-0 bg-gray-950 overflow-hidden">
            {/* Main Globe */}
            <div className="absolute inset-0">
                <GlobeView
                    ref={globeRef}
                    data={filteredMeasurements}
                    visualizationMode={visualizationMode}
                    autoRotate={autoRotate}
                    autoRotateSpeed={rotationSpeed}
                    showAtmosphere={showAtmosphere}
                    enableDayNight={enableDayNight}
                    selectedLocation={selectedLocation}
                    onLocationClick={handleLocationClick}
                    onLocationHover={handleLocationHover}
                    // Pass dataset type to customize visualization (e.g. colors)
                    datasetType={selectedDataset}
                />
            </div>

            {/* Dataset Selector (Top Center) */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-30 flex bg-black/40 backdrop-blur-xl rounded-full p-1 border border-white/10"
            >
                <button
                    onClick={() => setSelectedDataset('air_quality')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedDataset === 'air_quality'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Air Quality
                </button>
                <button
                    onClick={() => setSelectedDataset('forests')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedDataset === 'forests'
                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Forests
                </button>
            </motion.div>

            {/* Left Sidebar - Globe Controls */}
            <LeftSidebar
                autoRotate={autoRotate}
                setAutoRotate={setAutoRotate}
                rotationSpeed={rotationSpeed}
                setRotationSpeed={setRotationSpeed}
                showAtmosphere={showAtmosphere}
                setShowAtmosphere={setShowAtmosphere}
                enableDayNight={enableDayNight}
                setEnableDayNight={setEnableDayNight}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetCamera={handleResetCamera}
                onFocusSelected={handleFocusSelected}
                hasSelectedLocation={!!selectedLocation}
            />

            {/* Right Sidebar - Data Controls */}
            <RightSidebar
                selectedPollutant={selectedPollutant}
                setSelectedPollutant={setSelectedPollutant}
                dateRange={dateRange}
                setDateRange={setDateRange}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                availableYears={aqData.availableYears}
                aggregation={aggregation}
                setAggregation={setAggregation}
                visualizationMode={visualizationMode}
                setVisualizationMode={setVisualizationMode}
                onRefresh={handleRefresh}
                isLoading={loading}
                dataCount={measurements.length}
                // Hide pollutant selector if forests selected
                hidePollutantSelector={selectedDataset === 'forests'}
            />

            {/* AQI Legend (Only for Air Quality) */}
            {selectedDataset === 'air_quality' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="fixed bottom-28 left-8 z-20"
                >
                    <AQILegend data={filteredMeasurements} pollutant={selectedPollutant} />
                </motion.div>
            )}

            {/* Location Detail Panel */}
            {selectedLocation && (
                <LocationPanel
                    location={selectedLocation}
                    historicalData={historicalData}
                    isLoadingHistory={isLoadingHistory}
                    onClose={handleClosePanel}
                    pollutant={selectedDataset === 'forests' ? 'forest_loss' : selectedPollutant}
                />
            )}

            {/* Time Controls */}
            {availableDates.length > 1 && (
                <TimeControls
                    availableDates={availableDates}
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    playbackSpeed={playbackSpeed}
                    setPlaybackSpeed={setPlaybackSpeed}
                />
            )}

            {/* Loading Overlay */}
            {loading && measurements.length === 0 && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <svg className="animate-spin h-16 w-16 text-emerald-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-xl font-medium text-white mb-2">Loading {selectedDataset === 'forests' ? 'Forest' : 'Air Quality'} Data</p>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50
            bg-red-500/20 backdrop-blur-xl border border-red-500/30
            rounded-xl px-6 py-4 max-w-md"
                >
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium text-red-400">Error Loading Data</p>
                            <p className="text-sm text-white/70 mt-1">{error}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Header with Back Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4"
            >
                <a
                    href="/"
                    className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-3
                        text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                    title="Back to Dashboard"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </a>

                <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 px-6 py-3">
                    <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Global Visualiser
                    </h1>
                </div>
            </motion.div>

            {/* Hover Info */}
            {hoveredLocation && !selectedLocation && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed bottom-40 left-1/2 -translate-x-1/2 z-10
            bg-black/60 backdrop-blur-xl rounded-xl border border-white/10
            px-4 py-2 pointer-events-none"
                >
                    <p className="text-sm text-white/80">
                        <span className="font-medium text-white">{hoveredLocation.city}</span>
                        <span className="mx-2 text-white/30">|</span>
                        {hoveredLocation.value?.toFixed(1)} {selectedDataset === 'forests' ? '%' : 'µg/m³'}
                    </p>
                </motion.div>
            )}
        </div>
    );
};

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
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-8">
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 max-w-2xl w-full text-white">
                        <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
                        <p className="mb-4 text-white/80">The application crashed. Here are the details:</p>
                        <pre className="bg-black/50 p-4 rounded overflow-auto text-xs font-mono text-red-300 mb-4">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <details className="text-xs text-white/50">
                            <summary className="cursor-pointer hover:text-white mb-2">Stack Trace</summary>
                            <pre className="bg-black/50 p-4 rounded overflow-auto font-mono">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white font-medium transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const GlobeVisualizationPageWithErrorBoundary = () => (
    <ErrorBoundary>
        <GlobeVisualizationPage />
    </ErrorBoundary>
);

export default GlobeVisualizationPageWithErrorBoundary;
