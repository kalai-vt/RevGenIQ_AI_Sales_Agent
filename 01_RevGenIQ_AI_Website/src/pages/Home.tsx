import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import TrustedBy from '../components/sections/TrustedBy'
import ProductOverview from '../components/sections/ProductOverview'
import HowItWorks from '../components/sections/HowItWorks'
import Features from '../components/sections/Features'
import Industries from '../components/sections/Industries'
import Pricing from '../components/sections/Pricing'
import Integrations from '../components/sections/Integrations'
import Testimonials from '../components/sections/Testimonials'
import FAQ from '../components/sections/FAQ'
import CTA from '../components/sections/CTA'

export default function Home() {
  const location = useLocation()

  // Supports links like "/#platform" from other pages/the navbar — scroll to
  // the section once this page (and its sections' DOM ids) has mounted.
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(timer)
  }, [location.hash])

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <ProductOverview />
        <HowItWorks />
        <Features />
        <Industries />
        <Testimonials />
        <Integrations />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
