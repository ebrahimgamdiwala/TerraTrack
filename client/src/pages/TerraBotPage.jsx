import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import ChatInputEnhanced from '../components/ChatInputEnhanced'
import VisualizationDisplay from '../components/VisualizationDisplay'
import SourceCitations from '../components/SourceCitations'
import SatelliteResults from '../components/SatelliteResults'
import { geminiService } from '../services/geminiService'
import { toast } from 'react-hot-toast'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const OPEN_METEO_API = 'https://air-quality-api.open-meteo.com/v1/air-quality'

const TerraBotPage = () => {
  const [searchParams] = useSearchParams()

  // Parse location data from URL params
  const locationData = {
    city: searchParams.get('city') || null,
    country: searchParams.get('country') || null,
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null,
    value: searchParams.get('value') ? parseFloat(searchParams.get('value')) : null,
    pollutant: searchParams.get('pollutant') || 'pm25',
  }

  const hasLocationData = locationData.city && locationData.lat && locationData.lng

  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [historicalData, setHistoricalData] = useState(null)
  const [rightPanelWidth, setRightPanelWidth] = useState(420)
  const [isResizing, setIsResizing] = useState(false)
  const [satelliteResults, setSatelliteResults] = useState(null)
  const [satelliteImages, setSatelliteImages] = useState([])
  const messagesEndRef = useRef(null)
  const hasTriggeredAutoAnalysis = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 300 && newWidth <= 800) {
        setRightPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Get pollutant display name
  const getPollutantLabel = (id) => {
    switch (id) {
      case 'pm25': return 'PM2.5';
      case 'pm10': return 'PM10';
      case 'no2': return 'NO₂';
      case 'o3': return 'O₃';
      case 'forest_loss': return 'Forest Loss';
      case 'shortwave_radiation': return 'Solar Radiation';
      default: return id?.toUpperCase() || 'Value';
    }
  }

  // Get unit for the pollutant type
  const getUnit = (id) => {
    switch (id) {
      case 'pm25':
      case 'pm10':
      case 'no2':
      case 'o3':
        return 'µg/m³';
      case 'forest_loss':
        return 'hectares';
      case 'shortwave_radiation':
        return 'W/m²';
      default:
        return 'units';
    }
  }

  // Get data type for analysis context
  const getDataType = (id) => {
    switch (id) {
      case 'pm25':
      case 'pm10':
      case 'no2':
      case 'o3':
        return 'air_quality';
      case 'forest_loss':
        return 'forest';
      case 'shortwave_radiation':
        return 'solar';
      default:
        return 'environmental';
    }
  }

  // Get AQI category
  const getAQICategory = (value) => {
    if (value <= 50) return { label: 'Good', color: 'text-green-400', bg: 'bg-green-500/20', borderColor: 'border-green-500/30' };
    if (value <= 100) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' };
    if (value <= 150) return { label: 'Unhealthy for Sensitive', color: 'text-orange-400', bg: 'bg-orange-500/20', borderColor: 'border-orange-500/30' };
    if (value <= 200) return { label: 'Unhealthy', color: 'text-red-400', bg: 'bg-red-500/20', borderColor: 'border-red-500/30' };
    if (value <= 300) return { label: 'Very Unhealthy', color: 'text-purple-400', bg: 'bg-purple-500/20', borderColor: 'border-purple-500/30' };
    return { label: 'Hazardous', color: 'text-rose-400', bg: 'bg-rose-500/20', borderColor: 'border-rose-500/30' };
  }

  const aqiCategory = locationData.value ? getAQICategory(locationData.value) : null;

  // Fetch historical data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!hasLocationData) return;

      try {
        // Map pollutant to API param
        const paramMap = {
          'pm25': 'pm2_5',
          'pm10': 'pm10',
          'no2': 'nitrogen_dioxide',
          'o3': 'ozone',
        };
        const apiParam = paramMap[locationData.pollutant] || 'pm2_5';

        // Get past 7 days data
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await axios.get(OPEN_METEO_API, {
          params: {
            latitude: locationData.lat,
            longitude: locationData.lng,
            hourly: apiParam,
            start_date: startDate,
            end_date: endDate,
            timezone: 'auto',
          }
        });

        const hourly = response.data.hourly;
        const history = hourly.time.map((t, i) => ({
          date: t,
          value: hourly[apiParam][i]
        }));

        // Prepare chart data
        const labels = history.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const values = history.map(d => d.value);

        setHistoricalData({
          labels,
          datasets: [
            {
              label: getPollutantLabel(locationData.pollutant),
              data: values,
              borderColor: 'rgb(16, 185, 129)', // Emerald-500
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
            }
          ]
        });

      } catch (err) {
        console.error('Error fetching history:', err);
      }
    };

    fetchHistory();
  }, [hasLocationData, locationData.lat, locationData.lng, locationData.pollutant]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false, color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.4)', maxTicksLimit: 6 }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.4)' }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Auto-analyze when page loads with location data
  useEffect(() => {
    if (hasLocationData && !hasTriggeredAutoAnalysis.current) {
      hasTriggeredAutoAnalysis.current = true

      // Add initial message
      setMessages([{
        id: 1,
        type: 'bot',
        content: `🔍 **Analyzing ${locationData.city}, ${locationData.country}...**\n\nI'm performing a comprehensive analysis of the environmental data for this location. Please wait while I gather insights.`,
        timestamp: new Date(),
        sources: [],
        visualization: null
      }])

      // Trigger auto-analysis
      triggerAutoAnalysis()
    } else if (!hasLocationData && messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'bot',
        content: 'Hello! I\'m TerraBot, your AI assistant for climate data analysis. I can help you analyze climate trends, scrape web data, and provide insights with visualizations. What would you like to explore?',
        timestamp: new Date(),
        sources: [],
        visualization: null
      }])
    }
  }, [hasLocationData])

  // Trigger comprehensive analysis
  const triggerAutoAnalysis = async () => {
    setIsAnalyzing(true)
    setIsTyping(true)

    const dataType = getDataType(locationData.pollutant)
    const unit = getUnit(locationData.pollutant)
    const label = getPollutantLabel(locationData.pollutant)
    
    let analysisQuery = ''
    
    if (dataType === 'forest') {
      analysisQuery = `
Perform a comprehensive forest and deforestation analysis for ${locationData.city}, ${locationData.country} (Lat: ${locationData.lat}, Lng: ${locationData.lng}).

Current ${label} data: ${locationData.value?.toFixed(2)} ${unit}

Please provide:
1. **Forest Cover Analysis**: What is the current state of forest cover in this region?
2. **Deforestation Trends**: What are the historical deforestation trends and rates?
3. **Primary Causes**: What are the main causes of forest loss in ${locationData.city}?
4. **Environmental Impact**: How does this forest loss affect local climate, biodiversity, and ecosystems?
5. **Conservation Efforts**: What conservation or reforestation initiatives exist in this area?
6. **Future Projections**: What are the predicted trends for forest cover?

Please include visualizations with data showing:
- Historical forest loss trends over years
- Causes of deforestation breakdown
- Comparison with other regions
- Impact on carbon sequestration

Make the analysis specific to ${locationData.city} and current forest conditions.
`
    } else if (dataType === 'solar') {
      analysisQuery = `
Perform a comprehensive solar radiation and renewable energy analysis for ${locationData.city}, ${locationData.country} (Lat: ${locationData.lat}, Lng: ${locationData.lng}).

Current ${label} measurement: ${locationData.value?.toFixed(1)} ${unit}

Please provide:
1. **Solar Potential Analysis**: What is the solar energy potential of this location?
2. **Radiation Patterns**: What are the seasonal and daily solar radiation patterns?
3. **Energy Generation**: How much renewable energy could be generated from solar panels?
4. **Climate Factors**: How do weather and climate patterns affect solar radiation?
5. **Comparison**: How does this compare to optimal solar locations?
6. **Recommendations**: What are the best practices for solar energy adoption in ${locationData.city}?

Please include visualizations with data showing:
- Monthly solar radiation patterns
- Potential energy generation capacity
- Comparison with other cities
- Seasonal variations

Make the analysis specific to ${locationData.city} and solar energy potential.
`
    } else {
      analysisQuery = `
Perform a comprehensive air quality analysis for ${locationData.city}, ${locationData.country} (Lat: ${locationData.lat}, Lng: ${locationData.lng}).

Current ${label} reading: ${locationData.value?.toFixed(1)} ${unit}

Please provide:
1. **Detailed Analysis**: Why is the ${label} level at ${locationData.value?.toFixed(1)} ${unit}? What are the main contributing factors?
2. **Health Impact Assessment**: What are the health implications of this pollution level?
3. **Main Sources**: What are the primary pollution sources in ${locationData.city}?
4. **Comparison**: How does this compare to WHO guidelines and other major cities?
5. **Recommendations**: What actions can residents take to protect themselves?
6. **Historical Trend**: Provide a visualization showing typical pollution patterns

Please include visualizations with sample data showing:
- Monthly pollution trends
- Pollution source breakdown by sector
- Comparison with other cities

Make the analysis specific to ${locationData.city} and current conditions.
`
    }

    try {
      const response = await geminiService.analyzeClimateQuery(analysisQuery)

      // Store analysis data for right panel
      setAnalysisData(response)

      // Create detailed response message
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        sources: response.sources || [],
        visualization: null // We'll show visualization on the right panel
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error in auto-analysis:', error)
      toast.error('Analysis failed. Please try again.')

      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: `I apologize, but I encountered an error analyzing ${locationData.city}. Please try asking a specific question about this location.`,
        timestamp: new Date(),
        sources: [],
        visualization: null
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
      setIsTyping(false)
    }
  }

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading) return

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMessage])
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Enhance query with location context if available
      const contextualQuery = hasLocationData
        ? `Context: Analyzing ${locationData.city}, ${locationData.country} with ${getPollutantLabel(locationData.pollutant)} level of ${locationData.value?.toFixed(1)} µg/m³.\n\nUser Question: ${userMessage}`
        : userMessage

      const response = await geminiService.analyzeClimateQuery(contextualQuery)

      // Update analysis data with full response
      setAnalysisData(response)

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        sources: response.sources || [],
        visualization: null
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error getting response from TerraBot:', error)
      toast.error('Sorry, I encountered an error processing your request. Please try again.')

      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
        timestamp: new Date(),
        sources: [],
        visualization: null
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    hasTriggeredAutoAnalysis.current = false
    setAnalysisData(null)
    setSatelliteResults(null)
    setSatelliteImages([])
    // Clear the conversation history in the gemini service
    geminiService.clearHistory()
    setMessages([{
      id: 1,
      type: 'bot',
      content: hasLocationData
        ? `Chat cleared! Ready to analyze **${locationData.city}, ${locationData.country}**. What would you like to know?`
        : 'Chat cleared! I\'m ready to help you with new climate data analysis questions.',
      timestamp: new Date(),
      sources: [],
      visualization: null
    }])
  }

  // Handle satellite image analysis
  const handleSatelliteAnalysis = async ({ beforeImage, afterImage, location }) => {
    setIsLoading(true)
    setIsTyping(true)
    setSatelliteResults(null)
    setSatelliteImages([])

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `🛰️ Analyzing satellite images for ${location}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const formData = new FormData()
      formData.append('before_images', beforeImage)
      formData.append('after_images', afterImage)
      formData.append('location', location)

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      const response = await axios.post(`${API_URL}/api/satellite/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes
      })

      // Store satellite results for chat panel (metrics will be shown there)
      setSatelliteResults(response.data)

      // Get list of individual visualizations
      const vizListResponse = await axios.get(`${API_URL}/api/satellite/results/${response.data.analysis_id}/visualizations`)
      
      // Create URLs for all individual visualizations
      const vizUrls = vizListResponse.data.visualizations.map(filename => 
        `${API_URL}/api/satellite/results/${response.data.analysis_id}/visualizations/${filename}`
      )
      setSatelliteImages(vizUrls)

      // Create bot message with LLM explanations AND metrics
      const llmContent = response.data.data.llm_explanations
      const metrics = response.data.data
      
      let messageContent = `## 🛰️ Satellite Analysis Complete for ${location}\n\n`

      // Add metrics tables to chat
      messageContent += `### 📊 Analysis Metrics\n\n`
      
      // Vegetation metrics
      messageContent += `**🌳 Vegetation Changes:**\n`
      messageContent += `- Increase: +${metrics.vegetation_analysis.vegetation_increase_percent.toFixed(2)}%\n`
      messageContent += `- Decrease: -${metrics.vegetation_analysis.vegetation_decrease_percent.toFixed(2)}%\n`
      messageContent += `- NDVI Change: ${metrics.vegetation_analysis.mean_ndvi_change.toFixed(4)}\n\n`
      
      // Urban metrics
      messageContent += `**🏗️ Urban Development:**\n`
      messageContent += `- Urbanization: ${metrics.urban_analysis.urbanization_percent.toFixed(2)}%\n`
      messageContent += `- Construction Area: ${metrics.urban_analysis.construction_area_km2.toFixed(2)} km²\n`
      messageContent += `- NDBI Change: ${metrics.urban_analysis.mean_ndbi_change.toFixed(4)}\n\n`
      
      // Water metrics
      messageContent += `**💧 Water Bodies:**\n`
      messageContent += `- Increase: +${metrics.water_analysis.water_increase_percent.toFixed(2)}%\n`
      messageContent += `- Decrease: -${metrics.water_analysis.water_decrease_percent.toFixed(2)}%\n`
      messageContent += `- Net Change: ${(metrics.water_analysis.water_gain_area_km2 - metrics.water_analysis.water_loss_area_km2).toFixed(2)} km²\n\n`

      // Add LLM explanations
      if (llmContent) {
        if (llmContent.executive_summary) {
          messageContent += `### Executive Summary\n${llmContent.executive_summary}\n\n`
        }
        if (llmContent.detailed_analysis) {
          messageContent += `### Detailed Analysis\n${llmContent.detailed_analysis}\n\n`
        }
        if (llmContent.environmental_impact) {
          messageContent += `### Environmental Impact\n${llmContent.environmental_impact}\n\n`
        }
        if (llmContent.recommendations) {
          messageContent += `### Recommendations\n${llmContent.recommendations}\n\n`
        }
        if (llmContent.key_insights) {
          messageContent += `### Key Insights\n${llmContent.key_insights}\n\n`
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: messageContent,
        timestamp: new Date(),
        sources: [],
        visualization: null
      }

      setMessages(prev => [...prev, botMessage])
      toast.success('Satellite analysis complete!')

    } catch (error) {
      console.error('Satellite analysis error:', error)
      toast.error(error.response?.data?.detail || 'Analysis failed. Please try again.')

      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `❌ I encountered an error analyzing the satellite images: ${error.response?.data?.detail || error.message}. Please try again with different images.`,
        timestamp: new Date(),
        sources: [],
        visualization: null
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Ensure message content is a string, even if it's a JSON string
  const getMessageContent = (content) => {
    if (!content) return '';
    
    // If it's an object, extract content field only
    if (typeof content === 'object') {
      if (content.content) {
        return content.content;
      }
      // If no content field, don't show anything (it's probably just chart data)
      return '';
    }
    
    // If it's already a string
    if (typeof content === 'string') {
      const trimmed = content.trim();
      
      // Check if it looks like JSON
      if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && 
          (trimmed.includes('"content":') || trimmed.includes('"visualization":'))) {
        try {
          const parsed = JSON.parse(trimmed);
          // If parsed successfully and has content field, return ONLY the content
          if (parsed && typeof parsed === 'object') {
            if (parsed.content && typeof parsed.content === 'string') {
              return parsed.content;
            }
            // If it's a visualization/chart data object without content, return empty
            if (parsed.visualization || parsed.chartData || parsed.type) {
              return '';
            }
          }
        } catch (e) {
          // If parse fails but looks like JSON, it might be incomplete/broken JSON
          if (trimmed.includes('"content":') || trimmed.includes('"visualization":')) {
            // Don't show broken JSON
            return '';
          }
          // If it doesn't look like our JSON format, return original
          return content;
        }
      }
      // Not JSON, return as is
      return content;
    }
    
    return String(content);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <a href="/visualiser" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TerraBot Analysis</h1>
                {hasLocationData && (
                  <p className="text-xs text-white/50">{locationData.city}, {locationData.country}</p>
                )}
              </div>
            </div>

            <button
              onClick={clearChat}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-sm transition-all duration-200 border border-white/10"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex h-[calc(100vh-73px)] relative">
        {/* Left Panel - Chat Section */}
        <div className="flex-1 flex flex-col" style={{ width: `calc(100% - ${rightPanelWidth}px)` }}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatMessage message={{ ...message, content: getMessageContent(message.content) }} />

                  {/* Render sources if present */}
                  {message.sources && message.sources.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-3"
                    >
                      <SourceCitations sources={message.sources} />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center space-x-3 px-4 py-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-white/50 text-sm">{isAnalyzing ? 'Performing comprehensive analysis...' : 'Analyzing...'}</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            <ChatInputEnhanced
              onSendMessage={handleSendMessage}
              onSatelliteAnalysis={handleSatelliteAnalysis}
              isLoading={isLoading || isAnalyzing}
              placeholder={hasLocationData
                ? `Ask about ${locationData.city}'s climate data...`
                : "Ask me about climate trends, weather patterns, or environmental data..."
              }
            />
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-white/10 hover:bg-emerald-500/50 cursor-col-resize transition-colors relative group"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-emerald-500/20" />
        </div>

        {/* Right Panel - Metrics & Charts */}
        <div className="bg-black/40 overflow-y-auto" style={{ width: `${rightPanelWidth}px`, minWidth: '300px', maxWidth: '800px' }}>
          {hasLocationData || (satelliteImages && satelliteImages.length > 0) ? (
            <div className="p-6 space-y-6">
              {/* Location Card - Only show if has location data */}
              {hasLocationData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-2xl border border-white/10 p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{locationData.city}</h3>
                      <p className="text-sm text-white/50">{locationData.country}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Latitude</p>
                      <p className="text-white font-mono">{locationData.lat?.toFixed(4)}°</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Longitude</p>
                      <p className="text-white font-mono">{locationData.lng?.toFixed(4)}°</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Current Reading Card - Only show if has location data */}
              {hasLocationData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`bg-white/5 rounded-2xl border ${(getDataType(locationData.pollutant) === 'air_quality' && aqiCategory) ? aqiCategory.borderColor : 'border-white/10'} p-5`}
                >
                  <h4 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                    Current {getPollutantLabel(locationData.pollutant)}
                  </h4>
                  <div className="flex items-end gap-3">
                    <span className={`text-5xl font-bold ${(getDataType(locationData.pollutant) === 'air_quality' && aqiCategory) ? aqiCategory.color : 'text-white'}`}>
                      {locationData.value?.toFixed(getDataType(locationData.pollutant) === 'forest' ? 2 : 1)}
                    </span>
                    <span className="text-white/50 mb-2">{getUnit(locationData.pollutant)}</span>
                  </div>
                  {getDataType(locationData.pollutant) === 'air_quality' && aqiCategory && (
                    <div className={`mt-3 inline-block px-3 py-1 rounded-full text-sm font-medium ${aqiCategory.bg} ${aqiCategory.color}`}>
                      {aqiCategory.label}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Historical Data Chart - Only show if has location data */}
              {hasLocationData && historicalData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white/5 rounded-2xl border border-white/10 p-5"
                >
                  <h4 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">
                    7-Day History
                  </h4>
                  <div className="h-48">
                    <Line data={historicalData} options={chartOptions} />
                  </div>
                </motion.div>
              )}

              {/* Analysis Status */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-400 font-medium">Analyzing...</p>
                      <p className="text-xs text-white/50">Gathering environmental insights</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Satellite Analysis Results - REMOVED, now in chat */}

              {/* Satellite Visualization Images - Individual images stacked */}
              {satelliteImages && satelliteImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Change Detection Visualizations ({satelliteImages.length})
                  </h4>
                  {satelliteImages.map((imageUrl, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 rounded-2xl border border-white/10 p-5"
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Satellite Analysis ${index + 1}`} 
                        className="w-full rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle"%3EVisualization Loading...%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* AI Analysis Section - Charts and Metrics Only */}
              {analysisData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  {/* Visualization from Gemini */}
                  {analysisData.visualization ? (
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                      <h4 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {analysisData.visualization.title || 'Analysis Charts'}
                      </h4>
                      <VisualizationDisplay data={analysisData.visualization} />

                      {/* Insights */}
                      {analysisData.visualization.insights && analysisData.visualization.insights.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs text-white/40 uppercase tracking-wider">Key Insights</p>
                          {analysisData.visualization.insights.map((insight, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-white/70">
                              <span className="text-emerald-400">•</span>
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Summary Stats */}
                      {analysisData.visualization.summary && Object.keys(analysisData.visualization.summary).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
                          {Object.entries(analysisData.visualization.summary).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <p className="text-xs text-white/40 capitalize">{key}</p>
                              <p className="text-sm font-semibold text-white">{value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-white/40">No charts available</p>
                      <p className="text-xs text-white/30 mt-1">Analysis visualizations will appear here</p>
                    </div>
                  )}

                  {/* Sources Section */}
                  {analysisData.sources && analysisData.sources.length > 0 && (
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                      <h4 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Data Sources
                      </h4>
                      <div className="space-y-2">
                        {analysisData.sources.slice(0, 3).map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 font-medium truncate group-hover:text-emerald-400 transition-colors">
                                  {source.title}
                                </p>
                                {source.type && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                                    {source.type}
                                  </span>
                                )}
                              </div>
                              <svg className="w-4 h-4 text-white/40 group-hover:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Quick Actions - Only show if has location data */}
              {hasLocationData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">Ask More</h4>
                  <button
                    onClick={() => handleSendMessage(`Show me a detailed breakdown of pollution sources in ${locationData.city}`)}
                    disabled={isLoading || isAnalyzing}
                    className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm border border-white/5 hover:border-white/10 disabled:opacity-50"
                  >
                    📊 Pollution source breakdown
                  </button>
                  <button
                    onClick={() => handleSendMessage(`What are the seasonal pollution patterns in ${locationData.city}?`)}
                    disabled={isLoading || isAnalyzing}
                    className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm border border-white/5 hover:border-white/10 disabled:opacity-50"
                  >
                    📅 Seasonal patterns
                  </button>
                  <button
                    onClick={() => handleSendMessage(`What government policies exist to combat air pollution in ${locationData.city}?`)}
                    disabled={isLoading || isAnalyzing}
                    className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm border border-white/5 hover:border-white/10 disabled:opacity-50"
                  >
                    🏛️ Government policies
                  </button>
                  <button
                    onClick={() => handleSendMessage(`Predict future air quality trends for ${locationData.city} over the next 5 years`)}
                    disabled={isLoading || isAnalyzing}
                    className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm border border-white/5 hover:border-white/10 disabled:opacity-50"
                  >
                    🔮 Future predictions
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            /* No Location Data - Show General Info */
            <div className="p-6 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-2xl border border-white/10 p-5 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌍</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Location Selected</h3>
                <p className="text-sm text-white/50">
                  Select a location on the globe to get detailed AI-powered analysis with charts and insights.
                </p>
                <a
                  href="/visualiser"
                  className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-white text-sm font-medium hover:from-emerald-600 hover:to-teal-600 transition-all"
                >
                  Open Visualiser
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">Try Asking</h4>
                <button
                  onClick={() => handleSendMessage("What are the current global air quality trends?")}
                  className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm border border-white/5 hover:border-white/10"
                >
                  📊 Global air quality trends
                </button>
                <button
                  onClick={() => handleSendMessage("Which cities have the worst air pollution and why?")}
                  className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm border border-white/5 hover:border-white/10"
                >
                  🏙️ Cities with worst pollution
                </button>
                <button
                  onClick={() => handleSendMessage("How does climate change affect air quality worldwide?")}
                  className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm border border-white/5 hover:border-white/10"
                >
                  🌡️ Climate change impact
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TerraBotPage