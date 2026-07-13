import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { UserPlus, Trash2, Mail, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { teamApi, type TeamMember } from '@/services/api'
import { getErrorMessage } from '@/utils/getErrorMessage'

const ROLE_STYLE: Record<string, string> = {
  owner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  support: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  viewer: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const INVITABLE_ROLES = ['admin', 'sales', 'support', 'viewer']

function timeAgo(iso: string | null) {
  if (!iso) return '—'
  try { return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true }) } catch { return '—' }
}

function initials(name: string | null, email: string) {
  const src = name || email
  return src.slice(0, 2).toUpperCase()
}

export default function TeamPage() {
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamApi.members().then((r) => r.data),
    staleTime: 15_000,
  })

  const { data: invitations = [], isLoading: loadingInvites } = useQuery({
    queryKey: ['team-invitations'],
    queryFn: () => teamApi.invitations().then((r) => r.data),
    staleTime: 15_000,
  })

  const myRole = members.find((m) => m.is_you)?.role
  const canManage = myRole === 'owner' || myRole === 'admin'

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['team-members'] })
    queryClient.invalidateQueries({ queryKey: ['team-invitations'] })
  }

  async function changeRole(membershipId: string, role: string) {
    try {
      await teamApi.updateMemberRole(membershipId, role)
      invalidate()
      toast.success('Role updated')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update role'))
    }
  }

  async function removeMember(m: TeamMember) {
    if (!window.confirm(`Remove ${m.full_name || m.email} from this workspace?`)) return
    try {
      await teamApi.removeMember(m.membership_id)
      invalidate()
      toast.success('Member removed')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove member'))
    }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    try {
      await teamApi.invite(inviteEmail.trim(), inviteRole)
      setShowInvite(false)
      setInviteEmail('')
      setInviteRole('viewer')
      invalidate()
      toast.success(`Invitation sent to ${inviteEmail.trim()}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send invitation'))
    }
  }

  async function revokeInvite(id: string) {
    try {
      await teamApi.revokeInvitation(id)
      invalidate()
      toast.success('Invitation revoked')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to revoke invitation'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
          <p className="text-slate-500 text-sm mt-1">Invite teammates and manage roles</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <UserPlus size={16} /> Invite teammate
          </button>
        )}
      </div>

      {/* Members table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loadingMembers ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left font-semibold py-2.5 px-4">Member</th>
                <th className="text-left font-semibold py-2.5 px-4">Role</th>
                <th className="text-left font-semibold py-2.5 px-4">Joined</th>
                {canManage && <th className="text-right font-semibold py-2.5 px-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.membership_id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials(m.full_name, m.email)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {m.full_name || m.email} {m.is_you && <span className="text-xs text-slate-400 font-normal">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    {canManage && !m.is_you && m.role !== 'owner' ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.membership_id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_STYLE[m.role]}`}
                      >
                        {INVITABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLE[m.role]}`}>{m.role}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{timeAgo(m.joined_at)}</td>
                  {canManage && (
                    <td className="py-2.5 px-4 text-right">
                      {!m.is_you && m.role !== 'owner' && (
                        <button
                          onClick={() => removeMember(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending invitations */}
      {canManage && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Pending Invitations</h2>
          <p className="text-xs text-slate-400 mb-4">Invites that haven't been accepted yet</p>
          {loadingInvites ? (
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ) : invitations.length === 0 ? (
            <p className="text-sm text-slate-400">No pending invitations</p>
          ) : (
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{inv.email}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLE[inv.role] ?? ROLE_STYLE.viewer}`}>{inv.role}</span>
                    {inv.is_expired && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">expired</span>
                    )}
                  </div>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    className="text-xs text-slate-400 hover:text-red-600 font-medium"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowInvite(false)}>
          <div className="absolute inset-0 bg-slate-900/40" />
          <div onClick={(e) => e.stopPropagation()} className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Invite teammate</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
              >
                {INVITABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button
              onClick={sendInvite}
              disabled={!inviteEmail.trim()}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Send invitation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
