import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import PageShell from '../components/layout/PageShell'

const posts = [
  {
    slug: 'why-generic-chatbots-fail',
    date: 'June 2026',
    title: 'Why generic chatbots fail — and what "AI persona" actually means',
    excerpt:
      'A chatbot that answers every business the same way isn\'t really representing your business. Here\'s how ' +
      'we resolve a company\'s industry and profile into a real role — sales executive, admissions counsellor, ' +
      'receptionist — before it ever answers a question.',
    body:
      'Most AI widgets are built the same way: take whatever the customer uploads, stuff it into a prompt, and let ' +
      'the model answer. The problem is that the model has no idea *who* it is supposed to be. Ask it a pricing ' +
      'question and it falls back on generic SaaS-speak, even if you run a hotel. Ask it about MOQ and it has no ' +
      'idea what that means for a healthcare clinic.\n\n' +
      'RevGenIQ AI resolves your industry into a persona before the AI ever answers: a role, a tone, and a set of ' +
      'focus areas that get baked into every response. A manufacturer\'s AI talks about MOQ, packaging, and export ' +
      'capability. A SaaS company\'s AI talks about demos, pricing tiers, and integrations. Same underlying engine, ' +
      'completely different employee.',
  },
  {
    slug: 'ai-agents-and-conversion',
    date: 'May 2026',
    title: 'How AI agents turn website visitors into leads',
    excerpt:
      'Most visitors leave your site without ever telling you who they are. A well-placed AI agent changes the ' +
      'math — not by nagging for an email address, but by answering the question that made them visit in the ' +
      'first place.',
    body:
      'The core insight behind lead capture that actually works is sequencing: answer first, ask second. Our lead ' +
      'capture only activates after a visitor has had a real answer to their question — never as a gate blocking ' +
      'the conversation. Once genuine interest is detected (an intent classifier scores buying signals in real ' +
      'time), the agent offers a quote, demo, or contact form as a natural next step, not an interruption.',
  },
  {
    slug: 'industries-using-ai-agents',
    date: 'April 2026',
    title: '8 industries already running AI sales agents',
    excerpt:
      'SaaS companies book demos with it. Manufacturers quote exports with it. Hospitals book appointments with ' +
      'it. Here\'s a quick tour of how the same platform adapts to eight very different businesses.',
    body:
      'SaaS: books demos and explains pricing tiers. Manufacturing: quotes MOQ, packaging, and export terms. ' +
      'Healthcare: books appointments and explains departments (never diagnoses). Education: walks through ' +
      'courses, admissions, and fees. Real Estate: schedules viewings and discusses financing. Hotels: checks ' +
      'room availability and amenities. E-commerce: tracks orders and explains returns. Finance: books advisory ' +
      'consultations and explains products — all from the same platform, each acting like a completely different ' +
      'employee.',
  },
]

export default function Blog() {
  return (
    <PageShell eyebrow="Blog" title="Notes on AI, sales, and support" subtitle="What we're building and why.">
      <div className="space-y-12 max-w-3xl mx-auto">
        {posts.map((p, i) => (
          <motion.article
            key={p.slug}
            id={p.slug}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="border-b border-slate-100 pb-12 last:border-none"
          >
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-3">
              <Calendar size={13} /> {p.date}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">{p.title}</h2>
            <p className="text-slate-500 leading-relaxed mb-4">{p.excerpt}</p>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{p.body}</p>
          </motion.article>
        ))}
      </div>
    </PageShell>
  )
}
