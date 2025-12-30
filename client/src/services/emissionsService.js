import axios from 'axios';

const EMISSIONS_APIS = {
  annualCO2: 'https://ourworldindata.org/grapher/annual-co2-emissions-per-country.json',
  cumulativeCO2: 'https://ourworldindata.org/grapher/cumulative-co-emissions.json',
  co2PerCapita: 'https://ourworldindata.org/grapher/co2-per-capita.json',
  co2GrowthRate: 'https://ourworldindata.org/grapher/annual-co2-growth.json',
  co2BySector: 'https://ourworldindata.org/grapher/co2-emissions-by-sector.json',
  co2Transport: 'https://ourworldindata.org/grapher/co2-emissions-transport.json',
  co2Electricity: 'https://ourworldindata.org/grapher/co2-emissions-electricity.json',
  co2Intensity: 'https://ourworldindata.org/grapher/co2-intensity.json',
  energyBySource: 'https://ourworldindata.org/grapher/energy-consumption-by-source-and-country.json',
  fossilFuelCO2: 'https://ourworldindata.org/grapher/fossil-fuel-co2-emissions-by-fuel.json',
  totalGHG: 'https://ourworldindata.org/grapher/total-ghg-emissions.json',
  methane: 'https://ourworldindata.org/grapher/methane-emissions.json',
  nitrousOxide: 'https://ourworldindata.org/grapher/nitrous-oxide-emissions.json'
};

class EmissionsService {
  constructor() {
    this.cache = {};
    this.cacheTimeout = 1000 * 60 * 60; // 1 hour cache
  }

  // Fetch data from a specific API with caching
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
      throw error;
    }
  }

  // Get annual CO2 emissions
  async getAnnualCO2(country = null) {
    const data = await this.fetchData('annualCO2');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get cumulative CO2 emissions
  async getCumulativeCO2(country = null) {
    const data = await this.fetchData('cumulativeCO2');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get CO2 per capita
  async getCO2PerCapita(country = null) {
    const data = await this.fetchData('co2PerCapita');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get CO2 growth rate
  async getCO2GrowthRate(country = null) {
    const data = await this.fetchData('co2GrowthRate');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get CO2 by sector
  async getCO2BySector(country = null) {
    const data = await this.fetchData('co2BySector');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get transport CO2
  async getTransportCO2(country = null) {
    const data = await this.fetchData('co2Transport');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get electricity CO2
  async getElectricityCO2(country = null) {
    const data = await this.fetchData('co2Electricity');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get CO2 intensity
  async getCO2Intensity(country = null) {
    const data = await this.fetchData('co2Intensity');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get energy by source
  async getEnergyBySource(country = null) {
    const data = await this.fetchData('energyBySource');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get fossil fuel CO2
  async getFossilFuelCO2(country = null) {
    const data = await this.fetchData('fossilFuelCO2');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get total GHG emissions
  async getTotalGHG(country = null) {
    const data = await this.fetchData('totalGHG');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get methane emissions
  async getMethaneEmissions(country = null) {
    const data = await this.fetchData('methane');
    return country ? this.filterByCountry(data, country) : data;
  }

  // Get nitrous oxide emissions
  async getNitrousOxideEmissions(country = null) {
    const data = await this.fetchData('nitrousOxide');
    return country ? this.filterByCountry(data, country) : data;
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
      const growthData = await this.getCO2GrowthRate(country);
      const latestGrowth = this.getLatestValue(growthData, country);
      
      if (latestGrowth && latestGrowth > 5) {
        alerts.push({
          type: 'warning',
          severity: 'high',
          title: 'Rapid CO₂ Growth',
          message: `${country} has experienced ${latestGrowth.toFixed(1)}% annual CO₂ growth`,
          icon: '⚠️'
        });
      }

      const perCapitaData = await this.getCO2PerCapita(country);
      const latestPerCapita = this.getLatestValue(perCapitaData, country);
      
      if (latestPerCapita && latestPerCapita > 10) {
        alerts.push({
          type: 'warning',
          severity: 'medium',
          title: 'High Per Capita Emissions',
          message: `${country} emits ${latestPerCapita.toFixed(1)} tonnes CO₂ per person`,
          icon: '🏭'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error generating alerts:', error);
      return [];
    }
  }

  // Helper: Filter data by country
  filterByCountry(data, country) {
    if (!data || !data.data) return null;
    
    // Find entity matching country
    const entityIndex = data.data.entities?.findIndex(
      e => e.name.toLowerCase() === country.toLowerCase()
    );
    
    if (entityIndex === -1) return null;
    
    return {
      ...data,
      filteredEntity: data.data.entities[entityIndex],
      filteredData: data.data.values.filter(v => v.entity === entityIndex)
    };
  }

  // Helper: Get latest value for a country
  getLatestValue(data, country) {
    if (!data || !data.filteredData) return null;
    
    const sorted = data.filteredData.sort((a, b) => b.year - a.year);
    return sorted[0]?.value;
  }
}

export default new EmissionsService();
