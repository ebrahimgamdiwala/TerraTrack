"""Prediction and analysis script for user input images"""

import torch
import numpy as np
import rasterio
import matplotlib.pyplot as plt
import json
import os
from datetime import datetime
import config
from model import ChangeDetectionModel
from analyzer import EnvironmentalAnalyzer
from visualization import ChangeVisualizer
from llm_explainer import LLMExplainer

class ChangeDetectionPredictor:
    def __init__(self, model_path):
        # Try GPU first, fallback to CPU if memory issues
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Clear GPU cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            print(f"🎮 Using GPU: {torch.cuda.get_device_name(0)}")
            print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        else:
            print("💻 Using CPU (GPU not available)")
        
        try:
            self.model = ChangeDetectionModel(in_channels=13).to(self.device)
            
            # Load trained model
            checkpoint = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.eval()
            
            # Enable memory efficient mode
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
        except RuntimeError as e:
            if "out of memory" in str(e):
                print("⚠️  GPU out of memory, switching to CPU...")
                torch.cuda.empty_cache()
                self.device = torch.device('cpu')
                self.model = ChangeDetectionModel(in_channels=13).to(self.device)
                checkpoint = torch.load(model_path, map_location=self.device)
                self.model.load_state_dict(checkpoint['model_state_dict'])
                self.model.eval()
            else:
                raise
        
        self.analyzer = EnvironmentalAnalyzer()
        self.visualizer = ChangeVisualizer()
        
        # Initialize LLM explainer (optional)
        try:
            self.llm_explainer = LLMExplainer(model='gemini-2.5-flash-lite')
            print("✓ LLM explainer initialized")
        except Exception as e:
            print(f"⚠️  LLM explainer not available: {e}")
            self.llm_explainer = None
    
    def load_image_bands(self, image_folder):
        """Load all 13 bands from a folder"""
        bands = []
        for band_name in config.BAND_NAMES:
            band_path = os.path.join(image_folder, f"{band_name}.tif")
            with rasterio.open(band_path) as src:
                band_data = src.read(1).astype(np.float32)
                band_data = np.clip(band_data / 10000.0, 0, 1)
                bands.append(band_data)
        
        return np.stack(bands, axis=0)
    
    def predict(self, img1_folder, img2_folder, date1=None, date2=None, location="Unknown"):
        """
        Predict changes between two satellite images
        
        Args:
            img1_folder: Path to folder containing before image bands
            img2_folder: Path to folder containing after image bands
            date1: Date of first image (YYYYMMDD format)
            date2: Date of second image (YYYYMMDD format)
            location: Name of the location
        
        Returns:
            Dictionary containing predictions and analysis
        """
        print("Loading images...")
        bands1 = self.load_image_bands(img1_folder)
        bands2 = self.load_image_bands(img2_folder)
        
        # Convert to tensors
        img1_tensor = torch.from_numpy(bands1).unsqueeze(0).to(self.device)
        img2_tensor = torch.from_numpy(bands2).unsqueeze(0).to(self.device)
        
        print("Running model inference...")
        with torch.no_grad():
            predictions = self.model(img1_tensor, img2_tensor)
        
        # Convert predictions to numpy
        change_map = predictions['change'].cpu().numpy()[0, 0]
        vegetation_map = predictions['vegetation'].cpu().numpy()[0]
        urban_map = predictions['urban'].cpu().numpy()[0]
        
        print("Analyzing environmental changes...")
        # Generate detailed analysis
        report = self.analyzer.generate_report(
            bands1, bands2, date1, date2, location
        )
        
        # Add model predictions to report
        report['model_predictions'] = {
            'total_change_percent': float(np.mean(change_map > config.CHANGE_THRESHOLD) * 100),
            'vegetation_increase_pixels': int(np.sum(np.argmax(vegetation_map, axis=0) == 1)),
            'vegetation_decrease_pixels': int(np.sum(np.argmax(vegetation_map, axis=0) == 2)),
            'urban_construction_pixels': int(np.sum(np.argmax(urban_map, axis=0) == 1)),
            'urban_demolition_pixels': int(np.sum(np.argmax(urban_map, axis=0) == 2))
        }
        
        print("Generating visualizations...")
        # Create visualizations
        output_dir = os.path.join(config.RESULTS_DIR, f"{location}_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        os.makedirs(output_dir, exist_ok=True)
        
        self.visualizer.create_change_visualization(
            bands1, bands2, change_map, vegetation_map, urban_map,
            output_path=os.path.join(output_dir, 'change_analysis.png')
        )
        
        # Save report
        report_path = os.path.join(output_dir, 'analysis_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=4)
        
        # Generate text report
        self._generate_text_report(report, os.path.join(output_dir, 'report.txt'))
        
        # Generate LLM explanation if available
        if self.llm_explainer:
            try:
                print("Generating LLM explanations...")
                explanations = self.llm_explainer.generate_explanation(report)
                report['llm_explanations'] = explanations
                
                # Save LLM report
                self._generate_llm_report(report, explanations, 
                                         os.path.join(output_dir, 'llm_report.txt'))
                print("✓ LLM explanations generated")
            except Exception as e:
                print(f"⚠️  Could not generate LLM explanations: {e}")
        
        print(f"\nResults saved to: {output_dir}")
        return report
    
    def _generate_text_report(self, report, output_path):
        """Generate human-readable text report"""
        with open(output_path, 'w') as f:
            f.write("=" * 80 + "\n")
            f.write("ENVIRONMENTAL CHANGE DETECTION REPORT\n")
            f.write("=" * 80 + "\n\n")
            
            # Metadata
            f.write("ANALYSIS METADATA\n")
            f.write("-" * 80 + "\n")
            for key, value in report['metadata'].items():
                f.write(f"{key.replace('_', ' ').title()}: {value}\n")
            f.write("\n")
            
            # Vegetation Analysis
            f.write("VEGETATION ANALYSIS\n")
            f.write("-" * 80 + "\n")
            veg = report['vegetation_analysis']
            f.write(f"Vegetation Increase: {veg['vegetation_increase_percent']:.2f}%\n")
            f.write(f"Vegetation Decrease: {veg['vegetation_decrease_percent']:.2f}%\n")
            f.write(f"Mean NDVI Change: {veg['mean_ndvi_change']:.4f}\n")
            f.write(f"Maximum Vegetation Gain: {veg['max_vegetation_gain']:.4f}\n")
            f.write(f"Maximum Vegetation Loss: {veg['max_vegetation_loss']:.4f}\n")
            f.write("\n")
            
            # Urban Analysis
            f.write("URBAN DEVELOPMENT ANALYSIS\n")
            f.write("-" * 80 + "\n")
            urban = report['urban_analysis']
            f.write(f"Urbanization: {urban['urbanization_percent']:.2f}%\n")
            f.write(f"Construction Area: {urban['construction_area_km2']:.2f} km²\n")
            f.write(f"Demolition Area: {urban['demolition_area_km2']:.2f} km²\n")
            f.write(f"Mean NDBI Change: {urban['mean_ndbi_change']:.4f}\n")
            f.write("\n")
            
            # Water Analysis
            f.write("WATER BODY ANALYSIS\n")
            f.write("-" * 80 + "\n")
            water = report['water_analysis']
            f.write(f"Water Increase: {water['water_increase_percent']:.2f}%\n")
            f.write(f"Water Decrease: {water['water_decrease_percent']:.2f}%\n")
            f.write(f"Water Gain Area: {water['water_gain_area_km2']:.2f} km²\n")
            f.write(f"Water Loss Area: {water['water_loss_area_km2']:.2f} km²\n")
            f.write("\n")
            
            # Summary
            f.write("SUMMARY\n")
            f.write("-" * 80 + "\n")
            for item in report['summary']:
                f.write(f"• {item}\n")
            f.write("\n")
            f.write("=" * 80 + "\n")

    def _generate_llm_report(self, report, explanations, output_path):
        """Generate LLM-enhanced text report"""
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("ENVIRONMENTAL CHANGE ANALYSIS - LLM ENHANCED REPORT\n")
            f.write("=" * 80 + "\n\n")
            
            # Metadata
            f.write("LOCATION: " + report['metadata']['location'] + "\n")
            f.write("TIME PERIOD: " + report['metadata']['date_before'] + 
                   " to " + report['metadata']['date_after'] + "\n")
            f.write("ANALYSIS DATE: " + report['metadata']['analysis_date'] + "\n")
            f.write("\n" + "=" * 80 + "\n\n")
            
            # Executive Summary
            f.write("EXECUTIVE SUMMARY\n")
            f.write("-" * 80 + "\n")
            f.write(explanations['executive_summary'].strip() + "\n\n")
            
            # Detailed Analysis
            f.write("DETAILED ANALYSIS\n")
            f.write("-" * 80 + "\n")
            f.write(explanations['detailed_analysis'].strip() + "\n\n")
            
            # Environmental Impact
            f.write("ENVIRONMENTAL IMPACT ASSESSMENT\n")
            f.write("-" * 80 + "\n")
            f.write(explanations['environmental_impact'].strip() + "\n\n")
            
            # Recommendations
            f.write("RECOMMENDATIONS\n")
            f.write("-" * 80 + "\n")
            f.write(explanations['recommendations'].strip() + "\n\n")
            
            # Key Insights
            f.write("KEY INSIGHTS\n")
            f.write("-" * 80 + "\n")
            f.write(explanations['key_insights'].strip() + "\n\n")
            
            # Raw Data Section
            f.write("=" * 80 + "\n")
            f.write("RAW DATA\n")
            f.write("=" * 80 + "\n\n")
            
            veg = report['vegetation_analysis']
            f.write("VEGETATION METRICS:\n")
            f.write(f"  Increase: {veg['vegetation_increase_percent']:.2f}%\n")
            f.write(f"  Decrease: {veg['vegetation_decrease_percent']:.2f}%\n")
            f.write(f"  Mean NDVI Change: {veg['mean_ndvi_change']:.4f}\n\n")
            
            urban = report['urban_analysis']
            f.write("URBAN METRICS:\n")
            f.write(f"  Urbanization: {urban['urbanization_percent']:.2f}%\n")
            f.write(f"  Construction: {urban['construction_area_km2']:.2f} km²\n")
            f.write(f"  Demolition: {urban['demolition_area_km2']:.2f} km²\n\n")
            
            water = report['water_analysis']
            f.write("WATER METRICS:\n")
            f.write(f"  Increase: {water['water_increase_percent']:.2f}%\n")
            f.write(f"  Decrease: {water['water_decrease_percent']:.2f}%\n")
            f.write(f"  Gain: {water['water_gain_area_km2']:.2f} km²\n")
            f.write(f"  Loss: {water['water_loss_area_km2']:.2f} km²\n\n")
            
            f.write("=" * 80 + "\n")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Satellite Change Detection and Analysis')
    parser.add_argument('--img1', required=True, help='Path to before image folder')
    parser.add_argument('--img2', required=True, help='Path to after image folder')
    parser.add_argument('--date1', help='Date of first image (YYYYMMDD)')
    parser.add_argument('--date2', help='Date of second image (YYYYMMDD)')
    parser.add_argument('--location', default='Unknown', help='Location name')
    parser.add_argument('--model', default='models/best_model.pth', help='Path to trained model')
    
    args = parser.parse_args()
    
    predictor = ChangeDetectionPredictor(args.model)
    report = predictor.predict(
        args.img1, args.img2,
        args.date1, args.date2,
        args.location
    )
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)
    print("\nKey Findings:")
    for item in report['summary']:
        print(f"  • {item}")

if __name__ == '__main__':
    main()
