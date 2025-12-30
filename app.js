// Initialize the map
const map = L.map('map').setView([20, 0], 2);

// Add OpenStreetMap base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Global variables
let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialize the draw control
const drawControl = new L.Control.Draw({
    draw: {
        polygon: {
            shapeOptions: {
                color: '#3498db',
                fillColor: '#3498db',
                fillOpacity: 0.2
            },
            allowIntersection: false,
            showArea: true,
            metric: true
        },
        rectangle: {
            shapeOptions: {
                color: '#3498db',
                fillColor: '#3498db',
                fillOpacity: 0.2
            },
            showArea: true,
            metric: true
        },
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false
    },
    edit: {
        featureGroup: drawnItems,
        remove: true
    }
});

map.addControl(drawControl);

// Handle map clicks
map.on('click', function(e) {
    // Clear previous markers and add new one
    drawnItems.clearLayers();
    
    // Add a marker at the clicked location
    const marker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 8,
        fillColor: "#3498db",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(drawnItems);
    
    // Analyze the clicked point
    analyzePoint(e.latlng.lat, e.latlng.lng);
});

// Handle draw events
map.on(L.Draw.Event.CREATED, function (e) {
    const layer = e.layer;
    drawnItems.clearLayers();
    drawnItems.addLayer(layer);
    
    // Get the bounds of the drawn shape
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    
    // Analyze the area
    analyzeArea(center.lat, center.lng, bounds.getNorthEast().lat, bounds.getNorthEast().lng);
});

// Function to analyze a point on the map
async function analyzePoint(lat, lng) {
    const startYear = document.getElementById('startYear').value;
    const endYear = document.getElementById('endYear').value;
    const analysisType = document.getElementById('analysisType').value;
    const useRealData = document.getElementById('useRealData').checked;
    
    // Show loading state
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    
    try {
        let results;
        if (useRealData) {
            // Use AWS Open Data for real data
            results = await getRealAnalysis(lat, lng, startYear, endYear, analysisType);
        } else {
            // Use the enhanced simulation
            results = await simulateEEAnalysis(lat, lng, startYear, endYear, analysisType);
        }
        displayResults(results);
    } catch (error) {
        console.error('Error analyzing point:', error);
        alert('Error analyzing the selected location. ' + error.message);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Area';
    }
}

// Function to analyze an area on the map
async function analyzeArea(lat, lng, lat2, lng2) {
    const startYear = document.getElementById('startYear').value;
    const endYear = document.getElementById('endYear').value;
    const analysisType = document.getElementById('analysisType').value;
    const useRealData = document.getElementById('useRealData').checked;
    
    // Show loading state
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    
    try {
        let results;
        if (useRealData) {
            // For area analysis, we'll use the bounding box coordinates
            const bounds = {
                west: Math.min(lng, lng2),
                south: Math.min(lat, lat2),
                east: Math.max(lng, lng2),
                north: Math.max(lat, lat2)
            };
            
            // Get analysis for the center point of the area
            results = await getRealAnalysis(
                (lat + lat2) / 2,
                (lng + lng2) / 2,
                startYear,
                endYear,
                analysisType,
                true
            );
            
            // Store bounds for potential visualization
            results.bounds = bounds;
            results.location = `Area (${bounds.south.toFixed(2)}°-${bounds.north.toFixed(2)}°N, ${bounds.west.toFixed(2)}°-${bounds.east.toFixed(2)}°E)`;
        } else {
            // Use the enhanced simulation for area analysis
            results = await simulateEEAnalysis(
                (lat + lat2) / 2, 
                (lng + lng2) / 2, 
                startYear, 
                endYear, 
                analysisType,
                true
            );
        }
        displayResults(results);
    } catch (error) {
        console.error('Error analyzing area:', error);
        alert('Error analyzing the selected area: ' + error.message);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Area';
    }
}

// Function to display the analysis results
function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');
    
    // Update the results section
    document.getElementById('timeline').innerHTML = `
        <div class="chart-container">
            <canvas id="timelineChart"></canvas>
        </div>
    `;
    
    // Create the chart
    const ctx = document.getElementById('timelineChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: results.years,
            datasets: [{
                label: results.metricName,
                data: results.values,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: results.metricName
                    },
                    min: Math.min(...results.values) * 0.9,
                    max: Math.max(...results.values) * 1.1
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `${results.metricName} from ${results.startYear} to ${results.endYear}`,
                    font: {
                        size: 16
                    }
                },
                subtitle: {
                    display: true,
                    text: `Data Source: ${results.source || 'Simulated Data'}`,
                    font: {
                        style: 'italic',
                        size: 12
                    },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${results.metricName}: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            }
        }
    });
    
    // Calculate statistics
    const startValue = results.values[0];
    const endValue = results.values[results.values.length - 1];
    const change = ((endValue - startValue) / Math.abs(startValue)) * 100;
    const changeType = change >= 0 ? 'increased' : 'decreased';
    const absChange = Math.abs(change).toFixed(1);
    
    // Display statistics with more details
    document.getElementById('stats').innerHTML = `
        <div class="analysis-info">
            <h3>Analysis Summary</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Location:</span>
                    <span class="stat-value">${results.location}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Time Period:</span>
                    <span class="stat-value">${results.startYear} - ${results.endYear}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Analysis Type:</span>
                    <span class="stat-value">${results.analysisType}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Data Source:</span>
                    <span class="stat-value">${results.source || 'Simulated Data'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Initial Value (${results.startYear}):</span>
                    <span class="stat-value">${startValue.toFixed(4)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Final Value (${results.endYear}):</span>
                    <span class="stat-value">${endValue.toFixed(4)}</span>
                </div>
                <div class="stat-item highlight">
                    <span class="stat-label">Change (${results.endYear - results.startYear} years):</span>
                    <span class="stat-value ${change >= 0 ? 'positive' : 'negative'}">
                        ${changeType} by ${absChange}%
                    </span>
                </div>
            </div>
            <div class="analysis-description">
                <h4>Interpretation</h4>
                <p>${getAnalysisDescription(results.analysisType, results.values, results.startYear, results.endYear)}</p>
            </div>
        </div>
    `;
}

// Helper function to generate analysis description
function getAnalysisDescription(type, values, startYear, endYear) {
    const startValue = values[0].toFixed(2);
    const endValue = values[values.length - 1].toFixed(2);
    const change = ((endValue - startValue) / startValue * 100).toFixed(1);
    
    let description = '';
    const trend = endValue > startValue ? 'increased' : 'decreased';
    
    switch(type) {
        case 'ndvi':
            description = `Vegetation index (NDVI) has ${trend} from ${startValue} to ${endValue} (${change}%) between ${startYear} and ${endYear}. `;
            if (trend === 'increased') {
                description += 'This indicates improved vegetation health or increased plant growth in the area.';
            } else {
                description += 'This may indicate reduced vegetation cover or health in the area.';
            }
            break;
        case 'ndwi':
            description = `Water index (NDWI) has ${trend} from ${startValue} to ${endValue} (${change}%) between ${startYear} and ${endYear}. `;
            if (trend === 'increased') {
                description += 'This suggests an increase in water bodies or moisture content in the area.';
            } else {
                description += 'This may indicate a reduction in water bodies or moisture content in the area.';
            }
            break;
        case 'urban':
            description = `Urban index has ${trend} from ${startValue} to ${endValue} (${change}%) between ${startYear} and ${endYear}. `;
            if (trend === 'increased') {
                description += 'This suggests urban expansion or increased built-up areas.';
            } else {
                description += 'This may indicate a reduction in urban areas or changes in land use.';
            }
            break;
        default:
            description = `The selected metric has ${trend} from ${startValue} to ${endValue} (${change}%) between ${startYear} and ${endYear}.`;
    }
    
    return description;
}

// Configuration for AWS Open Data endpoints
const AWS_OPEN_DATA_CONFIG = {
    // AWS Open Data Registry - Sentinel-2 and Landsat 8
    endpoints: {
        sentinel2: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com',
        landsat8: 'https://landsat-pds.s3.amazonaws.com',
        // NASA's GIBS for global imagery
        gibs: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
    },
    // Default parameters for analysis
    defaultScale: 30, // meters per pixel
    maxCloudCover: 20, // Maximum cloud cover percentage
    // Collection IDs for different analyses
    collections: {
        ndvi: 'sentinel2',
        ndwi: 'sentinel2',
        urban: 'landsat8'
    }
};

// Function to get NDVI from Sentinel-2
function calculateNDVI(image) {
    // NDVI = (NIR - Red) / (NIR + Red)
    // B8 is NIR, B4 is Red in Sentinel-2
    const nir = image.B08;
    const red = image.B04;
    return nir.subtract(red).divide(nir.add(red)).rename('NDVI');
}

// Function to get NDWI from Sentinel-2
function calculateNDWI(image) {
    // NDWI = (Green - NIR) / (Green + NIR)
    // B3 is Green, B8 is NIR in Sentinel-2
    const green = image.B03;
    const nir = image.B08;
    return green.subtract(nir).divide(green.add(nir)).rename('NDWI');
}

// Function to get Urban Index from Landsat 8
function calculateUrbanIndex(image) {
    // Using NDBI (Normalized Difference Built-up Index)
    // NDBI = (SWIR - NIR) / (SWIR + NIR)
    // B6 is SWIR, B5 is NIR in Landsat 8
    const swir = image.B6;
    const nir = image.B5;
    return swir.subtract(nir).divide(swir.add(nir)).rename('UrbanIndex');
}

// Function to get NDVI from Landsat
function getNDVI(image) {
    return image.normalizedDifference(['B5', 'B4']).rename('NDVI');
}

// Function to get NDWI from Landsat
function getNDWI(image) {
    return image.normalizedDifference(['B3', 'B5']).rename('NDWI');
}

// Function to calculate urban index
function getUrbanIndex(image) {
    // This is a simplified example - in reality, you'd use a land cover classification
    const urban = image.select('discrete_classification').eq(50)
        .add(image.select('discrete_classification').eq(60));
    return urban.rename('urban_index');
}

// Get data from AWS Open Data
async function getRealAnalysis(lat, lng, startYear, endYear, analysisType, isArea = false) {
    try {
        const baseParams = {
            lat: lat,
            lon: lng,
            startDate: `${startYear}-01-01`,
            endDate: `${endYear}-12-31`,
            cloudCover: AWS_OPEN_DATA_CONFIG.maxCloudCover
        };

        let metricName, values = [];
        const years = [];
        const results = [];
        
        // Generate years for the time series
        for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
            years.push(year.toString());
            // For demo purposes, we'll use the simulation with AWS-like patterns
            // In a real implementation, you would fetch actual data from AWS S3
            const simulatedValue = await simulateAWSData(lat, lng, year, analysisType);
            values.push(simulatedValue);
            results.push({
                year: year,
                value: simulatedValue
            });
        }

        // Set metric name based on analysis type
        switch(analysisType) {
            case 'ndvi':
                metricName = 'NDVI (Normalized Difference Vegetation Index)';
                break;
            case 'ndwi':
                metricName = 'NDWI (Normalized Difference Water Index)';
                break;
            case 'urban':
                metricName = 'Urban Index (NDBI)';
                break;
            default:
                metricName = 'Index Value';
        }

        return {
            location: isArea ? 
                `Area around (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)` : 
                `Point at (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
            analysisType: getAnalysisTypeName(analysisType),
            metricName,
            startYear,
            endYear,
            years: years,
            values: values,
            coordinates: [lat, lng],
            source: 'AWS Open Data (Simulated)'
        };
        
    } catch (error) {
        console.error('Error in AWS Open Data analysis:', error);
        // Fall back to simulation if AWS fetch fails
        console.log('Falling back to simulated data');
        return simulateEEAnalysis(lat, lng, startYear, endYear, analysisType, isArea);
    }
}

// Simulate AWS data fetch with realistic patterns
async function simulateAWSData(lat, lng, year, analysisType) {
    // Add some delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Base value based on latitude (tropical, temperate, polar regions)
    const latFactor = Math.abs(lat) / 90; // 0 at equator, 1 at poles
    const tropicalFactor = Math.exp(-Math.pow((Math.abs(lat) - 15) / 30, 2));
    
    // Add some randomness but keep it deterministic based on location and year
    const rng = (lat * 1000 + lng * 100 + year) % 1000 / 1000;
    
    switch(analysisType) {
        case 'ndvi':
            // NDVI ranges from -1 to 1, with vegetation typically 0.2-0.8
            const baseNDVI = 0.15 + 0.5 * tropicalFactor;
            // Add some year-to-year variation and a slight trend
            const ndviTrend = 0.005 * (year - 2020); // Slight greening over time
            return Math.max(-1, Math.min(1, baseNDVI + ndviTrend + (rng - 0.5) * 0.1));
            
        case 'ndwi':
            // NDWI ranges from -1 to 1, positive for water
            // Higher near coasts and at high latitudes
            const coastDistance = Math.min(1, (rng * 0.5) + 0.1);
            const polarFactor = Math.exp(-Math.pow((Math.abs(lat) - 70) / 20, 2));
            const baseNDWI = 0.1 + 0.3 * (1 - coastDistance) + 0.2 * polarFactor;
            return Math.max(-1, Math.min(1, baseNDWI + (rng - 0.5) * 0.05));
            
        case 'urban':
            // Urban index (based on NDBI) - higher in mid-latitudes
            const urbanLatFactor = Math.exp(-Math.pow((Math.abs(lat) - 35) / 30, 2));
            const baseUrban = 0.1 + 0.4 * urbanLatFactor * (0.5 + rng * 0.5);
            // Urban areas tend to expand over time
            const urbanTrend = 0.01 * (year - 2020);
            return Math.max(-1, Math.min(1, baseUrban + urbanTrend));
            
        default:
            return 0.5 + (rng - 0.5) * 0.2;
    }
}

// Helper function to get time series data
async function getTimeSeries(collection, point, startYear, endYear) {
    const years = [];
    const values = [];
    
    // Get yearly means
    for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        
        const yearly = collection.filterDate(start, end).mean();
        const value = await getPointValue(yearly, point);
        
        if (value !== null) {
            years.push(year.toString());
            values.push(value);
        }
    }
    
    return { years, values };
}

// Helper function to get value at a point
function getPointValue(image, point) {
    return new Promise((resolve) => {
        image.reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: point,
            scale: 30,
            maxPixels: 1e9
        }).evaluate((result, error) => {
            if (error) {
                console.error('Error getting point value:', error);
                resolve(null);
            } else {
                const band = Object.keys(result)[0];
                resolve(result[band]);
            }
        });
    });
}

// Enhanced simulation with more realistic patterns
async function simulateEEAnalysis(lat, lng, startYear, endYear, analysisType, isArea = false) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const years = [];
    const values = [];
    const yearRange = parseInt(endYear) - parseInt(startYear) + 1;
    
    // Base values and seasonal patterns based on latitude
    const latFactor = Math.abs(lat) / 90; // 0 at equator, 1 at poles
    const seasonalAmplitude = 0.15 * (1 - latFactor * 0.8); // Less seasonality near equator
    
    // Base value based on analysis type and location
    let baseValue, metricName, trend, noiseLevel;
    
    // More sophisticated simulation based on analysis type
    switch(analysisType) {
        case 'ndvi':
            // Higher NDVI in tropical regions, lower in deserts
            const tropicalFactor = Math.exp(-Math.pow((Math.abs(lat) - 15) / 30, 2));
            baseValue = 0.15 + 0.5 * tropicalFactor + 0.1 * (Math.random() - 0.5);
            metricName = 'NDVI (Normalized Difference Vegetation Index)';
            // Slight greening trend
            trend = 0.01 + 0.02 * Math.random();
            noiseLevel = 0.05;
            break;
            
        case 'ndwi':
            // Higher NDWI near coasts and at high latitudes
            const coastDistance = Math.min(1, Math.random() * 0.5 + 0.1); // Simulate distance to coast
            const polarFactor = Math.exp(-Math.pow((Math.abs(lat) - 70) / 20, 2));
            baseValue = 0.1 + 0.3 * (1 - coastDistance) + 0.2 * polarFactor;
            metricName = 'NDWI (Normalized Difference Water Index)';
            // Slight drying trend
            trend = -0.005 - 0.01 * Math.random();
            noiseLevel = 0.03;
            break;
            
        case 'urban':
            // Higher urban index at mid-latitudes, near coasts
            const urbanLatFactor = Math.exp(-Math.pow((Math.abs(lat) - 35) / 30, 2));
            baseValue = 0.1 + 0.4 * urbanLatFactor * (1 - Math.random() * 0.5);
            metricName = 'Urban Index';
            // Urban expansion trend
            trend = 0.02 + 0.03 * Math.random();
            noiseLevel = 0.02;
            break;
            
        default:
            baseValue = 0.5;
            metricName = 'Index Value';
            trend = 0;
            noiseLevel = 0.1;
    }
    
    // Generate time series with seasonal patterns and trends
    for (let i = 0; i < yearRange; i++) {
        const year = parseInt(startYear) + i;
        years.push(year.toString());
        
        // Add trend component
        let value = baseValue + trend * i;
        
        // Add seasonal component (sinusoidal)
        const season = seasonalAmplitude * Math.sin((i % 1) * Math.PI * 2);
        value += season;
        
        // Add some random noise
        value += (Math.random() * 2 - 1) * noiseLevel;
        
        // Keep values in valid range
        value = Math.max(-1, Math.min(1, value));
        values.push(parseFloat(value.toFixed(4)));
    }
    
    // Get location name (reverse geocoding would be used in a real app)
    const locationName = isArea ? 
        `Area around (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)` : 
        `Point at (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
    
    return {
        location: locationName,
        analysisType: getAnalysisTypeName(analysisType),
        metricName,
        startYear,
        endYear,
        years,
        values,
        coordinates: [lat, lng]
    };
}

// Helper function to get display name for analysis type
function getAnalysisTypeName(type) {
    const types = {
        'ndvi': 'Vegetation Health (NDVI)',
        'ndwi': 'Water Bodies (NDWI)',
        'urban': 'Urban Expansion'
    };
    return types[type] || type;
}

// Handle analyze button click
document.getElementById('analyzeBtn').addEventListener('click', function() {
    if (drawnItems.getLayers().length > 0) {
        const bounds = drawnItems.getBounds();
        analyzeArea(
            bounds.getSouthWest().lat, 
            bounds.getSouthWest().lng,
            bounds.getNorthEast().lat,
            bounds.getNorthEast().lng
        );
    } else {
        alert('Please draw an area on the map or click a specific point to analyze.');
    }
});

// Handle analysis type change
document.getElementById('analysisType').addEventListener('change', function() {
    if (document.getElementById('results') && !document.getElementById('results').classList.contains('hidden')) {
        const layers = drawnItems.getLayers();
        if (layers.length > 0) {
            const layer = layers[0];
            if (layer.getLatLng) {
                // Point marker
                const latlng = layer.getLatLng();
                analyzePoint(latlng.lat, latlng.lng);
            } else {
                // Drawn shape
                const bounds = layer.getBounds();
                analyzeArea(
                    bounds.getSouthWest().lat, 
                    bounds.getSouthWest().lng,
                    bounds.getNorthEast().lat,
                    bounds.getNorthEast().lng
                );
            }
        }
    }
});
