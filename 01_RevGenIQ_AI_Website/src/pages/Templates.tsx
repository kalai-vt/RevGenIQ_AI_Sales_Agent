import { motion } from 'framer-motion'
import { Laptop, Factory, HeartPulse, GraduationCap, Building2, Hotel, ShoppingCart, Landmark } from 'lucide-react'
import PageShell from '../components/layout/PageShell'

// Mirrors the real persona profiles in revgeniq_agent/persona.py — these
// aren't mockups, they're what your AI agent actually becomes once you pick
// an industry during onboarding.
const templates = [
  { icon: Laptop, name: 'SaaS / Software', role: 'AI Sales Engineer', focus: 'Features, live demos, pricing tiers, free trials, integrations' },
  { icon: Factory, name: 'Manufacturing', role: 'Manufacturing Sales Executive', focus: 'Specifications, MOQ, packaging, export capability, certifications' },
  { icon: HeartPulse, name: 'Healthcare', role: 'Healthcare Patient Assistant', focus: 'Departments, doctors, appointment booking, insurance — never diagnoses' },
  { icon: GraduationCap, name: 'Education', role: 'Admissions Counsellor', focus: 'Courses, admissions process, fees, placements' },
  { icon: Building2, name: 'Real Estate', role: 'Property Consultant', focus: 'Listings, pricing, financing, scheduling viewings' },
  { icon: Hotel, name: 'Hotel / Hospitality', role: 'Hotel Receptionist', focus: 'Room types, amenities, availability, booking' },
  { icon: ShoppingCart, name: 'E-commerce / Retail', role: 'Retail Sales Assistant', focus: 'Product catalog, order status, shipping & returns' },
  { icon: Landmark, name: 'Finance', role: 'Financial Services Advisor', focus: 'Products, eligibility, rates, booking consultations' },
]

export default function Templates() {
  return (
    <PageShell
      eyebrow="Templates"
      title="Industry templates"
      subtitle="Pick your industry at signup and your AI agent adopts the matching role automatically — no prompt engineering required."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {templates.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="border-2 border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <t.icon size={18} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">{t.name}</h3>
            <p className="text-blue-600 text-xs font-semibold mb-2">{t.role}</p>
            <p className="text-slate-500 text-xs leading-relaxed">{t.focus}</p>
          </motion.div>
        ))}
      </div>
      <p className="text-center text-slate-500 text-sm mt-10">
        Don't see your industry? Choose "Other" at signup for a general-purpose assistant, or{' '}
        <a href="/contact" className="text-blue-600 font-semibold hover:underline">tell us what you need</a>.
      </p>
    </PageShell>
  )
}
