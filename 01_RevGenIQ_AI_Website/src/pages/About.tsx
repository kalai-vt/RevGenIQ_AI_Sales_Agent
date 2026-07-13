import { motion } from 'framer-motion'
import { Target, Rocket, Users, ShieldCheck } from 'lucide-react'
import PageShell from '../components/layout/PageShell'

const values = [
  { icon: Target, title: 'Outcomes over features', body: 'We measure success in conversations answered and leads captured, not in how many settings a dashboard has.' },
  { icon: Rocket, title: 'Ship fast, ship honestly', body: 'We would rather tell you a feature isn’t ready yet than ship something that only looks like it works.' },
  { icon: Users, title: 'Built for every industry', body: 'The same AI engine adapts its role — sales executive, admissions counsellor, receptionist — to fit your business, not the other way around.' },
  { icon: ShieldCheck, title: 'Your data stays yours', body: 'Every tenant’s knowledge base and conversations are isolated. We don’t train shared models on your customers’ data.' },
]

export default function About() {
  return (
    <PageShell
      eyebrow="About Us"
      title="We build AI employees, not chatbots"
      subtitle="RevGenIQ AI exists to give every business — not just enterprises with dedicated dev teams — an AI agent that actually understands what they sell."
    >
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="prose prose-slate max-w-none mb-16">
        <p className="text-slate-600 leading-relaxed text-lg">
          Most chat widgets are generic: they answer from whatever documents you upload, in whatever tone the model
          defaults to, with no real sense of who they represent. We built RevGenIQ AI because we kept seeing the same
          failure mode — a company would rebrand or switch industries, and their AI assistant would keep answering
          like the old business.
        </p>
        <p className="text-slate-600 leading-relaxed text-lg mt-4">
          Our platform resolves a company’s industry and profile into a real persona — a Manufacturing Sales
          Executive, a SaaS Sales Engineer, an Admissions Counsellor, a Hotel Receptionist — and drives the
          conversation, the tone, and the calls-to-action from that persona. It's the same underlying AI engine for
          every customer; what changes is who it becomes for you.
        </p>
      </motion.div>

      <h2 className="text-2xl font-black text-slate-900 mb-6">What we care about</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <v.icon size={18} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{v.body}</p>
          </motion.div>
        ))}
      </div>
    </PageShell>
  )
}
