import { Link } from 'react-router-dom'
import { ArrowRight, Receipt } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Pricing from '../components/sections/Pricing'
import FAQ from '../components/sections/FAQ'
import { BILL_IQ_PATH } from '../config'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white pt-20">
      <Navbar />
      <div className="py-12 text-center px-6">
        <h1 className="text-5xl font-bold text-white mb-4">Simple Pricing</h1>
        <p className="text-slate-400 text-lg">Sales IQ pricing below. Bill IQ has its own plans — see link at the bottom.</p>
      </div>
      <Pricing />

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
              <Receipt size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Looking for Bill IQ pricing?</h3>
              <p className="text-slate-400 text-sm">Billing &amp; POS plans start at ₹699/mo.</p>
            </div>
          </div>
          <Link to={`${BILL_IQ_PATH}#pricing`} className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
            View Bill IQ Plans <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <FAQ />
      <Footer />
    </div>
  )
}
