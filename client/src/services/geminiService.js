import { GoogleGenAI } from '@google/genai'

class GeminiService {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY
    })

    this.model = 'gemini-2.5-flash'
    this.config = {
      responseMimeType: 'application/json',
    }
  }

  // Main method to analyze climate queries with web scraping
  async analyzeClimateQuery(userQuery) {
    try {
      // Enhanced prompt for climate analysis with web scraping and visualization
      const enhancedPrompt = `
You are TerraBot, an advanced AI climate data analyst. Your role is to provide comprehensive climate and environmental analysis with web scraping, visualization, and proper source citations.

USER QUERY: "${userQuery}"

INSTRUCTIONS:
1. **Web Scraping & Research**: Search for the most recent and relevant climate data, news, and research papers related to the user's query
2. **Data Analysis**: Analyze trends, patterns, and insights from the gathered data
3. **Visualization**: When appropriate, suggest visualizations and provide sample data structures
4. **Source Citation**: Always cite your sources with proper attribution
5. **Actionable Insights**: Provide clear, actionable conclusions and recommendations

RESPONSE FORMAT:
You MUST respond with a valid JSON object matching this structure:
{
  "content": "Your detailed analysis in markdown format. Use \\n for newlines.",
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "type": "article|research|news|data",
      "description": "Brief description",
      "publishedDate": "2024-01-01",
      "author": "Author name",
      "reliability": 5
    }
  ],
  "visualization": {
    "type": "line|bar|doughnut|scatter",
    "title": "Chart title",
    "description": "Chart description",
    "chartData": {
      "labels": ["Label1", "Label2"],
      "datasets": [{
        "label": "Dataset name",
        "data": [10, 20],
        "backgroundColor": "rgba(16, 185, 129, 0.6)",
        "borderColor": "rgba(16, 185, 129, 1)",
        "borderWidth": 2,
        "fill": false
      }]
    },
    "insights": ["Insight 1", "Insight 2"],
    "summary": {
      "metric": "value"
    }
  }
}

FOCUS AREAS:
- Climate change trends and impacts
- Environmental data analysis
- Sustainable solutions and technologies  
- Carbon footprint and emissions data
- Weather patterns and extreme events
- Renewable energy statistics  
- Environmental policy and regulations
- Conservation and biodiversity data

Please provide a comprehensive, well-researched response with recent data, proper citations, and actionable insights. When suggesting visualizations, use realistic sample data that reflects current climate trends.
`

      const contents = [
        {
          role: 'user',
          parts: [{ text: enhancedPrompt }]
        }
      ]

      const response = await this.ai.models.generateContentStream({
        model: this.model,
        config: this.config,
        contents
      })

      let fullResponse = ''
      for await (const chunk of response) {
        // Handle different response formats
        if (typeof chunk.text === 'function') {
          fullResponse += chunk.text()
        } else if (typeof chunk.text === 'string') {
          fullResponse += chunk.text
        } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
          fullResponse += chunk.candidates[0].content.parts[0].text
        }
      }

      // Parse JSON response
      try {
        const jsonResponse = JSON.parse(fullResponse)
        if (jsonResponse && typeof jsonResponse === 'object') {
          // Ensure the response has the expected structure
          return {
            content: jsonResponse.content || '',
            sources: jsonResponse.sources || [],
            visualization: jsonResponse.visualization || null
          }
        }
      } catch (error) {
        console.warn('Direct JSON parse failed, trying extraction', error)
        const jsonResponse = this.extractJSON(fullResponse)
        if (jsonResponse && typeof jsonResponse === 'object') {
          return {
            content: jsonResponse.content || '',
            sources: jsonResponse.sources || [],
            visualization: jsonResponse.visualization || null
          }
        }
      }

      // Fallback if JSON parsing fails completely but we have text
      return {
        content: fullResponse || 'I apologize, but I encountered an issue processing your request.',
        sources: [],
        visualization: null
      }

    } catch (error) {
      console.error('Error in Gemini service:', error)

      // Check for rate limit error (429)
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Gemini quota exceeded, using fallback response')

        // Return a high-quality fallback response based on user query
        const isAnalysis = userQuery.toLowerCase().includes('analyz') || userQuery.toLowerCase().includes('breakdown');
        const fallbackTopic = userQuery.includes('Delhi') ? 'Air Quality in Delhi' : 'Climate Data';

        return {
          content: `### ⚠️ API Usage Limit Reached\n\nI'm currently experiencing high traffic and have reached my AI processing limit. However, here is a general analysis based on historical patterns for **${fallbackTopic}**:\n\n* **Primary Pollutants:** PM2.5 and PM10 are typically the main concerns, often driven by vehicular emissions and seasonal factors.\n* **Seasonal Trends:** Pollution levels often spike during winter months due to temperature inversion and lower wind speeds.\n* **Health Impact:** Prolonged exposure can affect respiratory health. Sensitive groups should wear masks when AQI is high.\n\n*Please try again in a minute for a real-time AI analysis.*`,
          sources: [
            { title: "Open-Meteo Data (Real-time)", url: "https://open-meteo.com", type: "data", reliability: 5 },
            { title: "WHO Air Quality Guidelines", url: "https://www.who.int", type: "article", reliability: 5 }
          ],
          visualization: this.generateSampleVisualization('line', isAnalysis ? 'Pollution Levels' : 'Temperature Trends')
        }
      }

      throw new Error('Failed to analyze climate query: ' + error.message)
    }
  }

  // Extract JSON from response text
  extractJSON(text) {
    try {
      // Look for JSON block in the response
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0]
        return JSON.parse(jsonString)
      }

      // If no JSON block found, and direct parse failed, return null
      return null
    } catch (error) {
      console.warn('JSON extraction failed:', error)
      return null
    }
  }

  // Generate sample visualization data for different chart types
  generateSampleVisualization(type, topic) {
    switch (type) {
      case 'line':
        return {
          type: 'line',
          title: `${topic} Trend Over Time`,
          description: 'Historical trend analysis showing changes over time',
          chartData: {
            labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: [{
              label: topic,
              data: [65, 68, 72, 75, 78, 82],
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4
            }]
          },
          insights: [
            'Steady upward trend observed',
            'Acceleration in recent years',
            'Projections suggest continued growth'
          ],
          summary: {
            'Avg Growth': '+4.2%',
            'Peak Year': '2024',
            'Total Change': '+26%'
          }
        }

      case 'bar':
        return {
          type: 'bar',
          title: `${topic} by Region`,
          description: 'Comparative analysis across different regions',
          chartData: {
            labels: ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'],
            datasets: [{
              label: topic,
              data: [45, 38, 52, 28, 31, 15],
              backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(52, 211, 153, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(74, 222, 128, 0.8)',
                'rgba(132, 204, 22, 0.8)',
                'rgba(163, 230, 53, 0.8)'
              ],
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 2
            }]
          },
          insights: [
            'Asia shows highest values',
            'Oceania has lowest impact',
            'Regional disparities evident'
          ]
        }

      case 'doughnut':
        return {
          type: 'doughnut',
          title: `${topic} Distribution`,
          description: 'Breakdown of contributing factors',
          chartData: {
            labels: ['Energy', 'Transportation', 'Industry', 'Agriculture', 'Buildings'],
            datasets: [{
              data: [35, 25, 20, 12, 8],
              backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(52, 211, 153, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(74, 222, 128, 0.8)',
                'rgba(132, 204, 22, 0.8)'
              ],
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 2
            }]
          },
          insights: [
            'Energy sector dominates',
            'Transportation significant contributor',
            'Buildings have smallest share'
          ]
        }

      default:
        return null
    }
  }

  // Add this new method for location-based environmental alerts
  // Add this new method for location-based environmental alerts
  // Add this method inside GeminiService class
  async getLocationAlerts(latitude, longitude, envData = {}) {
    try {
      const { weatherData, airQualityData } = envData;

      const prompt = `
You are TerraTrack's environmental alert system. 
The user is at latitude {lat}, longitude {lon}. 
Here is the real-time environmental data in JSON format:

{weatherJson}

Please generate **5-7 actionable environmental alerts** for the user. 
- Each alert must be **based only on this data**.  
- Alerts should be **short, clear, and actionable**.  
- Use **high severity** for dangerous conditions, **low** for mild advisories.  
- Categories: air|water|weather|hazard|heat|storm.  
- Output JSON format:

[
  {
    "message": "Short alert message",
    "severity": "high|low",
    "category": "air|weather|water|hazard|heat",
    "image": "optional relevant image or icon URL"
  }
]

      `;

      const contents = [
        { role: 'user', parts: [{ text: prompt }] }
      ];

      const response = await this.ai.models.generateContentStream({
        model: this.model,
        config: this.config,
        contents
      });

      let fullResponse = '';
      for await (const chunk of response) {
        if (chunk.text) fullResponse += chunk.text;
      }

      const alerts = this.extractJSON(fullResponse) || [];
      return alerts;

    } catch (error) {
      console.error('Error getting location alerts:', error);
      return [{
        message: 'Unable to fetch environmental alerts at this time.',
        severity: 'high',
        category: 'system'
      }];
    }
  }
}

export const geminiService = new GeminiService()