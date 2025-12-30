import axios from 'axios';

// WAQI (World Air Quality Index) - Free public API
const WAQI_BASE_URL = 'https://api.waqi.info';
const WAQI_TOKEN = 'demo'; // Using demo token, get your own at: https://aqicn.org/data-platform/token/

class WAQIService {
  // Get air quality for city
  async getAirQualityByCity(city) {
    try {
      const response = await axios.get(`${WAQI_BASE_URL}/feed/${city}/?token=${WAQI_TOKEN}`);
      if (response.data.status === 'ok') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('WAQI city search error:', error);
      return null;
    }
  }

  // Get air quality by coordinates
  async getAirQualityByCoords(lat, lon) {
    try {
      const response = await axios.get(`${WAQI_BASE_URL}/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`);
      if (response.data.status === 'ok') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('WAQI geo search error:', error);
      return null;
    }
  }

  // Generate alerts from WAQI data
  generateAlerts(waqiData) {
    if (!waqiData) return [];

    const alerts = [];
    const aqi = waqiData.aqi;

    // AQI-based alerts
    if (aqi > 300) {
      alerts.push({
        type: 'danger',
        severity: 'critical',
        title: '🚨 Hazardous Air Quality',
        message: `AQI: ${aqi} - Health warnings of emergency conditions. Everyone may experience serious health effects.`,
        category: 'air',
        icon: '☠️'
      });
    } else if (aqi > 200) {
      alerts.push({
        type: 'danger',
        severity: 'high',
        title: '⚠️ Very Unhealthy Air',
        message: `AQI: ${aqi} - Health alert: everyone may experience more serious health effects.`,
        category: 'air',
        icon: '🔴'
      });
    } else if (aqi > 150) {
      alerts.push({
        type: 'warning',
        severity: 'high',
        title: '😷 Unhealthy Air Quality',
        message: `AQI: ${aqi} - Everyone may begin to experience health effects; sensitive groups at greater risk.`,
        category: 'air',
        icon: '🟠'
      });
    } else if (aqi > 100) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: '⚠️ Unhealthy for Sensitive Groups',
        message: `AQI: ${aqi} - Members of sensitive groups may experience health effects.`,
        category: 'air',
        icon: '🟡'
      });
    } else if (aqi > 50) {
      alerts.push({
        type: 'info',
        severity: 'low',
        title: '✅ Moderate Air Quality',
        message: `AQI: ${aqi} - Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.`,
        category: 'air',
        icon: '🟢'
      });
    }

    // Pollutant-specific alerts
    const iaqi = waqiData.iaqi || {};
    
    if (iaqi.pm25 && iaqi.pm25.v > 55) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: '💨 High PM2.5 Levels',
        message: `PM2.5: ${iaqi.pm25.v} µg/m³ - Fine particulate matter levels are elevated.`,
        category: 'air',
        icon: '🌫️'
      });
    }

    if (iaqi.pm10 && iaqi.pm10.v > 154) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: '💨 High PM10 Levels',
        message: `PM10: ${iaqi.pm10.v} µg/m³ - Coarse particulate matter levels are elevated.`,
        category: 'air',
        icon: '🌫️'
      });
    }

    if (iaqi.o3 && iaqi.o3.v > 100) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: '🌤️ High Ozone Levels',
        message: `O3: ${iaqi.o3.v} ppb - Ground-level ozone is elevated. Avoid outdoor activities during peak hours.`,
        category: 'air',
        icon: '☀️'
      });
    }

    if (iaqi.no2 && iaqi.no2.v > 100) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: '🏭 High Nitrogen Dioxide',
        message: `NO2: ${iaqi.no2.v} ppb - Traffic-related pollution is elevated.`,
        category: 'air',
        icon: '🚗'
      });
    }

    return alerts;
  }

  // Get detailed pollutant info
  getPollutantDetails(waqiData) {
    if (!waqiData || !waqiData.iaqi) return [];

    const iaqi = waqiData.iaqi;
    const pollutants = [];

    const pollutantMap = {
      pm25: { name: 'PM2.5', unit: 'µg/m³', icon: '💨' },
      pm10: { name: 'PM10', unit: 'µg/m³', icon: '💨' },
      o3: { name: 'Ozone', unit: 'ppb', icon: '🌤️' },
      no2: { name: 'NO₂', unit: 'ppb', icon: '🏭' },
      so2: { name: 'SO₂', unit: 'ppb', icon: '🏭' },
      co: { name: 'CO', unit: 'ppm', icon: '🚗' }
    };

    Object.keys(pollutantMap).forEach(key => {
      if (iaqi[key]) {
        pollutants.push({
          name: pollutantMap[key].name,
          value: iaqi[key].v,
          unit: pollutantMap[key].unit,
          icon: pollutantMap[key].icon
        });
      }
    });

    return pollutants;
  }

  // Get AQI level description
  getAQIInfo(aqi) {
    if (aqi <= 50) {
      return {
        level: 'Good',
        description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
        color: 'green'
      };
    } else if (aqi <= 100) {
      return {
        level: 'Moderate',
        description: 'Air quality is acceptable. However, there may be a risk for some people.',
        color: 'yellow'
      };
    } else if (aqi <= 150) {
      return {
        level: 'Unhealthy for Sensitive Groups',
        description: 'Members of sensitive groups may experience health effects.',
        color: 'orange'
      };
    } else if (aqi <= 200) {
      return {
        level: 'Unhealthy',
        description: 'Some members of the general public may experience health effects.',
        color: 'red'
      };
    } else if (aqi <= 300) {
      return {
        level: 'Very Unhealthy',
        description: 'Health alert: The risk of health effects is increased for everyone.',
        color: 'purple'
      };
    } else {
      return {
        level: 'Hazardous',
        description: 'Health warning of emergency conditions: everyone is more likely to be affected.',
        color: 'maroon'
      };
    }
  }
}

export default new WAQIService();
