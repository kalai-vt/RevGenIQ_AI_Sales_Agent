import { useAuthStore } from './store'

/**
 * The `storage` event fires in every *other* tab (never the one that made
 * the change) whenever localStorage changes — so when one tab logs out
 * (inactivity, manual, or an expired refresh token), every other open
 * dashboard tab picks it up here and logs itself out too, instead of
 * silently continuing to look "logged in" until its next API call fails.
 */
export function initCrossTabAuthSync() {
  window.addEventListener('storage', (e) => {
    if (e.key !== 'agentsaas-auth') return

    if (!e.newValue) {
      useAuthStore.getState().logout()
      return
    }

    try {
      const parsed = JSON.parse(e.newValue) as { state?: { accessToken?: string | null } }
      if (!parsed.state?.accessToken) {
        useAuthStore.getState().logout()
      }
    } catch {
      // Malformed value — treat conservatively as logged out rather than risk
      // a tab silently trusting stale credentials.
      useAuthStore.getState().logout()
    }
  })
}
