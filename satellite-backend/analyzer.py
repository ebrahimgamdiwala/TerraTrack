"""Environmental Change Analyzer - Generates detailed analysis reports"""

import numpy as np
import torch
import rasterio
from datetime import datetime
import json

class EnvironmentalAnalyzer:
    def __init__(self):
        # Sentinel-2 band wavelengths (nm)
        self.band_info = {
            'B01': {'name': 'Coastal aerosol', 'wavelength': 443},
            'B02': {'name': 'Blue', 'wavelength': 490},
            'B03': {'name': 'Green', 'wavelength': 560},
            'B04': {'name': 'Red', 'wavelength': 665},
            'B05': {'name': 'Vegetation Red Edge', 'wavelength': 705},
            'B06': {'name': 'Vegetation Red Edge', 'wavelength': 740},
            'B07': {'name': 'Vegetation Red Edge', 'wavelength': 783},
            'B08': {'name': 'NIR', 'wavelength': 842},
            'B8A': {'name': 'Narrow NIR', 'wavelength': 865},
            'B09': {'name': 'Water vapour', 'wavelength': 945},
            'B10': {'name': 'SWIR - Cirrus', 'wavelength': 1375},
            'B11': {'name': 'SWIR', 'wavelength': 1610},
            'B12': {'name': 'SWIR', 'wavelength': 2190}
        }
    
    def calculate_indices(self, bands):
        """Calculate vegetation and urban indices"""
        # Extract specific bands
        red = bands[3]  # B04
        green = bands[2]  # B03
        blue = bands[1]  # B02
        nir = bands[7]  # B08
        swir1 = bands[10]  # B11
        swir2 = bands[11]  # B12
        
        # NDVI (Normalized Difference Vegetation Index)
        ndvi = (nir - red) / (nir + red + 1e-8)
        
        # NDBI (Normalized Difference Built-up Index)
        ndbi = (swir1 - nir) / (swir1 + nir + 1e-8)
        
        # NDWI (Normalized Difference Water Index)
        ndwi = (green - nir) / (green + nir + 1e-8)
        
        # SAVI (Soil Adjusted Vegetation Index)
        L = 0.5
        savi = ((nir - red) / (nir + red + L)) * (1 + L)
        
        return {
            'ndvi': ndvi,
            'ndbi': ndbi,
            'ndwi': ndwi,
            'savi': savi
        }
    
    def analyze_vegetation_change(self, indices1, indices2):
        """Analyze vegetation changes"""
        ndvi_diff = indices2['ndvi'] - indices1['ndvi']
        savi_diff = indices2['savi'] - indices1['savi']
        
        # Classify changes
        vegetation_increase = np.sum(ndvi_diff > 0.1)
        vegetation_decrease = np.sum(ndvi_diff < -0.1)
        vegetation_stable = np.sum(np.abs(ndvi_diff) <= 0.1)
        
        total_pixels = ndvi_diff.size
        
        return {
            'vegetation_increase_percent': (vegetation_increase / total_pixels) * 100,
            'vegetation_decrease_percent': (vegetation_decrease / total_pixels) * 100,
            'vegetation_stable_percent': (vegetation_stable / total_pixels) * 100,
            'mean_ndvi_change': float(np.mean(ndvi_diff)),
            'mean_savi_change': float(np.mean(savi_diff)),
            'max_vegetation_gain': float(np.max(ndvi_diff)),
            'max_vegetation_loss': float(np.min(ndvi_diff))
        }
    
    def analyze_urban_change(self, indices1, indices2):
        """Analyze urban/built-up area changes"""
        ndbi_diff = indices2['ndbi'] - indices1['ndbi']
        
        # Classify changes
        urbanization = np.sum(ndbi_diff > 0.1)
        deurbanization = np.sum(ndbi_diff < -0.1)
        urban_stable = np.sum(np.abs(ndbi_diff) <= 0.1)
        
        total_pixels = ndbi_diff.size
        
        return {
            'urbanization_percent': (urbanization / total_pixels) * 100,
            'deurbanization_percent': (deurbanization / total_pixels) * 100,
            'urban_stable_percent': (urban_stable / total_pixels) * 100,
            'mean_ndbi_change': float(np.mean(ndbi_diff)),
            'construction_area_km2': (urbanization * 100) / 1e6,  # Assuming 10m resolution
            'demolition_area_km2': (deurbanization * 100) / 1e6
        }
    
    def analyze_water_change(self, indices1, indices2):
        """Analyze water body changes"""
        ndwi_diff = indices2['ndwi'] - indices1['ndwi']
        
        water_increase = np.sum(ndwi_diff > 0.1)
        water_decrease = np.sum(ndwi_diff < -0.1)
        
        total_pixels = ndwi_diff.size
        
        return {
            'water_increase_percent': (water_increase / total_pixels) * 100,
            'water_decrease_percent': (water_decrease / total_pixels) * 100,
            'mean_ndwi_change': float(np.mean(ndwi_diff)),
            'water_gain_area_km2': (water_increase * 100) / 1e6,
            'water_loss_area_km2': (water_decrease * 100) / 1e6
        }
    
    def generate_report(self, bands1, bands2, date1, date2, location="Unknown"):
        """Generate comprehensive environmental change report"""
        # Calculate indices
        indices1 = self.calculate_indices(bands1)
        indices2 = self.calculate_indices(bands2)
        
        # Analyze changes
        veg_analysis = self.analyze_vegetation_change(indices1, indices2)
        urban_analysis = self.analyze_urban_change(indices1, indices2)
        water_analysis = self.analyze_water_change(indices1, indices2)
        
        # Generate report
        report = {
            'metadata': {
                'location': location,
                'date_before': date1,
                'date_after': date2,
                'analysis_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'image_resolution': '10m per pixel'
            },
            'vegetation_analysis': veg_analysis,
            'urban_analysis': urban_analysis,
            'water_analysis': water_analysis,
            'summary': self._generate_summary(veg_analysis, urban_analysis, water_analysis)
        }
        
        return report
    
    def _generate_summary(self, veg, urban, water):
        """Generate human-readable summary"""
        summary = []
        
        # Vegetation summary
        if veg['vegetation_increase_percent'] > 10:
            summary.append(f"Significant vegetation increase detected ({veg['vegetation_increase_percent']:.1f}% of area)")
        elif veg['vegetation_decrease_percent'] > 10:
            summary.append(f"Vegetation loss detected ({veg['vegetation_decrease_percent']:.1f}% of area)")
        
        # Urban summary
        if urban['urbanization_percent'] > 5:
            summary.append(f"Urban expansion detected ({urban['construction_area_km2']:.2f} km² of new construction)")
        
        # Water summary
        if water['water_increase_percent'] > 5:
            summary.append(f"Water body expansion ({water['water_gain_area_km2']:.2f} km²)")
        elif water['water_decrease_percent'] > 5:
            summary.append(f"Water body reduction ({water['water_loss_area_km2']:.2f} km²)")
        
        if not summary:
            summary.append("Minimal environmental changes detected in the analyzed period")
        
        return summary
