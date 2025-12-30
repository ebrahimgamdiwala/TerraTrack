const testimonials = [
  {
    quote: "This app helped me reduce my carbon footprint by 30% in just 3 months!",
    author: "Sarah Johnson"
  },
  {
    quote: "The insights and recommendations are practical and easy to implement.",
    author: "Michael Chen"
  },
  {
    quote: "I love seeing my progress and impact visualized over time.",
    author: "Emma Rodriguez"
  }
]

export default function TestimonialsSection() {
  return (
    <section className="min-h-screen py-16 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          What Our Users Say
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/8 backdrop-blur-lg p-10 rounded-2xl border border-white/15 
                         hover:bg-white/12 hover:border-white/25 transform hover:-translate-y-2 
                         transition-all duration-300 shadow-xl"
            >
              <blockquote className="text-lg font-medium text-white/90 mb-6 italic leading-relaxed">
                "{testimonial.quote}"
              </blockquote>
              <cite className="text-green-400 font-semibold">
                {testimonial.author}
              </cite>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}