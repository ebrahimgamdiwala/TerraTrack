import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ChatInputEnhanced = ({ 
  onSendMessage, 
  onSatelliteAnalysis, 
  isLoading, 
  placeholder = "Type your message or upload satellite images..." 
}) => {
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState('chat') // 'chat' or 'satellite'
  const [beforeImage, setBeforeImage] = useState(null)
  const [afterImage, setAfterImage] = useState(null)
  const [location, setLocation] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (mode === 'chat') {
      if (message.trim() && !isLoading) {
        onSendMessage(message.trim())
        setMessage('')
      }
    } else if (mode === 'satellite') {
      if (beforeImage && afterImage && location.trim() && !isLoading) {
        onSatelliteAnalysis({
          beforeImage,
          afterImage,
          location: location.trim()
        })
        // Reset satellite form
        setBeforeImage(null)
        setAfterImage(null)
        setLocation('')
        setMode('chat')
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'chat') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0]
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      if (type === 'before') {
        setBeforeImage(file)
      } else {
        setAfterImage(file)
      }
    }
  }

  const quickPrompts = [
    "Show me recent climate change trends",
    "Analyze global temperature data",
    "Compare CO2 levels over time"
  ]

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('chat')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'chat'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          💬 Chat Analysis
        </button>
        <button
          onClick={() => setMode('satellite')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'satellite'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          🛰️ Satellite Images
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'chat' ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isLoading && onSendMessage(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-emerald-300 rounded-full border border-white/10 hover:border-emerald-400/40 transition-all duration-200 disabled:opacity-50"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit}>
              <div className="flex items-end space-x-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-3">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={isLoading}
                    rows={1}
                    className="w-full bg-transparent text-white placeholder-white/40 border-none outline-none resize-none text-sm max-h-32"
                    onInput={(e) => {
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="satellite"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location Input */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Dubai, Milano"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Image Uploads */}
              <div className="grid grid-cols-2 gap-4">
                {/* Before Image */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Before Image *
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    {beforeImage ? (
                      <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="mt-2 text-xs text-emerald-300">{beforeImage.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-xs text-white/40">Upload PNG/JPEG</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleImageUpload(e, 'before')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* After Image */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    After Image *
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    {afterImage ? (
                      <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="mt-2 text-xs text-emerald-300">{afterImage.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-xs text-white/40">Upload PNG/JPEG</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleImageUpload(e, 'after')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!beforeImage || !afterImage || !location.trim() || isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  '🚀 Analyze Changes'
                )}
              </motion.button>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  📸 Upload before and after satellite images (PNG/JPEG) to detect environmental changes using AI
                </p>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChatInputEnhanced
