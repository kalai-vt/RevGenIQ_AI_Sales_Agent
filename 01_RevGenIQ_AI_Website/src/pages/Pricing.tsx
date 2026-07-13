import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Pricing from '../components/sections/Pricing'
import FAQ from '../components/sections/FAQ'
import CTA from '../components/sections/CTA'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white pt-20">
      <Navbar />
      <div className="py-12 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Simple Pricing</h1>
        <p className="text-slate-400 text-lg">Start free. Scale as you grow.</p>
      </div>
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  )
}
