import { MessageCircle, Mail } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import { CONTACT_EMAIL } from '../config'

export default function Community() {
  return (
    <PageShell eyebrow="Community" title="Community" subtitle="A dedicated forum is on our roadmap — here's how to connect in the meantime.">
      <div className="max-w-xl mx-auto text-center border-2 border-slate-100 rounded-2xl p-10">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-5">
          <MessageCircle size={26} />
        </div>
        <h2 className="font-bold text-slate-900 text-lg mb-2">We're building this in the open</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          We haven't launched a public forum or Discord yet — check the <a href="/roadmap" className="text-blue-600 hover:underline">Roadmap</a> for
          where that stands. Until then, the fastest way to share feedback, ask questions, or swap tips with our
          team directly is email.
        </p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200">
          <Mail size={16} /> {CONTACT_EMAIL}
        </a>
      </div>
    </PageShell>
  )
}
