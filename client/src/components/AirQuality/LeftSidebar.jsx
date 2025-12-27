import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LeftSidebar = ({
    autoRotate,
    setAutoRotate,
    rotationSpeed,
    setRotationSpeed,
    showAtmosphere,
    setShowAtmosphere,
    enableDayNight,
    setEnableDayNight,
    onZoomIn,
    onZoomOut,
    onResetCamera,
    onFocusSelected,
    hasSelectedLocation,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const ControlButton = ({ onClick, disabled, children, title }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
        w-full px-4 py-3 rounded-lg font-medium text-sm
        transition-all duration-200 ease-out
        ${disabled
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white active:scale-95'}
        border border-white/10
      `}
        >
            {children}
        </button>
    );

    const ToggleSwitch = ({ checked, onChange, label }) => (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                {label}
            </span>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only"
                />
                <div className={`
          w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? 'bg-emerald-500' : 'bg-white/20'}
        `} />
                <div className={`
          absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-lg
          transition-transform duration-200 ease-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `} />
            </div>
        </label>
    );

    return (
        <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            className="fixed left-0 top-0 h-full z-30 flex"
        >
            {/* Sidebar Content */}
            <AnimatePresence mode="wait">
                {!isCollapsed && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full bg-black/60 backdrop-blur-xl border-r border-white/10 overflow-hidden"
                    >
                        <div className="p-6 h-full overflow-y-auto">
                            {/* Header */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Globe Controls
                                </h2>
                                <p className="text-xs text-white/50 mt-1">Adjust visualization settings</p>
                            </div>

                            {/* Rotation Controls */}
                            <div className="space-y-4 mb-8">
                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Rotation</h3>

                                <ToggleSwitch
                                    checked={autoRotate}
                                    onChange={setAutoRotate}
                                    label="Auto Rotate"
                                />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Speed</span>
                                        <span className="text-white/80">{rotationSpeed.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="2"
                                        step="0.1"
                                        value={rotationSpeed}
                                        onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                                        disabled={!autoRotate}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-emerald-400
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:hover:scale-110
                      disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Camera Controls */}
                            <div className="space-y-3 mb-8">
                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Camera</h3>

                                <div className="grid grid-cols-2 gap-2">
                                    <ControlButton onClick={onZoomIn} title="Zoom In">
                                        <span className="flex items-center justify-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                            Zoom In
                                        </span>
                                    </ControlButton>

                                    <ControlButton onClick={onZoomOut} title="Zoom Out">
                                        <span className="flex items-center justify-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                            </svg>
                                            Zoom Out
                                        </span>
                                    </ControlButton>
                                </div>

                                <ControlButton onClick={onResetCamera} title="Reset Camera">
                                    <span className="flex items-center justify-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Reset View
                                    </span>
                                </ControlButton>

                                <ControlButton
                                    onClick={onFocusSelected}
                                    disabled={!hasSelectedLocation}
                                    title="Focus on Selected Location"
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Focus Location
                                    </span>
                                </ControlButton>
                            </div>

                            {/* Visual Settings */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Visual</h3>

                                <ToggleSwitch
                                    checked={showAtmosphere}
                                    onChange={setShowAtmosphere}
                                    label="Show Atmosphere"
                                />

                                <ToggleSwitch
                                    checked={enableDayNight}
                                    onChange={setEnableDayNight}
                                    label="Day/Night Cycle"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="
          h-12 w-8 my-auto -ml-px
          bg-black/60 backdrop-blur-xl
          border border-white/10 border-l-0
          rounded-r-lg
          flex items-center justify-center
          text-white/60 hover:text-white
          transition-colors
        "
            >
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </motion.div>
    );
};

export default LeftSidebar;
