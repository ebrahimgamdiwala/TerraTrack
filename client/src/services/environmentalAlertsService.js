import axios from 'axios';
import waqiService from './waqiService';
import newsService from './newsService';
import emissionsService from './emissionsService';

class EnvironmentalAlertsService {
  constructor() {
    this.openaqApiKey = import.meta.env.VITE_OPENAQ_API_KEY;
  }

  // Get comprehensive environmental alerts
  async getComprehensiveAlerts(latitude, longitude, locationName) {
    const alerts = [];

    try {
      // 1. Get air quality alerts from WAQI
      const waqiData = await waqiService.getAirQualityByCoords(latitude, longitude);
      if (waqiData) {
        const waqiAlerts = waqiService.generateAlerts(waqiData);
        alerts.push(...waqiAlerts);
      }

      // 2. Get OpenAQ data (real measurements)
      try {
        const openaqAlerts = await this.getOpenAQAlerts(latitude, longitude);
        alerts.push(...openaqAlerts);
      } catch (error) {
        console.log('OpenAQ data unavailable');
      }

      // 3. Get environmental news alerts
      try {
        const newsAlerts = await this.getNewsAlerts(locationName);
        alerts.push(...newsAlerts);
      } catch (error) {
        console.log('News alerts unavailable');
      }

      // 4. Get emissions-based alerts
      try {
        const emissionsAlerts = await emissionsService.generateAlerts(locationName);
        alerts.push(...emissionsAlerts);
      } catch (error) {
        console.log('Emissions alerts unavailable');
      }

      return alerts;
    } catch (error) {
      console.error('Error fetching comprehensive alerts:', error);
      return alerts;
    }
  }

  // Get OpenAQ alerts
  async getOpenAQAlerts(latitude, longitude) {
    try {
      const response = await axios.get('https://api.openaq.org/v2/latest', {
        params: {
          coordinates: `${latitude},${longitude}`,
          radius: 25000, // 25km radius
          limit: 5
        },
        headers: {
          'X-API-Key': this.openaqApiKey
        }
      });

      const alerts = [];
      const results = response.data.results || [];

      results.forEach(station => {
        const measurements = station.measurements || [];
        measurements.forEach(measure => {
          if (measure.parameter === 'pm25' && measure.value > 35) {
            alerts.push({
              type: 'warning',
              severity: 'medium',
              title: `📍 High PM2.5 at ${station.location}`,
              message: `PM2.5: ${measure.value.toFixed(1)} µg/m³ - Measured ${this.getTimeAgo(measure.lastUpdated)}`,
              category: 'air',
              icon: '💨'
            });
          }
          if (measure.parameter === 'pm10' && measure.value > 154) {
            alerts.push({
              type: 'warning',
              severity: 'medium',
              title: `📍 High PM10 at ${station.location}`,
              message: `PM10: ${measure.value.toFixed(1)} µg/m³ - Measured ${this.getTimeAgo(measure.lastUpdated)}`,
              category: 'air',
              icon: '💨'
            });
          }
        });
      });

      return alerts;
    } catch (error) {
      console.error('OpenAQ error:', error);
      return [];
    }
  }

  // Get news-based alerts
  async getNewsAlerts(locationName) {
    try {
      const news = await newsService.getEnvironmentalNews({
        q: `environmental disaster OR pollution OR climate emergency ${locationName}`,
        pageSize: 5,
        sortBy: 'publishedAt'
      });

      const alerts = [];
      const articles = news.articles || [];

      // Look for urgent keywords
      articles.forEach(article => {
        const title = article.title.toLowerCase();
        const isUrgent = title.includes('emergency') || title.includes('disaster') || 
                        title.includes('warning') || title.includes('alert') ||
                        title.includes('extreme') || title.includes('critical');

        if (isUrgent) {
          alerts.push({
            type: 'news',
            severity: 'high',
            title: `📰 ${article.title}`,
            message: article.description || 'Click to read more',
            category: 'ecosystem',
            icon: '🌍',
            url: article.url,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt).toLocaleDateString()
          });
        }
      });

      return alerts.slice(0, 3); // Limit to 3 news alerts
    } catch (error) {
      console.error('News alerts error:', error);
      return [];
    }
  }

  // Helper: Get time ago string
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  // Get WAQI data for display
  async getWAQIData(latitude, longitude) {
    return await waqiService.getAirQualityByCoords(latitude, longitude);
  }

  // Get pollutant details
  getPollutantDetails(waqiData) {
    return waqiService.getPollutantDetails(waqiData);
  }
}

export default new EnvironmentalAlertsService();
