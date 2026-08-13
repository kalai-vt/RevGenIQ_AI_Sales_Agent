import { Download, Mail } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import { SUPPORT_EMAIL } from '../config'

export default function Press() {
  return (
    <PageShell eyebrow="Press" title="Press Kit" subtitle="Boilerplate, brand assets, and media contact.">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="border-2 border-slate-100 rounded-2xl p-8">
          <h2 className="font-bold text-slate-900 mb-3">Company boilerplate</h2>
          <p className="text-slate-600 leading-relaxed">
            RevGenAI builds industry-aware AI sales and support agents. Instead of one generic chatbot persona,
            the platform resolves each customer's industry into a specific role — sales executive, admissions
            counsellor, hotel receptionist, and more — so the AI agent represents the business it's deployed on,
            not a one-size-fits-all assistant.
          </p>
        </div>

        <div className="border-2 border-slate-100 rounded-2xl p-8">
          <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Download size={18} className="text-blue-600" /> Brand assets</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Logo files and brand guidelines are available on request while our asset kit is being finalized —
            email us and we'll send them directly.
          </p>
        </div>

        <div className="border-2 border-slate-100 rounded-2xl p-8">
          <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Mail size={18} className="text-blue-600" /> Media contact</h2>
          <p className="text-slate-500 text-sm mb-2">For interviews, quotes, or media inquiries:</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 font-semibold hover:underline">{SUPPORT_EMAIL}</a>
        </div>
      </div>
    </PageShell>
  )
}
