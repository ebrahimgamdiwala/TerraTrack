import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-center px-8 relative z-10">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
        TerraTrack: Monitor Planetary Health
      </h1>
      <p className="text-lg md:text-xl mb-8 max-w-3xl text-white/80 leading-relaxed">
        Track environmental changes across the globe with AI-powered satellite imagery analysis. 
        Detect deforestation, wildfires, urban sprawl, and more—transforming raw data into actionable insights for policymakers, scientists, and conservationists.
      </p>
      <Link
        to="/signup"
        className="px-8 py-4 text-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold 
                   rounded-full hover:from-green-600 hover:to-green-700 transform hover:scale-105 hover:-translate-y-1 
                   transition-all duration-300 shadow-xl hover:shadow-green-500/30"
      >
        Get Started with TerraTrack
      </Link>
    </section>
  )
}
