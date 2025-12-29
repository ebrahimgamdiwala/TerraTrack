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
    
    // Store conversation history for follow-up questions
    this.conversationHistory = []
    this.maxHistoryLength = 10 // Keep last 10 exchanges
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = []
  }

  // Main method to analyze climate queries with web scraping
  async analyzeClimateQuery(userQuery, isNewConversation = false) {
    try {
      // Clear history if this is a new conversation
      if (isNewConversation) {
        this.clearHistory()
      }

      // System prompt for climate analysis
      const systemPrompt = `
You are TerraBot, an advanced AI climate data analyst. Your role is to provide comprehensive climate and environmental analysis with web scraping, visualization, and proper source citations.

INSTRUCTIONS:
1. **Web Scraping & Research**: Search for the most recent and relevant climate data, news, and research papers related to the user's query
2. **Data Analysis**: Analyze trends, patterns, and insights from the gathered data
3. **Visualization**: When appropriate, suggest visualizations and provide sample data structures
4. **Source Citation**: Always cite your sources with proper attribution
5. **Actionable Insights**: Provide clear, actionable conclusions and recommendations
6. **Context Awareness**: Use the conversation history to provide relevant follow-up responses

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

IMPORTANT JSON RULES:
- Ensure all strings are properly escaped (especially newlines as \\n)
- Do not include trailing commas in arrays or objects
- Ensure all brackets and braces are properly closed
- Keep the response concise to avoid truncation

FOCUS AREAS:
- Climate change trends and impacts
- Environmental data analysis
- Sustainable solutions and technologies  
- Carbon footprint and emissions data
- Weather patterns and extreme events
- Renewable energy statistics  
- Environmental policy and regulations
- Conservation and biodiversity data
`

      // Build conversation contents with history
      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: '{"content": "I understand. I am TerraBot, ready to help with climate and environmental analysis. I will respond with properly formatted JSON.", "sources": [], "visualization": null}' }]
        }
      ]

      // Add conversation history
      for (const exchange of this.conversationHistory) {
        contents.push({
          role: 'user',
          parts: [{ text: exchange.user }]
        })
        contents.push({
          role: 'model', 
          parts: [{ text: JSON.stringify(exchange.response) }]
        })
      }

      // Add current user query
      contents.push({
        role: 'user',
        parts: [{ text: userQuery }]
      })

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

      // Parse JSON response with improved error handling
      let parsedResponse = null
      
      try {
        parsedResponse = JSON.parse(fullResponse)
      } catch (error) {
        console.warn('Direct JSON parse failed, trying extraction', error)
        parsedResponse = this.extractJSON(fullResponse)
      }

      if (parsedResponse && typeof parsedResponse === 'object') {
        const result = {
          content: parsedResponse.content || '',
          sources: Array.isArray(parsedResponse.sources) ? parsedResponse.sources : [],
          visualization: parsedResponse.visualization || null
        }
        
        // Store successful exchange in conversation history
        this.conversationHistory.push({
          user: userQuery,
          response: result
        })
        
        // Trim history if it gets too long
        if (this.conversationHistory.length > this.maxHistoryLength) {
          this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength)
        }
        
        return result
      }

      // Fallback if JSON parsing fails completely but we have text
      const fallbackResult = {
        content: this.cleanResponseText(fullResponse) || 'I apologize, but I encountered an issue processing your request.',
        sources: [],
        visualization: null
      }
      
      // Still store in history even if parsing failed
      this.conversationHistory.push({
        user: userQuery,
        response: fallbackResult
      })
      
      return fallbackResult

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

  // Clean response text when JSON parsing fails
  cleanResponseText(text) {
    if (!text) return ''
    
    // Remove markdown code blocks
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    // Try to extract just the content field if it exists
    const contentMatch = cleaned.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
    if (contentMatch) {
      try {
        return JSON.parse(`"${contentMatch[1]}"`)
      } catch {
        return contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
      }
    }
    
    return cleaned.trim()
  }

  // Extract JSON from response text with improved handling
  extractJSON(text) {
    if (!text) return null
    
    try {
      // First, try to find JSON code block
      const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (codeBlockMatch) {
        const parsed = this.tryParseJSON(codeBlockMatch[1])
        if (parsed) return parsed
      }

      // Try to find a JSON object directly
      const jsonObjectMatch = text.match(/\{[\s\S]*\}/)
      if (jsonObjectMatch) {
        const parsed = this.tryParseJSON(jsonObjectMatch[0])
        if (parsed) return parsed
      }

      return null
    } catch (error) {
      console.warn('JSON extraction failed:', error)
      return null
    }
  }

  // Try to parse JSON with automatic fixing of common issues
  tryParseJSON(jsonString) {
    if (!jsonString) return null
    
    // First try direct parse
    try {
      return JSON.parse(jsonString)
    } catch (e) {
      // Continue to try fixes
    }

    let fixed = jsonString.trim()
    
    try {
      // Fix 1: Remove trailing commas before ] or }
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1')
      
      // Fix 2: Try to find balanced braces - the JSON might be truncated
      let braceCount = 0
      let bracketCount = 0
      let lastValidIndex = 0
      
      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i]
        if (char === '{') braceCount++
        else if (char === '}') {
          braceCount--
          if (braceCount === 0 && bracketCount === 0) {
            lastValidIndex = i + 1
          }
        }
        else if (char === '[') bracketCount++
        else if (char === ']') bracketCount--
      }
      
      // If unbalanced, try to truncate at last valid position or close brackets
      if (braceCount !== 0 || bracketCount !== 0) {
        if (lastValidIndex > 0 && lastValidIndex < fixed.length) {
          fixed = fixed.substring(0, lastValidIndex)
        } else {
          // Try to close open braces/brackets
          while (bracketCount > 0) {
            fixed += ']'
            bracketCount--
          }
          while (braceCount > 0) {
            fixed += '}'
            braceCount--
          }
        }
      }
      
      return JSON.parse(fixed)
    } catch (e) {
      // Fix 3: Try to extract just content, sources, visualization fields
      try {
        const contentMatch = fixed.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
        const content = contentMatch ? JSON.parse(`"${contentMatch[1]}"`) : ''
        
        // Try to extract sources array
        let sources = []
        const sourcesMatch = fixed.match(/"sources"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/s)
        if (sourcesMatch) {
          try {
            sources = JSON.parse(sourcesMatch[1])
          } catch {
            sources = []
          }
        }
        
        return {
          content,
          sources,
          visualization: null
        }
      } catch {
        return null
      }
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