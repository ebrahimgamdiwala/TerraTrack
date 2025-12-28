import { useState, useCallback } from 'react';
import axios from 'axios';
import { MAJOR_CITIES } from '../utils/cities';

const SATELLITE_RADIATION_API = 'https://satellite-api.open-meteo.com/v1/archive';

// Parameter mapping for solar radiation
const RADIATION_PARAMS = {
    'shortwave_radiation': 'shortwave_radiation',
    'direct_radiation': 'direct_radiation',
    'diffuse_radiation': 'diffuse_radiation',
};

const useSolarRadiationData = () => {
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [availableYears] = useState([2024, 2023, 2022]);

    // Fetch data for cities (limited by locationCount)
    const loadGlobeData = useCallback(async (parameterId = 'shortwave_radiation', startDate = null, endDate = null, locationCount = 50) => {
        setLoading(true);
        setError(null);

        try {
            const radiationParam = RADIATION_PARAMS[parameterId] || 'shortwave_radiation';

            // Limit cities to locationCount
            const cities = MAJOR_CITIES.slice(0, Math.min(locationCount, MAJOR_CITIES.length));

            // Use fixed historical dates that are guaranteed to be in the archive
            const startDay = '2024-06-01';
            const endDay = '2024-06-02';

            const start = startDate || startDay;
            const end = endDate || endDay;

            // Fetch data for each city individually (API doesn't support batch coordinates)
            const fetchPromises = cities.map(async (cityInfo, index) => {
                try {
                    const response = await axios.get(SATELLITE_RADIATION_API, {
                        params: {
                            latitude: cityInfo.lat,
                            longitude: cityInfo.lng,
                            hourly: radiationParam,
                            start_date: start,
                            end_date: end,
                            timezone: 'auto',
                        }
                    });

                    const hourly = response.data.hourly?.[radiationParam];
                    let value = 0;

                    if (hourly && hourly.length > 0) {
                        // Get daily average (filter nulls)
                        const validValues = hourly.filter(v => v !== null && v !== undefined);
                        value = validValues.length > 0
                            ? validValues.reduce((a, b) => a + b, 0) / validValues.length
                            : 0;
                    }

                    return {
                        lat: cityInfo.lat,
                        lng: cityInfo.lng,
                        value: value,
                        city: cityInfo.city,
                        country: cityInfo.country,
                        date: response.data.hourly?.time?.[hourly?.length - 1] || end,
                        parameter: parameterId,
                        locationId: `${cityInfo.city}-${index}`,
                        sensorId: index,
                    };
                } catch (cityErr) {
                    console.warn(`Failed to fetch data for ${cityInfo.city}:`, cityErr.message);
                    return null;
                }
            });

            // Wait for all requests to complete
            const results = (await Promise.all(fetchPromises)).filter(r => r !== null);

            console.log(`Fetched ${results.length} solar radiation locations from Open-Meteo`);
            setMeasurements(results);

        } catch (err) {
            console.error('Error fetching solar radiation data:', err);
            setError(err.message || 'Failed to fetch solar radiation data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch history for a specific location
    const fetchSensorHistory = useCallback(async (sensorId, startDate, endDate, aggregation, parameterId = 'shortwave_radiation') => {
        try {
            const cityInfo = MAJOR_CITIES[sensorId];
            if (!cityInfo) throw new Error('Location not found');

            const radiationParam = RADIATION_PARAMS[parameterId] || 'shortwave_radiation';

            const response = await axios.get(SATELLITE_RADIATION_API, {
                params: {
                    latitude: cityInfo.lat,
                    longitude: cityInfo.lng,
                    hourly: radiationParam,
                    start_date: startDate,
                    end_date: endDate,
                    models: 'satellite_radiation_seamless',
                    timezone: 'auto',
                }
            });

            const data = response.data;
            const hourly = data.hourly;

            // Transform to chart format
            const historyData = hourly.time.map((time, i) => ({
                date: time,
                value: hourly[radiationParam][i],
                parameter: parameterId
            }));

            return historyData;

        } catch (err) {
            console.error('Error fetching solar radiation history:', err);
            return [];
        }
    }, []);

    const refreshData = useCallback((parameterId, startDate, endDate, locationCount) => {
        loadGlobeData(parameterId, startDate, endDate, locationCount);
    }, [loadGlobeData]);

    return {
        measurements,
        loading,
        error,
        availableYears,
        loadGlobeData,
        refreshData,
        fetchSensorHistory,
    };
};

export default useSolarRadiationData;
