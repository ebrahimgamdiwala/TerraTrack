import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

const ChatMessage = ({ message }) => {
  const isBot = message.type === 'bot'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isBot ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`flex items-start space-x-3 max-w-3xl ${!isBot ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isBot 
            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
            : 'bg-gradient-to-r from-blue-400 to-blue-500'
        }`}>
          {isBot ? (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className={`px-4 py-3 rounded-2xl ${
          isBot
            ? 'bg-slate-800/70 border border-green-500/20 text-white'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
        } backdrop-blur-sm shadow-lg`}>
          <div className="prose prose-invert max-w-none">
            {isBot ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="text-green-300">{children}</strong>,
                  em: ({ children }) => <em className="text-green-200">{children}</em>,
                  code: ({ children }) => <code className="bg-slate-700 px-1 py-0.5 rounded text-green-300 text-sm">{children}</code>,
                  pre: ({ children }) => <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-sm border border-slate-600">{children}</pre>,
                  h1: ({ children }) => <h1 className="text-xl font-bold text-green-300 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-green-300 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-md font-medium text-green-300 mb-1">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs mt-2 ${isBot ? 'text-green-400' : 'text-green-100'} opacity-70`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ChatMessage