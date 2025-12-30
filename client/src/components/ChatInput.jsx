import { useState } from 'react'
import { motion } from 'framer-motion'

const ChatInput = ({ onSendMessage, isLoading, placeholder = "Type your message..." }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const quickPrompts = [
    "Show me recent climate change trends",
    "Analyze global temperature data",
    "Compare CO2 levels over time",
    "What are the latest environmental news?",
    "Explain carbon footprint reduction strategies"
  ]

  const handleQuickPrompt = (prompt) => {
    if (!isLoading) {
      onSendMessage(prompt)
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleQuickPrompt(prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/70 text-green-300 rounded-full border border-green-500/20 hover:border-green-400/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prompt}
          </motion.button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end space-x-3 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-green-500/20 p-3">
          {/* Text Input */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className="w-full bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-sm max-h-32 scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-transparent"
              style={{
                minHeight: '20px',
                height: 'auto',
                lineHeight: '1.5'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
          </div>

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!message.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Character Count */}
        {message.length > 0 && (
          <div className="absolute -bottom-6 right-2 text-xs text-gray-400">
            {message.length}/2000
          </div>
        )}
      </form>

      {/* Input Hints */}
      <div className="text-xs text-gray-400 text-center">
        Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-green-300">Enter</kbd> to send, 
        <kbd className="px-1 py-0.5 bg-slate-700 rounded text-green-300 ml-1">Shift + Enter</kbd> for new line
      </div>
    </div>
  )
}

export default ChatInput