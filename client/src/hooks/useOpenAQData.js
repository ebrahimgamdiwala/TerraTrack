import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { MAJOR_CITIES } from '../utils/cities';

const OPEN_METEO_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';

// Parameter mapping: App ID -> Open-Meteo Parameter Name
const PARAM_MAPPING = {
    'pm25': 'pm2_5',
    'pm10': 'pm10',
    'no2': 'nitrogen_dioxide',
    'o3': 'ozone',
};

const useOpenAQData = () => {
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [availableYears, setAvailableYears] = useState([2024, 2023, 2022]); // Mock years for now

    // Fetch data for all cities
    const loadGlobeData = useCallback(async (parameterId = 'pm25') => {
        setLoading(true);
        setError(null);

        try {
            const openMeteoParam = PARAM_MAPPING[parameterId];
            if (!openMeteoParam) {
                throw new Error(`Unknown parameter: ${parameterId}`);
            }

            // Prepare coordinates for batch request (if supported) or parallel requests
            // Open-Meteo supports comma-separated lists for lat/lon
            const lats = MAJOR_CITIES.map(c => c.lat).join(',');
            const lngs = MAJOR_CITIES.map(c => c.lng).join(',');

            // Fetch current data
            const response = await axios.get(OPEN_METEO_API, {
                params: {
                    latitude: lats,
                    longitude: lngs,
                    current: openMeteoParam,
                    timezone: 'auto',
                }
            });

            // Parse response
            let results = [];
            const dataArray = Array.isArray(response.data) ? response.data : [response.data];

            results = dataArray.map((locationData, index) => {
                const cityInfo = MAJOR_CITIES[index];
                const value = locationData.current[openMeteoParam];

                return {
                    lat: cityInfo.lat,
                    lng: cityInfo.lng,
                    value: value,
                    city: cityInfo.city,
                    country: cityInfo.country,
                    date: locationData.current.time,
                    parameter: parameterId,
                    locationId: `${cityInfo.city}-${index}`, // Mock ID
                    sensorId: index, // Mock Sensor ID for history
                };
            });

            console.log(`Fetched ${results.length} locations from Open-Meteo`);
            setMeasurements(results);

        } catch (err) {
            console.error('Error fetching Open-Meteo data:', err);
            setError(err.message || 'Failed to fetch air quality data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch history for a specific location (mocked using Open-Meteo history)
    const fetchSensorHistory = useCallback(async (sensorId, startDate, endDate, aggregation, parameterId = 'pm25') => {
        try {
            const cityInfo = MAJOR_CITIES[sensorId];
            if (!cityInfo) throw new Error('Location not found');

            const openMeteoParam = PARAM_MAPPING[parameterId] || 'pm2_5';

            // Open-Meteo history
            const response = await axios.get(OPEN_METEO_API, {
                params: {
                    latitude: cityInfo.lat,
                    longitude: cityInfo.lng,
                    hourly: openMeteoParam,
                    start_date: startDate,
                    end_date: endDate,
                    timezone: 'auto',
                }
            });

            const data = response.data;
            const hourly = data.hourly;

            // Transform to chart format
            const historyData = hourly.time.map((time, i) => ({
                date: time,
                value: hourly[openMeteoParam][i],
                parameter: parameterId
            }));

            return historyData;

        } catch (err) {
            console.error('Error fetching history:', err);
            return [];
        }
    }, []);

    const refreshData = useCallback((parameterId) => {
        loadGlobeData(parameterId);
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

export default useOpenAQData;
