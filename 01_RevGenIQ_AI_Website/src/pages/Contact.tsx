import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, HeadphonesIcon, Send } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import { CONTACT_EMAIL, SALES_EMAIL, SUPPORT_EMAIL } from '../config'

const channels = [
  { icon: MessageSquare, label: 'General', email: CONTACT_EMAIL, body: 'Questions about the platform or partnerships.' },
  { icon: Send, label: 'Sales', email: SALES_EMAIL, body: 'Pricing, demos, and custom plans.' },
  { icon: HeadphonesIcon, label: 'Support', email: SUPPORT_EMAIL, body: 'Already a customer and need help.' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent(`Website inquiry from ${form.name || 'a visitor'}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\n${form.message}`
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <PageShell
      eyebrow="Contact"
      title="Let's talk"
      subtitle="Tell us about your business and we'll point you to the right person."
    >
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {channels.map((c, i) => (
          <motion.a
            key={c.label}
            href={`mailto:${c.email}`}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg transition-all block"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <c.icon size={18} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{c.label}</h3>
            <p className="text-slate-500 text-sm mb-3">{c.body}</p>
            <span className="text-blue-600 text-sm font-semibold flex items-center gap-1"><Mail size={13} /> {c.email}</span>
          </motion.a>
        ))}
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="border-2 border-slate-100 rounded-2xl p-8 max-w-2xl"
      >
        <h3 className="font-black text-xl text-slate-900 mb-1">Send us a message</h3>
        <p className="text-slate-500 text-sm mb-6">This opens your email client with your message pre-filled — nothing is sent from this page directly.</p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        </div>
        <input placeholder="Company (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        <textarea required rows={4} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
        <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200">
          Send message
        </button>
      </motion.form>
    </PageShell>
  )
}
