import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import PageHero from './PageHero'

interface PageShellProps {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
}

// Standard shell for every simple content page (Navbar + dark hero band +
// white content area + Footer) — the same structure pages/Pricing.tsx uses.
export default function PageShell({ eyebrow, title, subtitle, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <main className="max-w-5xl mx-auto px-6 py-16">{children}</main>
      <Footer />
    </div>
  )
}
