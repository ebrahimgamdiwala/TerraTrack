import { motion } from 'framer-motion'
import { useState } from 'react'

const SourceCitations = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  const displayedSources = isExpanded ? sources : sources.slice(0, 3)

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-green-500/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-green-300 font-medium text-sm flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Sources ({sources.length})
        </h4>
        
        {sources.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            {isExpanded ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayedSources.map((source, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-900/50 rounded-lg border border-slate-600 p-3 hover:border-green-500/30 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Source Title */}
                <h5 className="text-white text-sm font-medium mb-1 truncate group-hover:text-green-300 transition-colors">
                  {source.title || source.url || 'Untitled Source'}
                </h5>
                
                {/* Source URL */}
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline block truncate mb-2"
                  >
                    {source.url}
                  </a>
                )}
                
                {/* Source Description/Snippet */}
                {source.description && (
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {source.description}
                  </p>
                )}
              </div>

              {/* Source Type Badge */}
              <div className="ml-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  source.type === 'article' ? 'bg-blue-500/20 text-blue-300' :
                  source.type === 'research' ? 'bg-purple-500/20 text-purple-300' :
                  source.type === 'news' ? 'bg-red-500/20 text-red-300' :
                  source.type === 'data' ? 'bg-green-500/20 text-green-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {source.type || 'web'}
                </span>
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <div className="flex items-center space-x-3">
                {source.publishedDate && (
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(source.publishedDate).toLocaleDateString()}
                  </span>
                )}
                
                {source.author && (
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {source.author}
                  </span>
                )}
              </div>

              {/* Reliability Score */}
              {source.reliability && (
                <div className="flex items-center">
                  <span className="text-xs mr-1">Reliability:</span>
                  <div className="flex space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < source.reliability ? 'bg-green-400' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {!isExpanded && sources.length > 3 && (
        <div className="text-center mt-3">
          <span className="text-xs text-gray-400">
            and {sources.length - 3} more sources...
          </span>
        </div>
      )}
    </div>
  )
}

export default SourceCitations