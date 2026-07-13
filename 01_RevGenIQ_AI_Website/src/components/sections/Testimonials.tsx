import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const reviews = [
  { name: 'Sarah Chen', role: 'VP Sales, NovaTech', text: 'RevGenIQ AI tripled our qualified leads in 30 days. The Sales Agent handles objections better than some of our reps.', rating: 5, avatar: 'SC', color: 'bg-blue-600' },
  { name: 'Marcus Rivera', role: 'CTO, CloudPeak', text: 'Implementation took 20 minutes. Our support ticket volume dropped 72% in the first week. Incredible ROI.', rating: 5, avatar: 'MR', color: 'bg-red-500' },
  { name: 'Priya Patel', role: 'Head of Marketing, Finleap', text: 'The AI understands our product deeply. Our CSAT score jumped from 3.8 to 4.9 in just two months.', rating: 5, avatar: 'PP', color: 'bg-green-600' },
  { name: 'James Okonkwo', role: 'CEO, RetailFlow', text: 'We replaced three chatbot tools with RevGenIQ AI and cut costs by 60%. The analytics alone are worth the price.', rating: 5, avatar: 'JO', color: 'bg-blue-600' },
  { name: 'Lisa Yamamoto', role: 'Director of CX, HealthFirst', text: 'Our patients get instant answers about appointments and insurance 24/7. Completely transformed our support.', rating: 5, avatar: 'LY', color: 'bg-red-500' },
  { name: 'Tom Bradley', role: 'Founder, EduStack', text: 'The RAG knowledge base is insanely good. Our AI answers complex education policy questions accurately every time.', rating: 5, avatar: 'TB', color: 'bg-green-600' },
]

export default function Testimonials() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Warm testimonial background — trust/people theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50" />
      {/* Large quote mark watermark */}
      <div className="absolute top-8 left-8 text-[20rem] font-black text-amber-100 leading-none select-none pointer-events-none">"</div>
      <div className="absolute bottom-8 right-8 text-[20rem] font-black text-amber-100 leading-none select-none pointer-events-none rotate-180">"</div>
      {/* Soft blobs */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-green-100/40 rounded-full blur-3xl -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-amber-700 bg-amber-100 rounded-full mb-4 uppercase tracking-widest">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Loved by Revenue Teams</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">Join thousands of companies generating more revenue with RevGenIQ AI.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              className="bg-white border-2 border-amber-100 rounded-2xl p-6 hover:shadow-xl hover:border-amber-200 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-amber-50">
                <div className={`w-10 h-10 rounded-full ${r.color} flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md`}>{r.avatar}</div>
                <div>
                  <div className="text-slate-900 text-sm font-black">{r.name}</div>
                  <div className="text-slate-400 text-xs">{r.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

