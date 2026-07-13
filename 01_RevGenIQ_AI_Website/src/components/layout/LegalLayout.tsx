import type { ReactNode } from 'react'
import PageShell from './PageShell'

interface Section {
  heading: string
  body: ReactNode
}

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  intro?: string
  sections: Section[]
}

export default function LegalLayout({ title, lastUpdated, intro, sections }: LegalLayoutProps) {
  return (
    <PageShell eyebrow="Legal" title={title} subtitle={`Last updated: ${lastUpdated}`}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-10 text-amber-800 text-sm">
          This page is a plain-language template to get you started and does not constitute legal advice — have it
          reviewed by counsel familiar with your jurisdiction before relying on it as a binding policy.
        </div>
        {intro && <p className="text-slate-600 leading-relaxed mb-10">{intro}</p>}
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-black text-slate-900 mb-3">{s.heading}</h2>
              <div className="text-slate-600 leading-relaxed text-sm space-y-2">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
