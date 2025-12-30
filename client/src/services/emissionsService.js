import axios from 'axios';

const EMISSIONS_APIS = {
  annualCO2: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  cumulativeCO2: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  co2PerCapita: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  co2GrowthRate: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  co2BySector: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  co2Transport: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  co2Electricity: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  co2Intensity: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  energyBySource: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  fossilFuelCO2: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  totalGHG: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  methane: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json',
  nitrousOxide: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json'
};

class EmissionsService {
  constructor() {
    this.cache = {};
    this.cacheTimeout = 1000 * 60 * 60; // 1 hour cache
  }

  // Fetch data from GitHub with caching
  async fetchData(apiKey) {
    const now = Date.now();
    
    // Check cache
    if (this.cache[apiKey] && (now - this.cache[apiKey].timestamp < this.cacheTimeout)) {
      return this.cache[apiKey].data;
    }

    try {
      const response = await axios.get(EMISSIONS_APIS[apiKey]);
      const data = response.data;
      
      // Cache the result
      this.cache[apiKey] = {
        data,
        timestamp: now
      };
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${apiKey} data:`, error);
      // Return empty object instead of throwing to prevent cascading failures
      return {};
    }
  }

  // Get annual CO2 emissions
  async getAnnualCO2(country = null) {
    const data = await this.fetchData('annualCO2');
    return country ? this.getCountryData(data, country, 'co2') : data;
  }

  // Get cumulative CO2 emissions
  async getCumulativeCO2(country = null) {
    const data = await this.fetchData('cumulativeCO2');
    return country ? this.getCountryData(data, country, 'cumulative_co2') : data;
  }

  // Get CO2 per capita
  async getCO2PerCapita(country = null) {
    const data = await this.fetchData('co2PerCapita');
    return country ? this.getCountryData(data, country, 'co2_per_capita') : data;
  }

  // Get CO2 growth rate
  async getCO2GrowthRate(country = null) {
    const data = await this.fetchData('co2GrowthRate');
    return country ? this.getCountryData(data, country, 'co2_growth_prct') : data;
  }

  // Get CO2 by sector
  async getCO2BySector(country = null) {
    const data = await this.fetchData('co2BySector');
    return country ? this.getCountryData(data, country, 'co2_including_luc') : data;
  }

  // Get transport CO2
  async getTransportCO2(country = null) {
    const data = await this.fetchData('co2Transport');
    return country ? this.getCountryData(data, country, 'transport_co2') : data;
  }

  // Get electricity CO2
  async getElectricityCO2(country = null) {
    const data = await this.fetchData('co2Electricity');
    return country ? this.getCountryData(data, country, 'electricity_generation') : data;
  }

  // Get CO2 intensity
  async getCO2Intensity(country = null) {
    const data = await this.fetchData('co2Intensity');
    return country ? this.getCountryData(data, country, 'co2_per_gdp') : data;
  }

  // Get energy by source
  async getEnergyBySource(country = null) {
    const data = await this.fetchData('energyBySource');
    return country ? this.getCountryData(data, country, 'primary_energy_consumption') : data;
  }

  // Get fossil fuel CO2
  async getFossilFuelCO2(country = null) {
    const data = await this.fetchData('fossilFuelCO2');
    return country ? this.getCountryData(data, country, 'coal_co2') : data;
  }

  // Get total GHG emissions
  async getTotalGHG(country = null) {
    const data = await this.fetchData('totalGHG');
    return country ? this.getCountryData(data, country, 'total_ghg') : data;
  }

  // Get methane emissions
  async getMethaneEmissions(country = null) {
    const data = await this.fetchData('methane');
    return country ? this.getCountryData(data, country, 'methane') : data;
  }

  // Get nitrous oxide emissions
  async getNitrousOxideEmissions(country = null) {
    const data = await this.fetchData('nitrousOxide');
    return country ? this.getCountryData(data, country, 'nitrous_oxide') : data;
  }

  // Get all emissions data for a country
  async getAllEmissionsData(country) {
    try {
      const [
        annual,
        cumulative,
        perCapita,
        growth,
        bySector,
        transport,
        electricity,
        ghg
      ] = await Promise.all([
        this.getAnnualCO2(country),
        this.getCumulativeCO2(country),
        this.getCO2PerCapita(country),
        this.getCO2GrowthRate(country),
        this.getCO2BySector(country),
        this.getTransportCO2(country),
        this.getElectricityCO2(country),
        this.getTotalGHG(country)
      ]);

      return {
        annual,
        cumulative,
        perCapita,
        growth,
        bySector,
        transport,
        electricity,
        ghg
      };
    } catch (error) {
      console.error('Error fetching all emissions data:', error);
      throw error;
    }
  }

  // Generate alerts based on emissions data
  async generateAlerts(country) {
    const alerts = [];
    
    try {
      // Normalize country name (USA -> United States)
      const normalizedCountry = this.normalizeCountryName(country);
      
      const data = await this.fetchData('annualCO2');
      const countryData = data[normalizedCountry];
      
      if (!countryData || !countryData.data || countryData.data.length === 0) {
        return alerts;
      }

      // Get latest year data
      const latestData = countryData.data[countryData.data.length - 1];
      
      // Check CO2 growth
      if (latestData.co2_growth_prct && latestData.co2_growth_prct > 5) {
        alerts.push({
          type: 'warning',
          severity: 'high',
          title: 'Rapid CO₂ Growth',
          message: `${country} has experienced ${latestData.co2_growth_prct.toFixed(1)}% annual CO₂ growth`,
          icon: '⚠️'
        });
      }

      // Check per capita emissions
      if (latestData.co2_per_capita && latestData.co2_per_capita > 10) {
        alerts.push({
          type: 'warning',
          severity: 'medium',
          title: 'High Per Capita Emissions',
          message: `${country} emits ${latestData.co2_per_capita.toFixed(1)} tonnes CO₂ per person`,
          icon: '🏭'
        });
      }

      // Check total CO2 emissions
      if (latestData.co2 && latestData.co2 > 1000) {
        alerts.push({
          type: 'info',
          severity: 'low',
          title: 'Major Emitter',
          message: `${country} total emissions: ${(latestData.co2 / 1000).toFixed(1)}B tonnes CO₂ (${latestData.year})`,
          icon: '📊'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error generating alerts:', error);
      return [];
    }
  }

  // Helper: Normalize country names for API
  normalizeCountryName(country) {
    const mapping = {
      'USA': 'United States',
      'UK': 'United Kingdom',
      'New York': 'United States',
      'Los Angeles': 'United States',
      'Chicago': 'United States',
      'Mumbai': 'India',
      'Delhi': 'India',
      'Tokyo': 'Japan',
      'London': 'United Kingdom',
      'Paris': 'France',
      'Berlin': 'Germany'
    };
    
    return mapping[country] || country;
  }

  // Helper: Get country data from OWID format
  getCountryData(data, country, field) {
    const normalizedCountry = this.normalizeCountryName(country);
    const countryData = data[normalizedCountry];
    
    if (!countryData || !countryData.data) return null;
    
    return {
      country: normalizedCountry,
      data: countryData.data.map(entry => ({
        year: entry.year,
        value: entry[field]
      })).filter(entry => entry.value !== null && entry.value !== undefined)
    };
  }

  // Helper: Get latest value for a country
  getLatestValue(data, field = 'value') {
    if (!data || !data.data || data.data.length === 0) return null;
    
    const sorted = data.data.sort((a, b) => b.year - a.year);
    return sorted[0]?.[field];
  }
}

export default new EmissionsService();
