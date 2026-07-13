/* eslint-disable react-refresh/only-export-components -- route guards are colocated with the router config by design */
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { PENDING_INVITE_KEY } from '@/utils/constants'

// ── Lazy imports ──────────────────────────────────────────────────────────────
import { lazy, Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PageLoader'

const L = (fn: () => Promise<{ default: React.ComponentType }>) =>
  lazy(fn)

// Auth
const LoginPage        = L(() => import('@/pages/auth/LoginPage'))
const SignupPage       = L(() => import('@/pages/auth/SignupPage'))
const ForgotPassword   = L(() => import('@/pages/auth/ForgotPasswordPage'))
const OnboardingPage   = L(() => import('@/pages/onboarding/OnboardingPage'))

// Dashboard
const DashboardPage    = L(() => import('@/pages/dashboard/DashboardPage'))
const KnowledgePage    = L(() => import('@/pages/knowledge/KnowledgePage'))
const ConversationsPage= L(() => import('@/pages/conversations/ConversationsPage'))
const LeadsPage        = L(() => import('@/pages/leads/LeadsPage'))
const AnalyticsPage    = L(() => import('@/pages/analytics/AnalyticsPage'))
const WidgetBuilderPage= L(() => import('@/pages/widget-builder/WidgetBuilderPage'))
const AIConfigPage     = L(() => import('@/pages/ai-config/AIConfigPage'))
const TeamPage         = L(() => import('@/pages/team/TeamPage'))
const AcceptInvitePage = L(() => import('@/pages/team/AcceptInvitePage'))
const SettingsPage     = L(() => import('@/pages/settings/SettingsPage'))
const BillingPage      = L(() => import('@/pages/billing/BillingPage'))
const AdminPage        = L(() => import('@/pages/admin/AdminPage'))

// ── Guards ────────────────────────────────────────────────────────────────────

function RequireAuth() {
  const { user, accessToken, logout } = useAuthStore()
  if (!user || !accessToken) {
    // A user object with no token is stale/inconsistent state — e.g. left
    // over from a build where tokens weren't persisted. Left alone, this
    // makes GuestOnly (which only checks `user`) see a still-logged-in user
    // and bounce straight back here, forever, with no thrown error for an
    // error boundary to catch since React Router's redirect is async. Wiping
    // the stale state here breaks the loop unconditionally, for any cause.
    if (user) logout()
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function RequireWorkspace() {
  const { workspace } = useAuthStore()
  if (!workspace) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

function GuestOnly() {
  const { user } = useAuthStore()
  if (user) {
    // A login/signup that just completed while an invite-accept was pending
    // must land back on /accept-invite, not /dashboard — otherwise this
    // guard's own redirect races the caller's navigate() and wins, since
    // setAuth()'s state update re-renders this still-mounted guard in the
    // same batch as the caller's post-auth navigation.
    const pendingInvite = localStorage.getItem(PENDING_INVITE_KEY)
    if (pendingInvite) return <Navigate to={`/accept-invite?token=${pendingInvite}`} replace />
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

// ── Suspense wrapper ──────────────────────────────────────────────────────────
function Page({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// ── Router ────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Public / guest
  {
    element: <GuestOnly />,
    children: [
      { path: '/login',          element: <Page component={LoginPage} /> },
      { path: '/signup',         element: <Page component={SignupPage} /> },
      { path: '/forgot-password',element: <Page component={ForgotPassword} /> },
    ],
  },

  // Authenticated — no workspace needed
  {
    element: <RequireAuth />,
    children: [
      { path: '/onboarding', element: <Page component={OnboardingPage} /> },
    ],
  },

  // Authenticated + workspace
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireWorkspace />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: '/dashboard',      element: <Page component={DashboardPage} /> },
              { path: '/knowledge',      element: <Page component={KnowledgePage} /> },
              { path: '/conversations',  element: <Page component={ConversationsPage} /> },
              { path: '/leads',          element: <Page component={LeadsPage} /> },
              { path: '/analytics',      element: <Page component={AnalyticsPage} /> },
              { path: '/widget-builder', element: <Page component={WidgetBuilderPage} /> },
              { path: '/ai-config',      element: <Page component={AIConfigPage} /> },
              { path: '/team',           element: <Page component={TeamPage} /> },
              { path: '/settings',       element: <Page component={SettingsPage} /> },
              { path: '/billing',        element: <Page component={BillingPage} /> },
              { path: '/admin',          element: <Page component={AdminPage} /> },
            ],
          },
        ],
      },
    ],
  },

  // Accept-invite: works whether the visitor is logged in, logged out, or
  // logged in as the wrong user — the page itself handles all three states.
  { path: '/accept-invite', element: <Page component={AcceptInvitePage} /> },

  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
