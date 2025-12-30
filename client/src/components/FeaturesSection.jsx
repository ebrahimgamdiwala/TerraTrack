const features = [
  {
    title: "Automated Satellite Analysis",
    description: "Continuously gather and process global satellite imagery to monitor environmental changes in real-time."
  },
  {
    title: "AI-Powered Change Detection", 
    description: "Detect deforestation, wildfires, urban sprawl, and surface water changes using advanced computer vision models."
  },
  {
    title: "Interactive Insights & Alerts",
    description: "Visualize transformations on a map-based dashboard and receive customizable alerts for rapid response."
  }
]

export default function FeaturesSection() {
  return (
    <section className="min-h-screen py-16 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          Why Choose TerraTrack?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-md p-8 rounded-xl border border-white/10 
                         hover:bg-white/10 hover:border-white/20 transform hover:-translate-y-2 
                         transition-all duration-300 shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-white/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
