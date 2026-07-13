import { motion } from 'framer-motion'

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
}

// Shared dark intro band used at the top of every non-home page, matching
// the pattern already established by pages/Pricing.tsx — keeps every new
// page visually consistent without re-deriving the same markup each time.
export default function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <div className="bg-[#020617] pt-20 pb-14 text-center px-6">
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="inline-block px-3 py-1 text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4 uppercase tracking-widest"
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h1
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="text-4xl md:text-5xl font-black text-white mb-4"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="text-slate-400 text-lg max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
