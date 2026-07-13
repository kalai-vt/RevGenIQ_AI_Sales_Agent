import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { teamApi, type InvitationPreview } from '@/services/api'
import { useAuthStore } from '@/app/store'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { PENDING_INVITE_KEY } from '@/utils/constants'

export default function AcceptInvitePage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const { user, setWorkspace } = useAuthStore()

  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('This invitation link is missing its token.')
      setLoading(false)
      return
    }
    teamApi.previewInvitation(token)
      .then((r) => setPreview(r.data))
      .catch((err) => setError(getErrorMessage(err, 'This invitation is invalid or has expired.')))
      .finally(() => setLoading(false))
  }, [token])

  function goAuth(path: '/login' | '/signup') {
    localStorage.setItem(PENDING_INVITE_KEY, token)
    navigate(path)
  }

  async function accept() {
    setAccepting(true)
    try {
      const { data } = await teamApi.acceptInvitation(token)
      setWorkspace(data.workspace, data.access_token)
      localStorage.removeItem(PENDING_INVITE_KEY)
      toast.success(`Welcome to ${data.workspace.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to accept invitation'))
      setAccepting(false)
    }
  }

  const emailMismatch = !!(user && preview && user.email.toLowerCase() !== preview.email.toLowerCase())

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mx-auto mb-6">
            <Zap size={20} className="text-white" />
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
              <p className="text-slate-400 text-sm">Checking your invitation…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <XCircle size={32} className="text-red-400" />
              <p className="text-white font-semibold">Invitation not available</p>
              <p className="text-slate-400 text-sm">{error}</p>
              <Link to="/login" className="text-emerald-400 text-sm hover:text-emerald-300 mt-2">Go to login</Link>
            </div>
          ) : preview ? (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Join {preview.workspace_name}</h1>
              <p className="text-slate-400 text-sm mb-6">
                You've been invited as <span className="text-emerald-400 font-semibold">{preview.role}</span> — invitation sent to {preview.email}
              </p>

              {emailMismatch ? (
                <div className="space-y-3">
                  <p className="text-amber-400 text-xs bg-amber-500/10 rounded-lg p-3">
                    You're logged in as {user!.email}, but this invitation was sent to {preview.email}.
                    Log out and sign in with that email to accept it.
                  </p>
                </div>
              ) : user ? (
                <button
                  onClick={accept}
                  disabled={accepting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all"
                >
                  {accepting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {accepting ? 'Joining…' : `Accept & join ${preview.workspace_name}`}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => goAuth('/login')}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all"
                  >
                    Log in to accept
                  </button>
                  <button
                    onClick={() => goAuth('/signup')}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all"
                  >
                    Create an account
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
