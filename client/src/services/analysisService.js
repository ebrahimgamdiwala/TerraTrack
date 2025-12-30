// Helper function to get display name for analysis type
function getAnalysisTypeName(type) {
    const types = {
        'ndvi': 'Vegetation Health (NDVI)',
        'ndwi': 'Water Bodies (NDWI)',
        'urban': 'Urban Expansion'
    };
    return types[type] || type;
}

// Enhanced simulation with more realistic patterns
export async function simulateEEAnalysis(lat, lng, startYear, endYear, analysisType, isArea = false) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const years = [];
    const values = [];
    const yearRange = parseInt(endYear) - parseInt(startYear) + 1;
    
    const latFactor = Math.abs(lat) / 90;
    let baseValue, metricName, trend, noiseLevel;
    
    switch(analysisType) {
        case 'ndvi':
            const tropicalFactor = Math.exp(-Math.pow((Math.abs(lat) - 15) / 30, 2));
            baseValue = 0.15 + 0.5 * tropicalFactor + 0.1 * (Math.random() - 0.5);
            metricName = 'NDVI';
            trend = 0.01 + 0.02 * Math.random();
            noiseLevel = 0.05;
            break;
        case 'ndwi':
            const polarFactor = Math.exp(-Math.pow((Math.abs(lat) - 70) / 20, 2));
            baseValue = 0.1 + 0.2 * polarFactor;
            metricName = 'NDWI';
            trend = -0.005 - 0.01 * Math.random();
            noiseLevel = 0.03;
            break;
        case 'urban':
            const urbanLatFactor = Math.exp(-Math.pow((Math.abs(lat) - 35) / 30, 2));
            baseValue = 0.1 + 0.4 * urbanLatFactor * (1 - Math.random() * 0.5);
            metricName = 'Urban Index';
            trend = 0.02 + 0.03 * Math.random();
            noiseLevel = 0.02;
            break;
        case 'temperature':
            // Temperature in Celsius, varies by latitude
            const tempLatFactor = Math.cos(Math.abs(lat) * Math.PI / 180);
            baseValue = 10 + 20 * tempLatFactor + (Math.random() - 0.5) * 5;
            metricName = 'Temperature (°C)';
            trend = 0.2 + 0.3 * Math.random(); // Global warming trend
            noiseLevel = 2;
            break;
        case 'precipitation':
            // Precipitation in mm, varies by latitude and longitude
            const precipLatFactor = Math.exp(-Math.pow((Math.abs(lat) - 10) / 40, 2));
            const precipLngFactor = Math.sin(Math.abs(lng) * Math.PI / 180);
            baseValue = 50 + 150 * precipLatFactor + 50 * precipLngFactor + (Math.random() - 0.5) * 20;
            metricName = 'Precipitation (mm)';
            trend = -1 + 2 * Math.random(); // Variable precipitation trends
            noiseLevel = 15;
            break;
        default:
            baseValue = 0.5;
            metricName = 'Index Value';
            trend = 0;
            noiseLevel = 0.1;
    }
    
    for (let i = 0; i < yearRange; i++) {
        const year = parseInt(startYear) + i;
        years.push(year.toString());
        let value = baseValue + trend * i + (Math.random() * 2 - 1) * noiseLevel;
        
        // Apply appropriate bounds based on analysis type
        if (analysisType === 'temperature') {
            value = Math.max(-50, Math.min(50, value)); // Temperature bounds
            values.push(parseFloat(value.toFixed(2)));
        } else if (analysisType === 'precipitation') {
            value = Math.max(0, Math.min(500, value)); // Precipitation bounds (non-negative)
            values.push(parseFloat(value.toFixed(1)));
        } else {
            // Index values (NDVI, NDWI, Urban)
            value = Math.max(-1, Math.min(1, value));
            values.push(parseFloat(value.toFixed(4)));
        }
    }
    
    const locationName = `Point at (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
    
    return {
        location: locationName,
        analysisType: analysisType, // Keep it short for the switch case
        metricName,
        startYear,
        endYear,
        years,
        values,
    };
}

// Helper function to generate analysis description
// In analysisService.js - add these functions

export const getLocationInsights = async (lat, lng) => {
  // Simulate API call to get location insights
  return {
    description: `Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
    elevation: `${(Math.random() * 3000).toFixed(0)}m above sea level`,
    climate: 'Temperate continental',
    landUse: 'Mixed vegetation with some agricultural areas',
    ecoregion: 'Temperate broadleaf forest',
    population: 'Moderately populated',
  };
};

export const getAnalysisDescription = (analysisType, values, startYear, endYear) => {
  const startValue = values[0];
  const endValue = values[values.length - 1];
  const change = ((endValue - startValue) / Math.abs(startValue)) * 100;
  
  let summary = '';
  let details = [];
  let recommendations = [];
  
  if (analysisType === 'ndvi') {
    // Vegetation analysis
    summary = `Vegetation ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% between ${startYear} and ${endYear}.`;
    
    details = [
      `Normalized Difference Vegetation Index (NDVI) changed from ${startValue.toFixed(4)} to ${endValue.toFixed(4)}.`,
      change >= 0 ? 'This indicates improved vegetation health or expansion.' : 'This suggests vegetation stress or reduction in green cover.',
      'NDVI values typically range from -1 to 1, with higher values indicating healthier vegetation.'
    ];
    
    recommendations = [
      change < 0 ? 'Consider investigating causes of vegetation decline such as drought, pests, or land use changes.' : 'Maintain current land management practices that support vegetation growth.',
      'Monitor soil moisture levels to support healthy vegetation.',
      'Consider diversifying plant species to improve ecosystem resilience.'
    ];
  } 
  else if (analysisType === 'ndwi') {
    // Water analysis
    summary = `Water presence ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% between ${startYear} and ${endYear}.`;
    
    details = [
      `Normalized Difference Water Index (NDWI) changed from ${startValue.toFixed(4)} to ${endValue.toFixed(4)}.`,
      change >= 0 ? 'This may indicate increased water body extent or soil moisture.' : 'This suggests reduced water availability in the area.',
      'NDWI values typically range from -1 to 1, with higher values indicating more water content.'
    ];
    
    recommendations = [
      change < 0 ? 'Investigate water management practices and potential causes of water loss.' : 'Continue current water conservation practices.',
      'Consider implementing water harvesting techniques if appropriate for the area.',
      'Monitor groundwater levels to complement surface water observations.'
    ];
  }
  else if (analysisType === 'urban') {
    // Urban expansion analysis
    summary = `Urban footprint ${change >= 0 ? 'expanded' : 'contracted'} by ${Math.abs(change).toFixed(1)}% between ${startYear} and ${endYear}.`;
    
    details = [
      `Urban index changed from ${startValue.toFixed(4)} to ${endValue.toFixed(4)}.`,
      change >= 0 ? 'This indicates urban development and expansion of built-up areas.' : 'This may indicate de-urbanization or changes in land classification.',
      'Urban expansion often correlates with population growth and economic development.'
    ];
    
    recommendations = [
      'Consider impacts on local ecosystems and biodiversity from urban expansion.',
      'Plan for sustainable urban development with green spaces.',
      'Monitor air and water quality changes associated with urban development.'
    ];
  }
  else if (analysisType === 'temperature') {
    // Temperature analysis
    summary = `Temperature ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% between ${startYear} and ${endYear}.`;
    
    details = [
      `Land surface temperature changed from ${startValue.toFixed(2)}°C to ${endValue.toFixed(2)}°C.`,
      change >= 0 ? 'This indicates warming trends in the area.' : 'This suggests cooling trends, possibly due to vegetation growth or seasonal variations.',
      'Temperature changes can affect local ecosystems, agriculture, and water resources.',
      'Urban heat island effects may contribute to temperature increases in developed areas.'
    ];
    
    recommendations = [
      change > 0 ? 'Consider heat mitigation strategies such as increasing green cover.' : 'Monitor for seasonal variations and long-term climate patterns.',
      'Implement urban planning measures to reduce heat island effects.',
      'Consider impact on local agriculture and water demand.',
      'Monitor correlation with vegetation health and water availability.'
    ];
  }
  else if (analysisType === 'precipitation') {
    // Precipitation analysis
    summary = `Precipitation ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% between ${startYear} and ${endYear}.`;
    
    details = [
      `Precipitation levels changed from ${startValue.toFixed(2)}mm to ${endValue.toFixed(2)}mm.`,
      change >= 0 ? 'This indicates increased rainfall or water availability.' : 'This suggests reduced precipitation, potentially affecting local water resources.',
      'Precipitation changes directly impact vegetation growth, agriculture, and water resources.',
      'Long-term precipitation trends are important indicators of climate change.'
    ];
    
    recommendations = [
      change < 0 ? 'Implement water conservation measures and drought-resistant practices.' : 'Plan for potential flooding and water management needs.',
      'Monitor impact on local agriculture and food security.',
      'Consider rainwater harvesting systems for water resource management.',
      'Assess correlation with vegetation health and ecosystem changes.'
    ];
  }
  else {
    // Default case for unknown analysis types
    summary = `Environmental indicator ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% between ${startYear} and ${endYear}.`;
    
    details = [
      `Environmental metric changed from ${startValue.toFixed(4)} to ${endValue.toFixed(4)}.`,
      'This change may indicate environmental shifts in the selected area.',
      'Further analysis may be needed to understand the specific implications.'
    ];
    
    recommendations = [
      'Monitor additional environmental indicators for comprehensive assessment.',
      'Consider conducting field surveys to validate satellite observations.',
      'Analyze seasonal patterns and long-term trends for better insights.'
    ];
  }
  
  return {
    summary,
    details,
    recommendations: Math.abs(change) < 2 ? [] : recommendations // Only show recommendations for significant changes (>2%)
  };
};

