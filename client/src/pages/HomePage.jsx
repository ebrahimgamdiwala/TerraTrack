import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import TestimonialsSection from '../components/TestimonialsSection'
import HowItWorksSection from '../components/HowItWorksSection'
import StatsSection from '../components/StatsSection'
import PartnersSection from '../components/PartnersSection'
import CTAFooterSection from '../components/CTAFooterSection'

export default function HomePage() {
  return (
    <div className="text-white relative">
      {/* Content Section with smooth transitions */}
      <div className="transition-all duration-500 ease-in-out">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTAFooterSection />
      </div>
    </div>
  )
}