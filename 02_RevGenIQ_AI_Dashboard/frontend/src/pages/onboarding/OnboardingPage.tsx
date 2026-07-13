import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Building2, Globe, ArrowRight, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '@/app/store'
import { authApi } from '@/services/api'
import { getErrorMessage } from '@/utils/getErrorMessage'
import toast from 'react-hot-toast'

const INDUSTRIES = [
  'E-commerce', 'SaaS / Software', 'Healthcare', 'Finance',
  'Education', 'Real Estate', 'Manufacturing', 'Other',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [companyName, setCompanyName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [loading, setLoading] = useState(false)

  const { setWorkspace } = useAuthStore()
  const navigate = useNavigate()

  const handleCreate = async () => {
    if (!companyName.trim()) return toast.error('Company name is required')
    setLoading(true)
    try {
      const { data } = await authApi.createWorkspace(companyName.trim(), websiteUrl || undefined, industry || undefined)
      setWorkspace(data.workspace, data.access_token)
      navigate('/dashboard')
      toast.success('Workspace created! Welcome aboard.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create workspace'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Set up your workspace</h1>
          <p className="text-slate-400 text-sm">This takes less than a minute</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Tell us about your company</h2>
                  <p className="text-slate-400 text-sm">We'll use this to personalize your AI agent</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    <Building2 size={12} className="inline mr-1.5" />
                    Company name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    <Globe size={12} className="inline mr-1.5" />
                    Website URL <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://acme.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <button
                  onClick={() => companyName.trim() && setStep(2)}
                  disabled={!companyName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Your industry</h2>
                  <p className="text-slate-400 text-sm">Helps us suggest the best AI templates</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                        industry === ind
                          ? 'bg-emerald-600 text-white border border-emerald-500'
                          : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {industry === ind && <Check size={12} className="inline mr-1.5" />}
                      {ind}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-all border border-white/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/40"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>Create workspace <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
