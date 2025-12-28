import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const POLLUTANTS = [
    { id: 'pm25', name: 'PM2.5', unit: 'µg/m³', description: 'Fine Particulate Matter' },
    { id: 'pm10', name: 'PM10', unit: 'µg/m³', description: 'Coarse Particulate Matter' },
    { id: 'no2', name: 'NO₂', unit: 'ppb', description: 'Nitrogen Dioxide' },
    { id: 'o3', name: 'O₃', unit: 'ppb', description: 'Ozone' },
];

const AGGREGATIONS = [
    { id: 'daily', name: 'Daily' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'yearly', name: 'Yearly' },
];

const VISUALIZATION_MODES = [
    { id: 'hex', name: 'Hexbins' },
    { id: 'points', name: 'Points' },
    { id: 'bars', name: '3D Bars' },
    { id: 'heatmap', name: 'Heatmap' },
    { id: 'rings', name: 'Rings' },
    { id: 'labels', name: 'Labels' },
];

const RightSidebar = ({
    selectedPollutant,
    setSelectedPollutant,
    dateRange,
    setDateRange,
    selectedYear,
    setSelectedYear,
    availableYears,
    aggregation,
    setAggregation,
    visualizationMode,
    setVisualizationMode,
    onRefresh,
    isLoading,
    dataCount,
    hidePollutantSelector = false,
    locationCount = 50,
    setLocationCount,
    selectedDataset = 'air_quality',
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    return (
        <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            className="fixed right-0 top-0 h-full z-30 flex flex-row-reverse"
        >
            {/* Sidebar Content */}
            <AnimatePresence mode="wait">
                {!isCollapsed && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full bg-black/60 backdrop-blur-xl border-l border-white/10 overflow-hidden"
                    >
                        <div className="p-6 h-full overflow-y-auto">
                            {/* Header */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Data Controls
                                </h2>
                                <p className="text-xs text-white/50 mt-1">
                                    {isLoading ? 'Loading data...' : `${dataCount.toLocaleString()} locations`}
                                </p>
                            </div>

                            {/* Pollutant Selector */}
                            {!hidePollutantSelector && (
                                <div className="space-y-3 mb-8">
                                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Pollutant</h3>

                                    <div className="space-y-2">
                                        {POLLUTANTS.map((pollutant) => (
                                            <button
                                                key={pollutant.id}
                                                onClick={() => setSelectedPollutant(pollutant.id)}
                                                className={`
                        w-full px-4 py-3 rounded-lg text-left transition-all duration-200
                        ${selectedPollutant === pollutant.id
                                                        ? 'bg-emerald-500/30 border-emerald-500/50 text-white'
                                                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'}
                        border
                      `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium">{pollutant.name}</span>
                                                        <span className="text-xs text-white/40 ml-2">{pollutant.unit}</span>
                                                    </div>
                                                    {selectedPollutant === pollutant.id && (
                                                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/40 mt-0.5">{pollutant.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Date Range */}
                            <div className="space-y-3 mb-8">
                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Date Range</h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-white/50 mb-1 block">Start Date</label>
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            max={dateRange.end || today}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="
                        w-full px-3 py-2 rounded-lg
                        bg-white/10 border border-white/10
                        text-white text-sm
                        focus:outline-none focus:border-emerald-500/50
                        [color-scheme:dark]
                      "
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-white/50 mb-1 block">End Date</label>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            min={dateRange.start}
                                            max={today}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="
                        w-full px-3 py-2 rounded-lg
                        bg-white/10 border border-white/10
                        text-white text-sm
                        focus:outline-none focus:border-emerald-500/50
                        [color-scheme:dark]
                      "
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Year Selector */}
                            {availableYears.length > 0 && (
                                <div className="space-y-3 mb-8">
                                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Year</h3>

                                    <select
                                        value={selectedYear || ''}
                                        onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                                        className="
                      w-full px-3 py-2 rounded-lg
                      bg-white/10 border border-white/10
                      text-white text-sm
                      focus:outline-none focus:border-emerald-500/50
                      [color-scheme:dark]
                    "
                                    >
                                        <option value="">All Years</option>
                                        {availableYears.map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Aggregation */}
                            <div className="space-y-3 mb-8">
                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Aggregation</h3>

                                <div className="flex gap-2">
                                    {AGGREGATIONS.map((agg) => (
                                        <button
                                            key={agg.id}
                                            onClick={() => setAggregation(agg.id)}
                                            className={`
                        flex-1 px-3 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${aggregation === agg.id
                                                    ? 'bg-emerald-500/30 text-white border-emerald-500/50'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-transparent'}
                        border
                      `}
                                        >
                                            {agg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location Count Slider */}
                            {setLocationCount && (
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Locations</h3>
                                        <span className="text-sm font-medium text-emerald-400">{locationCount}</span>
                                    </div>

                                    <input
                                        type="range"
                                        min="10"
                                        max="59"
                                        value={locationCount}
                                        onChange={(e) => setLocationCount(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                                            [&::-webkit-slider-thumb]:appearance-none
                                            [&::-webkit-slider-thumb]:w-4
                                            [&::-webkit-slider-thumb]:h-4
                                            [&::-webkit-slider-thumb]:rounded-full
                                            [&::-webkit-slider-thumb]:bg-emerald-400
                                            [&::-webkit-slider-thumb]:cursor-pointer
                                            [&::-webkit-slider-thumb]:transition-transform
                                            [&::-webkit-slider-thumb]:hover:scale-125"
                                    />
                                    <div className="flex justify-between text-xs text-white/40">
                                        <span>10</span>
                                        <span>59 max</span>
                                    </div>
                                </div>
                            )}

                            {/* Visualization Mode */}
                            <div className="space-y-3 mb-8">
                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Visualization</h3>

                                <div className="grid grid-cols-2 gap-2">
                                    {VISUALIZATION_MODES.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setVisualizationMode(mode.id)}
                                            className={`
                        px-3 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${visualizationMode === mode.id
                                                    ? 'bg-emerald-500/30 text-white border-emerald-500/50'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-transparent'}
                        border
                      `}
                                        >
                                            {mode.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={onRefresh}
                                disabled={isLoading}
                                className={`
                  w-full px-4 py-3 rounded-lg font-medium text-sm
                  transition-all duration-200 ease-out
                  ${isLoading
                                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white active:scale-95'}
                  flex items-center justify-center gap-2
                `}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Data
                                    </>
                                )}
                            </button>

                            {/* Data Attribution */}
                            <div className="mt-8 pt-4 border-t border-white/10">
                                <p className="text-xs text-white/30 text-center">
                                    Data provided by {selectedDataset === 'solar_radiation'
                                        ? <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Open-Meteo</a>
                                        : <a href="https://openaq.org" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">OpenAQ</a>
                                    }
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="
          h-12 w-8 my-auto -mr-px
          bg-black/60 backdrop-blur-xl
          border border-white/10 border-r-0
          rounded-l-lg
          flex items-center justify-center
          text-white/60 hover:text-white
          transition-colors
        "
            >
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
        </motion.div>
    );
};

export default RightSidebar;
