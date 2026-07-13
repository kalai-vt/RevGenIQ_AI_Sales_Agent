import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { User, Building2, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

import { authApi, teamApi, workspaceApi, type WorkspaceDetail } from '@/services/api'
import { useAuthStore } from '@/app/store'
import { getErrorMessage } from '@/utils/getErrorMessage'

const TABS = [
  { value: 'profile', label: 'My Profile', icon: User },
  { value: 'organization', label: 'Organization', icon: Building2 },
] as const

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent disabled:opacity-50 disabled:cursor-not-allowed'

function ProfileTab() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function saveProfile() {
    if (!fullName.trim()) return
    setSavingProfile(true)
    try {
      const { data } = await authApi.updateProfile({ full_name: fullName.trim() })
      if (accessToken && refreshToken) setAuth(data, accessToken, refreshToken)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update profile'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword() {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update password'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {(user.full_name || user.email || 'U').charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{user.full_name || 'Unnamed'}</p>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input type="email" value={user.email} disabled className={inputClass} />
          </Field>
        </div>

        <button
          onClick={saveProfile}
          disabled={savingProfile || !fullName.trim()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Save profile
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
          <KeyRound size={16} /> Change Password
        </div>
        <Field label="Current password">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="New password">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} minLength={8} />
          </Field>
          <Field label="Confirm new password">
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} minLength={8} />
          </Field>
        </div>
        <button
          onClick={savePassword}
          disabled={savingPassword || !currentPassword || newPassword.length < 8}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Update password
        </button>
      </div>
    </div>
  )
}

function OrganizationTab() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<WorkspaceDetail | null>(null)

  const { data: members = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamApi.members().then((r) => r.data),
    staleTime: 30_000,
  })
  const canManage = members.find((m) => m.is_you)?.role === 'owner' || members.find((m) => m.is_you)?.role === 'admin'

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace-settings'],
    queryFn: () => workspaceApi.get().then((r) => r.data),
    staleTime: 30_000,
  })

  const current = form ?? workspace

  if (isLoading || !current) {
    return <div className="h-40 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading…</div>
  }

  function update<K extends keyof WorkspaceDetail>(key: K, value: WorkspaceDetail[K]) {
    setForm({ ...current, [key]: value } as WorkspaceDetail)
  }

  async function save() {
    if (!form) return
    try {
      const { data } = await workspaceApi.update(form)
      queryClient.setQueryData(['workspace-settings'], data)
      setForm(null)
      toast.success('Organization settings saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save organization settings'))
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
      {!canManage && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
          Only workspace owners and admins can edit these settings.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Workspace name">
          <input type="text" value={current.name} disabled={!canManage} onChange={(e) => update('name', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Website">
          <input type="text" value={current.website_url ?? ''} disabled={!canManage} onChange={(e) => update('website_url', e.target.value)} placeholder="https://yourcompany.com" className={inputClass} />
        </Field>
        <Field label="Industry">
          <input type="text" value={current.industry ?? ''} disabled={!canManage} onChange={(e) => update('industry', e.target.value)} placeholder="e.g. SaaS, E-commerce" className={inputClass} />
        </Field>
        <Field label="Country">
          <input type="text" value={current.country ?? ''} disabled={!canManage} onChange={(e) => update('country', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Timezone">
          <input type="text" value={current.timezone} disabled={!canManage} onChange={(e) => update('timezone', e.target.value)} placeholder="e.g. America/New_York" className={inputClass} />
        </Field>
        <Field label="Brand color">
          <div className="flex items-center gap-2">
            <input type="color" value={current.primary_color} disabled={!canManage} onChange={(e) => update('primary_color', e.target.value)} className="w-9 h-9 rounded border border-slate-200 dark:border-slate-700 bg-transparent disabled:opacity-50" />
            <input type="text" value={current.primary_color} disabled={!canManage} onChange={(e) => update('primary_color', e.target.value)} className={inputClass} />
          </div>
        </Field>
        <Field label="Support email">
          <input type="email" value={current.support_email ?? ''} disabled={!canManage} onChange={(e) => update('support_email', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Sales email">
          <input type="email" value={current.sales_email ?? ''} disabled={!canManage} onChange={(e) => update('sales_email', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Phone">
          <input type="text" value={current.phone ?? ''} disabled={!canManage} onChange={(e) => update('phone', e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={current.description ?? ''}
          disabled={!canManage}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
          placeholder="A short description of your company — used as context for the AI agent."
          className={`${inputClass} resize-none`}
        />
      </Field>

      {canManage && (
        <button
          onClick={save}
          disabled={!form}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Save changes
        </button>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const activeTab = params.get('tab') === 'organization' ? 'organization' : 'profile'

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal profile and organization details</p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setParams({ tab: t.value })}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.value
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? <ProfileTab /> : <OrganizationTab />}
    </div>
  )
}
