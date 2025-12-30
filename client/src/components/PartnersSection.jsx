const partners = [
  "Green Energy Co.",
  "EcoTech Solutions", 
  "Sustainable Future",
  "CleanWorld Initiative"
]

export default function PartnersSection() {
  return (
    <section className="py-16 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          Trusted Partners
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-md p-8 rounded-xl border border-white/10 
                         hover:bg-white/10 hover:border-white/20 transform hover:-translate-y-2 
                         transition-all duration-300 shadow-xl text-center"
            >
              <div className="text-lg text-white/90 font-medium">
                {partner}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}