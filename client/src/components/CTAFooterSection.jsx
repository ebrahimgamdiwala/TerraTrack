import { Link } from 'react-router-dom'

export default function CTAFooterSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-center px-8 relative z-10">
      <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
        Take Action for Planetary Health
      </h2>
      <p className="text-lg md:text-xl mb-8 max-w-2xl text-white/80">
        Join scientists, policymakers, and conservationists in monitoring and protecting the environment with real-time insights.
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
