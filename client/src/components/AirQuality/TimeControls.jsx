import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

const TimeControls = ({
    availableDates = [],
    currentDate,
    setCurrentDate,
    isPlaying,
    setIsPlaying,
    playbackSpeed = 1,
    setPlaybackSpeed,
    aggregation = 'daily',
}) => {
    const intervalRef = useRef(null);

    // Sort dates and get unique ones based on aggregation
    const sortedDates = useMemo(() => {
        const unique = [...new Set(availableDates.filter(Boolean))];

        // Transform dates based on aggregation
        if (aggregation === 'monthly') {
            const monthlyDates = unique.map(d => d.substring(0, 7)); // YYYY-MM
            return [...new Set(monthlyDates)].sort();
        } else if (aggregation === 'yearly') {
            const yearlyDates = unique.map(d => d.substring(0, 4)); // YYYY
            return [...new Set(yearlyDates)].sort();
        }

        return unique.sort((a, b) => new Date(a) - new Date(b));
    }, [availableDates, aggregation]);

    // Current index in the sorted dates array
    const currentIndex = useMemo(() => {
        if (!currentDate || sortedDates.length === 0) return 0;
        const idx = sortedDates.findIndex(d => d === currentDate);
        return idx >= 0 ? idx : 0;
    }, [currentDate, sortedDates]);

    // Handle playback
    useEffect(() => {
        if (isPlaying && sortedDates.length > 1) {
            intervalRef.current = setInterval(() => {
                const nextIndex = (currentIndex + 1) % sortedDates.length;
                setCurrentDate(sortedDates[nextIndex]);
            }, 2000 / playbackSpeed);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, currentIndex, sortedDates, playbackSpeed, setCurrentDate]);

    const handleSliderChange = (e) => {
        const index = parseInt(e.target.value);
        if (sortedDates[index]) {
            setCurrentDate(sortedDates[index]);
        }
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentDate(sortedDates[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        if (currentIndex < sortedDates.length - 1) {
            setCurrentDate(sortedDates[currentIndex + 1]);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            if (aggregation === 'yearly') {
                return dateStr; // Just return YYYY
            }
            if (aggregation === 'monthly') {
                const [year, month] = dateStr.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                });
            }
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    // Don't render if no dates available
    if (sortedDates.length < 2) {
        return null;
    }

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20
        bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10
        px-6 py-4 max-w-[600px] w-[90%]"
        >
            <div className="flex items-center gap-4">
                {/* Play/Pause Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 
              transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={handlePlayPause}
                        className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 
              transition-colors border border-emerald-500/30"
                    >
                        {isPlaying ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="5" width="4" height="14" rx="1" />
                                <rect x="14" y="5" width="4" height="14" rx="1" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex === sortedDates.length - 1}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 
              transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Timeline Slider */}
                <div className="flex-1 flex items-center gap-3">
                    <span className="text-xs text-white/40 whitespace-nowrap min-w-[70px]">
                        {formatDate(sortedDates[0])}
                    </span>

                    <div className="flex-1 relative">
                        <input
                            type="range"
                            min="0"
                            max={Math.max(0, sortedDates.length - 1)}
                            value={currentIndex}
                            onChange={handleSliderChange}
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
                    </div>

                    <span className="text-xs text-white/40 whitespace-nowrap min-w-[70px] text-right">
                        {formatDate(sortedDates[sortedDates.length - 1])}
                    </span>
                </div>

                {/* Current Date Display */}
                <div className="text-center min-w-[100px]">
                    <p className="text-sm font-semibold text-white">
                        {formatDate(sortedDates[currentIndex])}
                    </p>
                    <p className="text-xs text-white/40">
                        {currentIndex + 1} / {sortedDates.length}
                    </p>
                </div>

                {/* Speed Control */}
                <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 
            text-white text-xs focus:outline-none focus:border-emerald-500/50
            [color-scheme:dark]"
                >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                </select>
            </div>
        </motion.div>
    );
};

export default TimeControls;
