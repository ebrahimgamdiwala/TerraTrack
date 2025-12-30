"""
LLM-powered explanation generator for satellite analysis results
Uses Google Gemini API for high-quality explanations
"""

import json
from typing import Dict
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, will use system env vars

class LLMExplainer:
    """Generates natural language explanations from analysis results using Gemini"""
    
    def __init__(self, api_key=None, model='gemini-2.5-flash-lite'):
        """
        Initialize LLM explainer with Gemini
        
        Args:
            api_key: Gemini API key (or set GEMINI_API_KEY env variable)
            model: Gemini model name (default: 'gemini-2.5-flash-lite')
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.model = model
        
        if not self.api_key:
            raise ValueError("Gemini API key required. Set GEMINI_API_KEY environment variable or pass api_key parameter.")
        
        # Import Gemini (new package)
        try:
            from google import genai
            from google.genai import types
            
            self.client = genai.Client(api_key=self.api_key)
            self.types = types
            print(f"✓ Gemini initialized ({model})")
        except ImportError:
            raise ImportError("Please install: pip install google-genai")
        except Exception as e:
            raise Exception(f"Failed to initialize Gemini: {e}")
    
    def generate_explanation(self, analysis_report: Dict) -> Dict[str, str]:
        """
        Generate natural language explanations from analysis report
        
        Args:
            analysis_report: JSON report from analyzer
            
        Returns:
            Dictionary with different explanation types
        """
        # Extract key metrics
        metadata = analysis_report['metadata']
        veg = analysis_report['vegetation_analysis']
        urban = analysis_report['urban_analysis']
        water = analysis_report['water_analysis']
        summary = analysis_report.get('summary', [])
        
        # Create prompt
        prompt = self._create_prompt(metadata, veg, urban, water, summary)
        
        print("🤖 Generating LLM explanation...")
        
        # Get LLM response
        explanation_text = self._call_gemini(prompt)
        
        # Parse into sections
        explanations = self._parse_response(explanation_text)
        
        return explanations
    
    def _create_prompt(self, metadata, veg, urban, water, summary):
        """Create structured prompt for LLM"""
        
        prompt = f"""You are an environmental analysis assistant. Analyze this satellite change detection report and provide clear explanations.

IMPORTANT: Only use the data provided. Do not speculate. Use scientific, cautious language.

**LOCATION**: {metadata['location']}
**TIME PERIOD**: {metadata['date_before']} to {metadata['date_after']}
**RESOLUTION**: {metadata['image_resolution']}

**VEGETATION CHANGES**:
- Vegetation Increase: {veg['vegetation_increase_percent']:.2f}%
- Vegetation Decrease: {veg['vegetation_decrease_percent']:.2f}%
- Mean NDVI Change: {veg['mean_ndvi_change']:.4f}
- Max Vegetation Gain: {veg['max_vegetation_gain']:.4f}
- Max Vegetation Loss: {veg['max_vegetation_loss']:.4f}

**URBAN DEVELOPMENT**:
- Urbanization: {urban['urbanization_percent']:.2f}%
- Construction Area: {urban['construction_area_km2']:.2f} km²
- Demolition Area: {urban['demolition_area_km2']:.2f} km²
- Mean NDBI Change: {urban['mean_ndbi_change']:.4f}

**WATER BODIES**:
- Water Increase: {water['water_increase_percent']:.2f}%
- Water Decrease: {water['water_decrease_percent']:.2f}%
- Water Gain Area: {water['water_gain_area_km2']:.2f} km²
- Water Loss Area: {water['water_loss_area_km2']:.2f} km²

**AUTOMATED SUMMARY**:
{chr(10).join(f'- {item}' for item in summary)}

Provide a comprehensive analysis with these sections:

1. EXECUTIVE SUMMARY (2-3 sentences)
2. DETAILED ANALYSIS (organized by vegetation, urban, water)
3. ENVIRONMENTAL IMPACT (overall assessment)
4. RECOMMENDATIONS (3-5 actionable items)
5. KEY INSIGHTS (bullet points)

Use the exact percentages and areas from the data. Be specific and quantitative."""

        return prompt
    
    def _call_gemini(self, prompt):
        """Call Gemini API"""
        
        try:
            print("  Calling Gemini API...")
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=self.types.GenerateContentConfig(
                    temperature=0.3,
                    top_p=0.9,
                    max_output_tokens=2000
                )
            )
            
            return response.text
            
        except Exception as e:
            return f"Error calling Gemini: {str(e)}"
    
    def _parse_response(self, text):
        """Parse LLM response into structured sections"""
        
        sections = {
            'executive_summary': '',
            'detailed_analysis': '',
            'environmental_impact': '',
            'recommendations': '',
            'key_insights': '',
            'full_text': text  # Keep full text as backup
        }
        
        # Simple parsing based on headers
        current_section = None
        lines = text.split('\n')
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Detect section headers
            if 'executive summary' in line_lower or line_lower.startswith('1.'):
                current_section = 'executive_summary'
                continue
            elif 'detailed analysis' in line_lower or line_lower.startswith('2.'):
                current_section = 'detailed_analysis'
                continue
            elif 'environmental impact' in line_lower or line_lower.startswith('3.'):
                current_section = 'environmental_impact'
                continue
            elif 'recommendation' in line_lower or line_lower.startswith('4.'):
                current_section = 'recommendations'
                continue
            elif 'key insight' in line_lower or line_lower.startswith('5.'):
                current_section = 'key_insights'
                continue
            
            # Add content to current section
            if current_section and line.strip():
                sections[current_section] += line + '\n'
        
        # If parsing failed, put everything in full_text
        if not any(sections[k] for k in ['executive_summary', 'detailed_analysis']):
            sections['executive_summary'] = text[:500]  # First 500 chars
            sections['detailed_analysis'] = text
        
        return sections


def test_explainer():
    """Test the LLM explainer with sample data"""
    
    # Sample report
    sample_report = {
        'metadata': {
            'location': 'Milano',
            'date_before': '20160120',
            'date_after': '20180328',
            'image_resolution': '10m per pixel'
        },
        'vegetation_analysis': {
            'vegetation_increase_percent': 15.2,
            'vegetation_decrease_percent': 8.3,
            'mean_ndvi_change': 0.0234,
            'max_vegetation_gain': 0.45,
            'max_vegetation_loss': -0.38
        },
        'urban_analysis': {
            'urbanization_percent': 12.5,
            'construction_area_km2': 3.88,
            'demolition_area_km2': 0.15,
            'mean_ndbi_change': 0.0156
        },
        'water_analysis': {
            'water_increase_percent': 2.1,
            'water_decrease_percent': 8.7,
            'water_gain_area_km2': 0.65,
            'water_loss_area_km2': 3.94
        },
        'summary': [
            'Urban expansion detected (3.88 km² of new construction)',
            'Vegetation loss detected (8.3% of area)',
            'Water body reduction (3.94 km²)'
        ]
    }
    
    print("Testing LLM Explainer with Gemini...")
    print("=" * 80)
    
    # Check for API key
    import os
    if not os.getenv('GEMINI_API_KEY'):
        print("\n❌ GEMINI_API_KEY not set!")
        print("Set it with: setx GEMINI_API_KEY \"your-api-key-here\"")
        return
    
    explainer = LLMExplainer()
    explanations = explainer.generate_explanation(sample_report)
    
    print("\n📊 EXECUTIVE SUMMARY:")
    print(explanations['executive_summary'])
    
    print("\n📝 DETAILED ANALYSIS:")
    print(explanations['detailed_analysis'][:500] + "...")
    
    print("\n💡 KEY INSIGHTS:")
    print(explanations['key_insights'])
    
    print("\n" + "=" * 80)
    print("✅ Test complete!")
    
    return explanations


if __name__ == '__main__':
    # Run test
    test_explainer()
