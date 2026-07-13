import axios, { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/app/store'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Single canonical logout path — used by the 401 interceptor below, the
// inactivity-timeout hook, and anywhere else that needs to force a session
// end. Clears the Zustand store (which also clears its own localStorage
// keys), any other session-scoped storage, and redirects with a reason the
// login page reads to show a friendly message instead of a silent bounce.
export function forceLogout(reason: 'expired' | 'timeout' = 'expired') {
  useAuthStore.getState().logout()
  sessionStorage.clear()
  window.location.href = `/login?reason=${reason}`
}

// ── Request interceptor: attach token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// De-dupes concurrent refresh attempts — if five requests 401 at once (e.g.
// a page that fires several queries in parallel right as the access token
// expires), they should all wait on the same refresh call, not each trigger
// their own and race to persist tokens.
let refreshInFlight: Promise<{ access_token: string; refresh_token: string }> | null = null

// Exported so the session-timeout hook can trigger the same de-duped refresh
// for "Stay Logged In" and its proactive near-expiry check.
export async function refreshTokens(): Promise<{ access_token: string; refresh_token: string }> {
  if (!refreshInFlight) {
    const refresh_token = localStorage.getItem('refresh_token')
    if (!refresh_token) throw new Error('No refresh token')
    refreshInFlight = axios
      .post('/api/v1/auth/refresh', { refresh_token })
      .then((res) => res.data)
      .finally(() => { refreshInFlight = null })
  }
  const data = await refreshInFlight
  useAuthStore.getState().refreshTokens(data.access_token, data.refresh_token)
  return data
}

// ── Response interceptor: handle 401 / error toasts ─────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ detail: string; code?: string }>) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail
    // A 401 from the login call itself means "wrong credentials", not "session
    // expired" — it must surface as a toast on the login form, not trigger a
    // redirect/reload that wipes the error before the user can see it.
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')

    if (status === 401 && !isAuthEndpoint) {
      const hasRefresh = !!localStorage.getItem('refresh_token')
      if (hasRefresh && !error.config?.url?.includes('/auth/refresh')) {
        try {
          const data = await refreshTokens()
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${data.access_token}`
            return api(error.config)
          }
        } catch {
          // Refresh token itself is invalid/expired — this is a real session end.
          forceLogout('expired')
        }
      } else {
        forceLogout('expired')
      }
    } else if (status !== 422 && !isAuthEndpoint) {
      // Auth endpoints already show their own error toast at the call site.
      toast.error(detail || 'Something went wrong')
    }

    return Promise.reject(error)
  }
)

// ── Auth helpers ──────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post<{ message: string; user_id: string }>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<{ access_token: string; refresh_token: string; token_type: string }>('/auth/login', { email, password }),

  me: () => api.get<User>('/auth/me'),

  workspaces: () => api.get<Workspace[]>('/auth/workspaces'),

  createWorkspace: (name: string, website_url?: string, industry?: string) =>
    api.post<{ workspace: Workspace; access_token: string }>('/auth/workspace', { name, website_url, industry }),

  switchWorkspace: (tenant_id: string) =>
    api.post<{ access_token: string }>('/auth/switch-workspace', { tenant_id }),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),

  updateProfile: (data: { full_name?: string; avatar_url?: string }) =>
    api.patch<User>('/auth/me', data),

  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
}

// ── Workspace (organization) settings ──────────────────────────────────────────
export const workspaceApi = {
  get: () => api.get<WorkspaceDetail>('/workspace'),
  update: (data: Partial<WorkspaceDetail>) => api.patch<WorkspaceDetail>('/workspace', data),
}

// ── Knowledge Base ────────────────────────────────────────────────────────────
export const knowledgeApi = {
  stats: () => api.get<KnowledgeStats>('/knowledge/stats'),
  list: () => api.get<KnowledgeSource[]>('/knowledge/sources'),
  status: (id: string) => api.get<KnowledgeSource>(`/knowledge/sources/${id}/status`),
  pages: (id: string) => api.get<WebsitePageStatus[]>(`/knowledge/sources/${id}/pages`),
  recrawl: (id: string) => api.post<KnowledgeSource>(`/knowledge/sources/${id}/recrawl`, {}),
  addUrl: (name: string, url: string, max_pages = 30, crawl_frequency = 'never') =>
    api.post<KnowledgeSource>('/knowledge/sources/url', { name, url, max_pages, crawl_frequency }),
  addFaq: (name: string, content: string) =>
    api.post<KnowledgeSource>('/knowledge/sources/faq', { name, content }),
  upload: (file: File, name: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    return api.post<KnowledgeSource>('/knowledge/sources/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (id: string) => api.delete(`/knowledge/sources/${id}`),
  search: (q: string, top_k = 5) => api.get<SearchResult[]>(`/knowledge/search?q=${encodeURIComponent(q)}&top_k=${top_k}`),
}

// ── Widget Settings ───────────────────────────────────────────────────────────
export const widgetSettingsApi = {
  get: () => api.get<WidgetSettings>('/widget-settings'),
  update: (data: Partial<WidgetSettings>) => api.patch<WidgetSettings>('/widget-settings', data),
}

// ── AI Config ─────────────────────────────────────────────────────────────────
export const aiConfigApi = {
  get: () => api.get<AIConfig>('/ai-config'),
  update: (data: Partial<AIConfig>) => api.patch<AIConfig>('/ai-config', data),
}

// ── Conversations ─────────────────────────────────────────────────────────────
export const conversationsApi = {
  list: (params?: { status?: string; skip?: number; limit?: number }) =>
    api.get<ConversationSummary[]>('/conversations', { params }),
  get: (id: string) => api.get<ConversationDetail>(`/conversations/${id}`),
  update: (id: string, data: { status?: string; tags?: string[] }) =>
    api.patch<ConversationSummary>(`/conversations/${id}`, data),
  remove: (id: string) => api.delete(`/conversations/${id}`),
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export const leadsApi = {
  list: (params?: { status?: string; priority?: string; skip?: number; limit?: number }) =>
    api.get<Lead[]>('/leads', { params }),
  stats: () => api.get<LeadStats>('/leads/stats'),
  get: (id: string) => api.get<Lead>(`/leads/${id}`),
  update: (id: string, data: { status?: string; priority?: string }) =>
    api.patch<Lead>(`/leads/${id}`, data),
  remove: (id: string) => api.delete(`/leads/${id}`),
  activities: (id: string) => api.get<LeadActivityItem[]>(`/leads/${id}/activities`),
  addActivity: (id: string, data: { activity_type: string; content?: string }) =>
    api.post<LeadActivityItem>(`/leads/${id}/activities`, data),
}

// ── Team ──────────────────────────────────────────────────────────────────────
export const teamApi = {
  members: () => api.get<TeamMember[]>('/team/members'),
  updateMemberRole: (membershipId: string, role: string) =>
    api.patch<TeamMember>(`/team/members/${membershipId}`, { role }),
  removeMember: (membershipId: string) => api.delete(`/team/members/${membershipId}`),
  invitations: () => api.get<TeamInvitation[]>('/team/invitations'),
  invite: (email: string, role: string) =>
    api.post<TeamInvitation>('/team/invitations', { email, role }),
  revokeInvitation: (id: string) => api.delete(`/team/invitations/${id}`),
  previewInvitation: (token: string) =>
    api.get<InvitationPreview>(`/team/invitations/${token}/preview`),
  acceptInvitation: (token: string) =>
    api.post<{ access_token: string; token_type: string; workspace: Workspace }>(
      `/team/invitations/${token}/accept`,
    ),
}

// ── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  summary: (days = 30) =>
    api.get<AnalyticsSummary>(`/analytics/summary?days=${days}`),
  trends: (days = 30) =>
    api.get<TrendPoint[]>(`/analytics/trends?days=${days}`),
  intents: (days = 30) =>
    api.get<IntentPoint[]>(`/analytics/intents?days=${days}`),
  leadFunnel: (days = 30) =>
    api.get<FunnelPoint[]>(`/analytics/lead-funnel?days=${days}`),
  topPages: (days = 30) =>
    api.get<PagePoint[]>(`/analytics/top-pages?days=${days}`),
  leadsByPriority: (days = 30) =>
    api.get<PriorityPoint[]>(`/analytics/leads-by-priority?days=${days}`),
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean
}

export interface Workspace {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export interface WorkspaceDetail {
  id: string
  name: string
  slug: string
  logo_url: string | null
  website_url: string | null
  industry: string | null
  country: string | null
  timezone: string
  primary_color: string
  description: string | null
  support_email: string | null
  sales_email: string | null
  phone: string | null
  is_verified: boolean
  created_at: string | null
}

export interface KnowledgeStats {
  total_sources: number; total_chunks: number
  ready: number; processing: number; failed: number
}
export interface KnowledgeSource {
  id: string; name: string; source_type: 'website' | 'pdf' | 'docx' | 'txt' | 'faq' | 'manual'
  url?: string; status: 'pending' | 'processing' | 'ready' | 'failed'
  chunk_count: number; file_size?: number; error_message?: string
  crawl_frequency?: 'never' | 'daily' | 'weekly' | 'monthly'
  last_crawled_at?: string; created_at?: string
  crawl_job?: { status: string; pages_crawled: number; pages_total?: number } | null
}
export interface WebsitePageStatus {
  id: string; url: string; title: string | null
  status: 'pending' | 'crawled' | 'unchanged' | 'failed'
  chunk_count: number; error_message: string | null; last_crawled_at: string | null
}
export interface SearchResult { text: string; score: number; source_id: string }

export interface WidgetSettings {
  widget_key: string
  agent_name: string
  welcome_message: string | null
  placeholder_text: string
  primary_color: string
  secondary_color: string
  text_color: string
  position: string
  show_branding: boolean
  suggested_questions: string[]
  allowed_domains: string[]
  is_active: boolean
}

export interface AIConfig {
  llm_model: string
  temperature: number
  max_tokens: number
  system_prompt: string | null
  fallback_message: string | null
  enable_lead_capture: boolean
  lead_capture_after_messages: number
  escalation_enabled: boolean
  escalation_email: string | null
  rag_top_k: number
  enable_memory: boolean
  memory_window: number
  supported_models: string[]
}

export interface ConversationSummary {
  id: string
  visitor_id: string
  status: 'active' | 'closed' | 'archived'
  channel: string
  page_url: string | null
  country: string | null
  city: string | null
  lead_id: string | null
  summary: string | null
  sentiment: string | null
  tags: string[]
  last_message_at: string | null
  created_at: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  intent: string | null
  confidence: number | null
  created_at: string | null
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[]
}

export interface Lead {
  id: string
  conversation_id: string | null
  name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  job_title: string | null
  country: string | null
  city: string | null
  website: string | null
  requirement: string | null
  quantity: string | null
  budget: string | null
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  priority: 'low' | 'medium' | 'high'
  lead_score: number
  assigned_to: string | null
  tags: string[]
  created_at: string | null
  last_contacted_at: string | null
}

export interface LeadStats {
  total: number
  high_priority: number
  avg_score: number
}

export interface LeadActivityItem {
  id: string
  activity_type: string
  content: string | null
  performed_by?: string | null
  created_at: string | null
}

export interface TeamMember {
  membership_id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'owner' | 'admin' | 'sales' | 'support' | 'viewer'
  is_active: boolean
  joined_at: string | null
  is_you: boolean
}

export interface TeamInvitation {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
  is_expired: boolean
}

export interface InvitationPreview {
  email: string
  role: string
  workspace_name: string
  expires_at: string
}

export interface AnalyticsSummary {
  conversations: number
  leads: number
  messages: number
  conversion_rate: number
  avg_response_ms: number
  escalation_rate: number
  avg_confidence: number
  avg_messages_per_conversation: number
  high_priority_lead_rate: number
  changes: { conversations: number | null; leads: number | null; messages: number | null }
  period_days: number
}
export interface TrendPoint { date: string; conversations: number; leads: number; escalations: number }
export interface IntentPoint { name: string; value: number; color: string }
export interface FunnelPoint { status: string; count: number; color: string }
export interface PagePoint { url: string; count: number }
export interface PriorityPoint { priority: string; count: number; color: string }
