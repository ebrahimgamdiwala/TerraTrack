import { useMemo } from 'react';
import { getAQIColor } from './GlobeView';

// AQI breakpoints for PM2.5 (EPA standards)
const AQI_LEVELS = [
    { max: 12, label: 'Good', category: 'Good air quality', color: '#00e400' },
    { max: 35.4, label: 'Moderate', category: 'Acceptable', color: '#ffff00' },
    { max: 55.4, label: 'USG', category: 'Unhealthy for Sensitive Groups', color: '#ff7e00' },
    { max: 150.4, label: 'Unhealthy', category: 'Everyone may experience effects', color: '#ff0000' },
    { max: 250.4, label: 'Very Unhealthy', category: 'Health alert', color: '#8f3f97' },
    { max: 500, label: 'Hazardous', category: 'Emergency conditions', color: '#7e0023' },
];

const AQILegend = ({ data = [], pollutant = 'pm25' }) => {
    // Compute actual data range
    const dataRange = useMemo(() => {
        if (!data || data.length === 0) {
            return { min: 0, max: 100 };
        }

        const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
        if (values.length === 0) return { min: 0, max: 100 };

        return {
            min: Math.min(...values),
            max: Math.max(...values),
        };
    }, [data]);

    // Get relevant AQI levels based on data range
    const relevantLevels = useMemo(() => {
        return AQI_LEVELS.filter(level => {
            const prevMax = AQI_LEVELS[AQI_LEVELS.indexOf(level) - 1]?.max || 0;
            return dataRange.max >= prevMax;
        });
    }, [dataRange]);

    const getPollutantLabel = (id) => {
        switch (id) {
            case 'pm25': return 'PM2.5';
            case 'pm10': return 'PM10';
            case 'no2': return 'NO₂';
            case 'o3': return 'O₃';
            default: return 'AQI';
        }
    };

    const getUnit = (id) => {
        switch (id) {
            case 'pm25':
            case 'pm10':
                return 'µg/m³';
            case 'no2':
            case 'o3':
                return 'ppb';
            default:
                return '';
        }
    };

    return (
        <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 p-4 w-64">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                    {getPollutantLabel(pollutant)} Scale
                </h3>
                <span className="text-xs text-white/50">{getUnit(pollutant)}</span>
            </div>

            {/* Color Gradient Bar */}
            <div
                className="h-3 rounded-full mb-3"
                style={{
                    background: `linear-gradient(to right, ${AQI_LEVELS.map(l => l.color).join(', ')})`,
                }}
            />

            {/* Range Labels */}
            <div className="flex justify-between text-xs text-white/60 mb-4">
                <span>{dataRange.min.toFixed(1)}</span>
                <span>{dataRange.max.toFixed(1)}</span>
            </div>

            {/* Level Legend */}
            <div className="space-y-2">
                {relevantLevels.map((level, index) => {
                    const prevMax = AQI_LEVELS[index - 1]?.max || 0;
                    return (
                        <div
                            key={level.label}
                            className="flex items-center gap-3"
                        >
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: level.color }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-white/80 truncate">
                                        {level.label}
                                    </span>
                                    <span className="text-xs text-white/40">
                                        {prevMax.toFixed(0)}-{level.max.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Data Stats */}
            {data.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-xs text-white/40">Min</p>
                            <p className="text-sm font-medium text-white">{dataRange.min.toFixed(1)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-white/40">Avg</p>
                            <p className="text-sm font-medium text-white">
                                {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-white/40">Max</p>
                            <p className="text-sm font-medium text-white">{dataRange.max.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AQILegend;
