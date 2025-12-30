const stats = [
  {
    number: "50K+",
    label: "Active Users"
  },
  {
    number: "100K",
    label: "Tons of CO₂ Reduced"
  },
  {
    number: "85%", 
    label: "Users Reduced Footprint"
  }
]

export default function StatsSection() {
  return (
    <section className="py-16 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          Our Impact
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-8 hover:transform hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">
                {stat.number}
              </div>
              <div className="text-lg text-white/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}