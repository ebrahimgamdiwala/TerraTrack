import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '8549f9f62047230fd8d0549dcd028c06';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

class WeatherService {
  // Get current weather and air quality
  async getCurrentWeatherAndAir(lat, lon) {
    try {
      const [weather, airQuality] = await Promise.all([
        axios.get(`${BASE_URL}/weather`, {
          params: { lat, lon, appid: API_KEY, units: 'metric' }
        }),
        axios.get(`${BASE_URL}/air_pollution`, {
          params: { lat, lon, appid: API_KEY }
        })
      ]);

      return {
        weather: weather.data,
        airQuality: airQuality.data
      };
    } catch (error) {
      console.error('Error fetching current weather and air:', error);
      // Return mock data if API fails
      return this.getMockWeatherData(lat, lon);
    }
  }

  // Get air quality forecast (next 5 days)
  async getAirQualityForecast(lat, lon) {
    try {
      const response = await axios.get(`${BASE_URL}/air_pollution/forecast`, {
        params: { lat, lon, appid: API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching air quality forecast:', error);
      return null;
    }
  }

  // Get air quality history
  async getAirQualityHistory(lat, lon, startTimestamp, endTimestamp) {
    try {
      const response = await axios.get(`${BASE_URL}/air_pollution/history`, {
        params: {
          lat,
          lon,
          start: startTimestamp,
          end: endTimestamp,
          appid: API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching air quality history:', error);
      return null;
    }
  }

  // Get weather alerts (via One Call API)
  async getWeatherAlerts(lat, lon) {
    try {
      const response = await axios.get(`${BASE_URL}/onecall`, {
        params: {
          lat,
          lon,
          exclude: 'minutely',
          appid: API_KEY,
          units: 'metric'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      // Fallback if One Call API not available
      return null;
    }
  }

  // Get 5-day weather forecast
  async getWeatherForecast(lat, lon) {
    try {
      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: { lat, lon, appid: API_KEY, units: 'metric' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return null;
    }
  }

  // Mock data for when API is unavailable
  getMockWeatherData(lat, lon) {
    console.warn('⚠️ Using MOCK weather data - OpenWeather API key not active yet');
    
    // Return more realistic data based on location
    const isDelhiRegion = lat >= 28 && lat <= 29 && lon >= 76 && lon <= 78;
    
    if (isDelhiRegion) {
      // More realistic Delhi winter air quality (typically poor)
      return {
        weather: {
          main: {
            temp: 15,
            feels_like: 13,
            humidity: 78,
            pressure: 1015
          },
          wind: {
            speed: 2.1
          },
          weather: [{
            main: 'Haze',
            description: 'haze',
            icon: '50d'
          }]
        },
        airQuality: {
          list: [{
            main: {
              aqi: 4 // Poor
            },
            components: {
              pm2_5: 180.5,
              pm10: 245.3,
              o3: 35.2,
              no2: 65.4,
              co: 1850.5,
              so2: 18.7,
              nh3: 12.3,
              no: 45.8
            }
          }]
        }
      };
    }
    
    // Default mock data for other locations
    return {
      weather: {
        main: {
          temp: 22,
          feels_like: 21,
          humidity: 65,
          pressure: 1013
        },
        wind: {
          speed: 3.5
        },
        weather: [{
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }]
      },
      airQuality: {
        list: [{
          main: {
            aqi: 2
          },
          components: {
            pm2_5: 15.2,
            pm10: 22.5,
            o3: 45.3,
            no2: 18.7,
            co: 250.5,
            so2: 5.2,
            nh3: 2.1,
            no: 8.3
          }
        }]
      }
    };
  }

  // Parse AQI level
  getAQILevel(aqi) {
    const levels = {
      1: { label: 'Good', color: 'green', description: 'Air quality is satisfactory' },
      2: { label: 'Fair', color: 'yellow', description: 'Air quality is acceptable' },
      3: { label: 'Moderate', color: 'orange', description: 'Sensitive groups may experience health effects' },
      4: { label: 'Poor', color: 'red', description: 'Everyone may begin to experience health effects' },
      5: { label: 'Very Poor', color: 'purple', description: 'Health alert: everyone may experience serious effects' }
    };
    return levels[aqi] || levels[1];
  }

  // Generate environmental alerts from weather and air quality
  generateEnvironmentalAlerts(weatherData, airQualityData, forecastData) {
    const alerts = [];

    // Air Quality Alerts
    if (airQualityData && airQualityData.list && airQualityData.list[0]) {
      const aqi = airQualityData.list[0].main.aqi;
      const components = airQualityData.list[0].components;

      if (aqi >= 4) {
        alerts.push({
          type: 'air',
          severity: 'high',
          category: 'air',
          title: '🚨 Poor Air Quality',
          message: `Air Quality Index is ${this.getAQILevel(aqi).label}. ${this.getAQILevel(aqi).description}`,
          icon: '😷',
          data: { aqi, components }
        });
      } else if (aqi === 3) {
        alerts.push({
          type: 'air',
          severity: 'medium',
          category: 'air',
          title: '⚠️ Moderate Air Quality',
          message: `Air Quality Index is Moderate. Sensitive groups should limit outdoor activity.`,
          icon: '🌫️',
          data: { aqi, components }
        });
      }

      // High PM2.5
      if (components.pm2_5 > 35) {
        alerts.push({
          type: 'air',
          severity: 'high',
          category: 'air',
          title: '💨 High PM2.5 Levels',
          message: `PM2.5 concentration is ${components.pm2_5.toFixed(1)} µg/m³. Limit outdoor activities.`,
          icon: '💨'
        });
      }

      // High PM10
      if (components.pm10 > 50) {
        alerts.push({
          type: 'air',
          severity: 'medium',
          category: 'air',
          title: '🌪️ Elevated PM10',
          message: `PM10 concentration is ${components.pm10.toFixed(1)} µg/m³`,
          icon: '🌪️'
        });
      }

      // High Ozone
      if (components.o3 > 100) {
        alerts.push({
          type: 'air',
          severity: 'medium',
          category: 'air',
          title: '☀️ High Ozone Levels',
          message: `Ozone concentration is ${components.o3.toFixed(1)} µg/m³. Avoid outdoor exercise during peak hours.`,
          icon: '☀️'
        });
      }
    }

    // Weather-based environmental alerts
    if (weatherData) {
      const temp = weatherData.main.temp;
      const feelsLike = weatherData.main.feels_like;
      const humidity = weatherData.main.humidity;
      const windSpeed = weatherData.wind.speed;

      // Heat wave
      if (temp > 35 || feelsLike > 38) {
        alerts.push({
          type: 'heat',
          severity: 'high',
          category: 'heat',
          title: '🔥 Extreme Heat Warning',
          message: `Temperature is ${temp.toFixed(1)}°C (feels like ${feelsLike.toFixed(1)}°C). Stay hydrated and avoid direct sunlight.`,
          icon: '🌡️'
        });
      } else if (temp > 30 || feelsLike > 33) {
        alerts.push({
          type: 'heat',
          severity: 'medium',
          category: 'heat',
          title: '☀️ High Temperature',
          message: `Temperature is ${temp.toFixed(1)}°C. Take precautions in the heat.`,
          icon: '☀️'
        });
      }

      // Cold warning
      if (temp < 0) {
        alerts.push({
          type: 'weather',
          severity: 'medium',
          category: 'weather',
          title: '❄️ Freezing Temperature',
          message: `Temperature is ${temp.toFixed(1)}°C. Risk of ice formation.`,
          icon: '🥶'
        });
      }

      // High humidity
      if (humidity > 80) {
        alerts.push({
          type: 'weather',
          severity: 'medium',
          category: 'weather',
          title: '💧 High Humidity',
          message: `Humidity is ${humidity}%. Discomfort and mold risk.`,
          icon: '💧'
        });
      }

      // Strong winds
      if (windSpeed > 15) {
        alerts.push({
          type: 'storm',
          severity: 'high',
          category: 'storm',
          title: '💨 Strong Winds',
          message: `Wind speed is ${windSpeed.toFixed(1)} m/s. Secure loose objects.`,
          icon: '🌬️'
        });
      } else if (windSpeed > 10) {
        alerts.push({
          type: 'storm',
          severity: 'medium',
          category: 'storm',
          title: '🌬️ Windy Conditions',
          message: `Wind speed is ${windSpeed.toFixed(1)} m/s`,
          icon: '🌬️'
        });
      }

      // Rain/storm
      if (weatherData.weather && weatherData.weather[0]) {
        const condition = weatherData.weather[0].main.toLowerCase();
        if (condition.includes('thunderstorm')) {
          alerts.push({
            type: 'storm',
            severity: 'high',
            category: 'storm',
            title: '⛈️ Thunderstorm Alert',
            message: 'Thunderstorms in the area. Stay indoors and avoid open areas.',
            icon: '⚡'
          });
        } else if (condition.includes('rain')) {
          alerts.push({
            type: 'weather',
            severity: 'medium',
            category: 'weather',
            title: '🌧️ Rainy Weather',
            message: 'Rain expected. Carry an umbrella and drive carefully.',
            icon: '☔'
          });
        }
      }
    }

    return alerts;
  }

  // Format pollutant data for display
  formatPollutants(components) {
    return {
      co: { value: components.co, unit: 'µg/m³', name: 'Carbon Monoxide', icon: '🏭' },
      no: { value: components.no, unit: 'µg/m³', name: 'Nitrogen Monoxide', icon: '🚗' },
      no2: { value: components.no2, unit: 'µg/m³', name: 'Nitrogen Dioxide', icon: '🚗' },
      o3: { value: components.o3, unit: 'µg/m³', name: 'Ozone', icon: '☀️' },
      so2: { value: components.so2, unit: 'µg/m³', name: 'Sulfur Dioxide', icon: '🏭' },
      pm2_5: { value: components.pm2_5, unit: 'µg/m³', name: 'PM2.5', icon: '💨' },
      pm10: { value: components.pm10, unit: 'µg/m³', name: 'PM10', icon: '🌪️' },
      nh3: { value: components.nh3, unit: 'µg/m³', name: 'Ammonia', icon: '🚜' }
    };
  }
}

export default new WeatherService();
