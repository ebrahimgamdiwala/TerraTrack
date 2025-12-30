import { motion } from 'framer-motion'

const SatelliteResults = ({ results }) => {
  if (!results) return null

  const { data, location, processing_time, mode } = results
  const { 
    metadata, 
    vegetation_analysis, 
    urban_analysis, 
    water_analysis, 
    summary, 
    llm_explanations 
  } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-2xl border border-white/10 p-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
            <span className="text-lg">🛰️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{location}</h3>
            <p className="text-xs text-white/50">
              {metadata.date_before} → {metadata.date_after} | {processing_time.toFixed(1)}s
            </p>
          </div>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Vegetation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌳</span>
            <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">
              Vegetation Changes
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Increase</span>
              <span className="text-sm font-semibold text-emerald-400">
                +{vegetation_analysis.vegetation_increase_percent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Decrease</span>
              <span className="text-sm font-semibold text-red-400">
                -{vegetation_analysis.vegetation_decrease_percent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">NDVI Change</span>
              <span className="text-sm font-semibold text-white">
                {vegetation_analysis.mean_ndvi_change.toFixed(4)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Urban */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🏗️</span>
            <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">
              Urban Development
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Urbanization</span>
              <span className="text-sm font-semibold text-white">
                {urban_analysis.urbanization_percent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Construction</span>
              <span className="text-sm font-semibold text-white">
                {urban_analysis.construction_area_km2.toFixed(2)} km²
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">NDBI Change</span>
              <span className="text-sm font-semibold text-white">
                {urban_analysis.mean_ndbi_change.toFixed(4)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Water */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💧</span>
            <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">
              Water Bodies
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Increase</span>
              <span className="text-sm font-semibold text-emerald-400">
                +{water_analysis.water_increase_percent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Decrease</span>
              <span className="text-sm font-semibold text-red-400">
                -{water_analysis.water_decrease_percent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Net Change</span>
              <span className="text-sm font-semibold text-white">
                {(water_analysis.water_gain_area_km2 - water_analysis.water_loss_area_km2).toFixed(2)} km²
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Summary */}
      {summary && summary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 rounded-2xl border border-white/10 p-5"
        >
          <h4 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
            Key Findings
          </h4>
          <ul className="space-y-2">
            {summary.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-white/70">
                <span className="text-emerald-400 mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}

export default SatelliteResults
