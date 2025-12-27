import { useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, useState } from 'react';
import Globe from 'react-globe.gl';

// AQI color scale based on PM2.5 values (EPA standards)
const getAQIColor = (value) => {
    if (value <= 12) return '#00e400'; // Good - Green
    if (value <= 35.4) return '#ffff00'; // Moderate - Yellow
    if (value <= 55.4) return '#ff7e00'; // Unhealthy for Sensitive - Orange
    if (value <= 150.4) return '#ff0000'; // Unhealthy - Red
    if (value <= 250.4) return '#8f3f97'; // Very Unhealthy - Purple
    return '#7e0023'; // Hazardous - Maroon
};

// Compute color scale from data range
const computeColorScale = (data) => {
    if (!data || data.length === 0) return { min: 0, max: 100 };

    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return { min: 0, max: 100 };

    const min = Math.min(...values);
    const max = Math.max(...values);

    return { min, max };
};

const GlobeView = forwardRef(({
    data = [],
    visualizationMode = 'hex', // 'hex', 'points', 'bars', 'rings', 'labels'
    autoRotate = true,
    autoRotateSpeed = 0.5,
    showAtmosphere = true,
    enableDayNight = false,
    selectedLocation = null,
    onLocationClick = () => { },
    onLocationHover = () => { },
    datasetType = 'air_quality',
}, ref) => {
    const globeRef = useRef();
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Expose globe methods to parent
    useImperativeHandle(ref, () => ({
        getGlobe: () => globeRef.current,
        focusOnLocation: (lat, lng, altitude = 1.5) => {
            if (globeRef.current) {
                globeRef.current.pointOfView({ lat, lng, altitude }, 1000);
            }
        },
        resetCamera: () => {
            if (globeRef.current) {
                globeRef.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 2.0 }, 1000);
            }
        },
        zoomIn: () => {
            if (globeRef.current) {
                const currentPov = globeRef.current.pointOfView();
                globeRef.current.pointOfView({
                    ...currentPov,
                    altitude: Math.max(0.5, currentPov.altitude - 0.5)
                }, 500);
            }
        },
        zoomOut: () => {
            if (globeRef.current) {
                const currentPov = globeRef.current.pointOfView();
                globeRef.current.pointOfView({
                    ...currentPov,
                    altitude: Math.min(4, currentPov.altitude + 0.5)
                }, 500);
            }
        },
        getPointOfView: () => globeRef.current?.pointOfView(),
    }));

    // Initialize globe settings
    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 2.0 });
            const controls = globeRef.current.controls();
            if (controls) {
                controls.autoRotate = autoRotate;
                controls.autoRotateSpeed = autoRotateSpeed;
                controls.enableZoom = true;
                controls.enablePan = true;
                controls.minDistance = 101;
                controls.maxDistance = 500;
            }
        }
    }, []);

    // Update auto-rotation settings
    useEffect(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            if (controls) {
                controls.autoRotate = autoRotate;
                controls.autoRotateSpeed = autoRotateSpeed;
            }
        }
    }, [autoRotate, autoRotateSpeed]);

    // Focus on selected location
    useEffect(() => {
        if (selectedLocation && globeRef.current) {
            globeRef.current.pointOfView(
                { lat: selectedLocation.lat, lng: selectedLocation.lng, altitude: 1.5 },
                1000
            );
        }
    }, [selectedLocation]);

    // Helper to get color based on dataset type
    const getColor = useCallback((value) => {
        if (datasetType === 'forests') {
            // Forest Loss Scale (Green -> Red)
            if (value > 80) return '#ef4444'; // High loss (Red)
            if (value > 60) return '#f97316'; // Orange
            if (value > 40) return '#eab308'; // Yellow
            if (value > 20) return '#84cc16'; // Lime
            return '#22c55e'; // Low loss (Green)
        }
        return getAQIColor(value);
    }, [datasetType]);

    // Tooltip content
    const getTooltip = useCallback((d) => {
        if (!d) return '';

        // For hexbin data
        if (d.points) {
            const point = d.points[0];
            const avgValue = d.sumWeight / d.points.length;
            return `
        <div style="background: rgba(0,0,0,0.85); padding: 12px; border-radius: 8px; color: white; font-family: sans-serif;">
          <div style="font-weight: bold; margin-bottom: 4px;">${point?.city || 'Unknown'}</div>
          <div style="font-size: 12px; color: #aaa;">${point?.country || 'Unknown'}</div>
          <div style="font-size: 20px; font-weight: bold; color: ${getColor(avgValue)}; margin: 8px 0;">
            ${avgValue.toFixed(1)} ${datasetType === 'forests' ? '%' : 'µg/m³'}
          </div>
          <div style="font-size: 11px; color: #666;">${d.points.length} stations</div>
        </div>
      `;
        }

        // For point/ring/label data
        return `
      <div style="background: rgba(0,0,0,0.85); padding: 12px; border-radius: 8px; color: white; font-family: sans-serif;">
        <div style="font-weight: bold; margin-bottom: 4px;">${d.city || 'Unknown'}</div>
        <div style="font-size: 12px; color: #aaa;">${d.country || 'Unknown'}</div>
        <div style="font-size: 20px; font-weight: bold; color: ${getColor(d.value)}; margin: 8px 0;">
          ${d.value?.toFixed(1)} ${datasetType === 'forests' ? '%' : 'µg/m³'}
        </div>
      </div>
    `;
    }, [getColor, datasetType]);

    // Handle clicks
    const handlePointClick = useCallback((point) => {
        if (point) {
            onLocationClick(point);
        }
    }, [onLocationClick]);

    const handleHexClick = useCallback((hex) => {
        if (hex && hex.points && hex.points.length > 0) {
            onLocationClick(hex.points[0]);
        }
    }, [onLocationClick]);

    // Globe textures
    const globeImageUrl = '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
    const bumpImageUrl = '//unpkg.com/three-globe/example/img/earth-topology.png';

    // Prepare data with colors
    const globeData = useMemo(() => data.map(d => ({
        ...d,
        color: getColor(d.value)
    })), [data, getColor]);

    return (
        <div className="w-full h-full" style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)' }}>
            <Globe
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl={globeImageUrl}
                bumpImageUrl={bumpImageUrl}
                backgroundColor="rgba(0,0,0,0)"
                showAtmosphere={showAtmosphere}
                atmosphereColor="lightskyblue"
                atmosphereAltitude={0.15}

                // Hexbin layer (Used for 'hex' and 'bars' modes)
                hexBinPointsData={visualizationMode === 'hex' || visualizationMode === 'bars' ? globeData : []}
                hexBinPointLat={d => d.lat}
                hexBinPointLng={d => d.lng}
                hexBinPointWeight={d => d.value || 1}
                hexBinResolution={visualizationMode === 'bars' ? 12 : 3}
                hexAltitude={d => {
                    if (visualizationMode === 'bars') {
                        // Taller bars for 'bars' mode - increased scaling
                        return Math.max(0.1, Math.min(d.sumWeight * 0.01, 2.0));
                    }
                    // Standard altitude for 'hex' mode
                    return Math.max(0.01, Math.min(d.sumWeight * 0.001, 0.3));
                }}
                hexTopColor={d => getColor(d.sumWeight / (d.points?.length || 1))}
                hexSideColor={d => getColor(d.sumWeight / (d.points?.length || 1))}
                hexLabel={getTooltip}
                onHexClick={handleHexClick}
                hexBinMerge={false}
                hexMargin={visualizationMode === 'bars' ? 0.2 : 0.1}

                // Points layer (Used for 'points' mode)
                pointsData={visualizationMode === 'points' ? globeData : []}
                pointLat={d => d.lat}
                pointLng={d => d.lng}
                pointAltitude={0.01}
                pointRadius={0.5}
                pointColor={d => d.color}
                pointLabel={getTooltip}
                onPointClick={handlePointClick}

                // Rings layer (Used for 'rings' mode)
                ringsData={visualizationMode === 'rings' ? globeData : []}
                ringLat={d => d.lat}
                ringLng={d => d.lng}
                ringColor={d => d.color}
                ringMaxRadius={d => Math.max(1, d.value * 0.1)}
                ringPropagationSpeed={2}
                ringRepeatPeriod={1000}

                // Labels layer (Used for 'labels' mode)
                labelsData={visualizationMode === 'labels' ? globeData : []}
                labelLat={d => d.lat}
                labelLng={d => d.lng}
                labelText={d => `${d.city || ''} (${d.value?.toFixed(0)})`}
                labelSize={d => Math.max(0.5, Math.min(d.value * 0.05, 2))}
                labelDotRadius={0.3}
                labelColor={d => getColor(d.value)}
                labelResolution={2}

                animateIn={true}
            />
        </div>
    );
});

GlobeView.displayName = 'GlobeView';

export default GlobeView;
export { getAQIColor, computeColorScale };
