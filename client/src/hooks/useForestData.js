import { useState, useCallback } from 'react';

// Curated list of major deforestation hotspots, focusing on India as requested
const FOREST_HOTSPOTS = [
    // India - Western Ghats
    { city: "Western Ghats (North)", country: "India", lat: 19.0, lng: 73.5, value: 85, area: "Maharashtra", description: "High biodiversity area facing encroachment" },
    { city: "Western Ghats (Central)", country: "India", lat: 14.5, lng: 74.5, value: 78, area: "Karnataka", description: "Habitat fragmentation due to development" },
    { city: "Western Ghats (South)", country: "India", lat: 10.0, lng: 77.0, value: 72, area: "Kerala/Tamil Nadu", description: "Plantation expansion affecting forests" },

    // India - Northeast
    { city: "Assam Forests", country: "India", lat: 26.2, lng: 92.9, value: 92, area: "Assam", description: "Significant loss due to agriculture and flooding" },
    { city: "Meghalaya Hills", country: "India", lat: 25.5, lng: 91.3, value: 88, area: "Meghalaya", description: "Shifting cultivation impact" },
    { city: "Arunachal Frontier", country: "India", lat: 28.0, lng: 94.5, value: 65, area: "Arunachal Pradesh", description: "Infrastructure development pressure" },

    // India - Central
    { city: "Hasdeo Arand", country: "India", lat: 22.8, lng: 82.6, value: 95, area: "Chhattisgarh", description: "Mining activities threatening dense forests" },
    { city: "Kanha-Pench Corridor", country: "India", lat: 22.0, lng: 80.0, value: 60, area: "Madhya Pradesh", description: "Wildlife corridor degradation" },
    { city: "Odisha Forests", country: "India", lat: 20.5, lng: 84.5, value: 75, area: "Odisha", description: "Industrial and mining impact" },

    // India - North
    { city: "Uttarakhand Himalayas", country: "India", lat: 30.5, lng: 79.0, value: 55, area: "Uttarakhand", description: "Construction and tourism pressure" },
    { city: "Himachal Forests", country: "India", lat: 31.8, lng: 77.2, value: 50, area: "Himachal Pradesh", description: "Hydroelectric projects impact" },

    // Global Major Hotspots (Context)
    { city: "Amazon Rainforest", country: "Brazil", lat: -3.4653, lng: -62.2159, value: 98, area: "Amazonas", description: "Critical deforestation zone" },
    { city: "Congo Basin", country: "DRC", lat: -1.5, lng: 22.0, value: 90, area: "Equateur", description: "Logging and agriculture expansion" },
    { city: "Borneo Peatlands", country: "Indonesia", lat: -1.0, lng: 114.0, value: 94, area: "Kalimantan", description: "Palm oil plantation expansion" },
    { city: "Gran Chaco", country: "Paraguay", lat: -22.0, lng: -60.0, value: 82, area: "Boquerón", description: "Cattle ranching deforestation" },
    { city: "Eastern Australia", country: "Australia", lat: -28.0, lng: 150.0, value: 70, area: "NSW/Queensland", description: "Land clearing and bushfires" }
];

const useForestData = () => {
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadGlobeData = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Simulate API delay
        setTimeout(() => {
            const results = FOREST_HOTSPOTS.map((spot, index) => ({
                lat: spot.lat,
                lng: spot.lng,
                value: spot.value, // 0-100 scale of loss intensity
                city: spot.city,
                country: spot.country,
                date: new Date().toISOString(),
                parameter: 'forest_loss',
                locationId: `forest-${index}`,
                sensorId: index,
                description: spot.description,
                area: spot.area
            }));

            setMeasurements(results);
            setLoading(false);
        }, 800);
    }, []);

    // Mock history for chart
    const fetchSensorHistory = useCallback(async (sensorId) => {
        const spot = FOREST_HOTSPOTS[sensorId];
        if (!spot) return [];

        // Generate mock trend (increasing loss generally)
        const history = [];
        const now = new Date();
        for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Random fluctuation around the base value
            const fluctuation = (Math.random() - 0.5) * 10;
            const value = Math.max(0, Math.min(100, spot.value + fluctuation));

            history.push({
                date: date.toISOString(),
                value: value,
                parameter: 'forest_loss'
            });
        }
        return history;
    }, []);

    return {
        measurements,
        loading,
        error,
        loadGlobeData,
        fetchSensorHistory
    };
};

export default useForestData;
