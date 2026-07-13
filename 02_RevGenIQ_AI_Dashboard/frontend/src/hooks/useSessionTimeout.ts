import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/app/store'
import { forceLogout, refreshTokens } from '@/services/api'
import { getJwtExpiryMs } from '@/utils/jwt'
import {
  ACTIVITY_STORAGE_KEY, ACTIVITY_WRITE_THROTTLE_MS,
  INACTIVITY_TIMEOUT_MS, SESSION_WARNING_MS, SESSION_POLL_INTERVAL_MS,
  TOKEN_REFRESH_LEAD_MS,
} from '@/utils/constants'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'] as const

function getLastActivity(): number {
  const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function markActivity() {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, String(Date.now()))
}

/**
 * Mounted once at the authenticated app's root (AppShell). Tracks user
 * activity via a shared localStorage timestamp — not a purely in-memory
 * timer — so activity in *any* open tab resets the idle clock for *all* of
 * them, and logging out in one tab is picked up by the others (see
 * app/crossTabAuthSync.ts for the complementary "someone logged out
 * elsewhere" listener).
 */
export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const lastWriteRef = useRef(0)
  const loggedOutRef = useRef(false)

  const stayLoggedIn = useCallback(async () => {
    markActivity()
    setShowWarning(false)
    try {
      await refreshTokens()
    } catch {
      // Refresh token is dead too — nothing to extend. The next poll tick
      // (or the axios interceptor, on the next request) will catch this and
      // force a real logout; no need to duplicate that here.
    }
  }, [])

  const logoutNow = useCallback(() => {
    loggedOutRef.current = true
    forceLogout('timeout')
  }, [])

  useEffect(() => {
    // Only meaningful once a session actually exists — this hook is mounted
    // inside AppShell, which RequireAuth already gates, but the poll loop
    // below still bails out defensively if that ever changes.
    if (!localStorage.getItem(ACTIVITY_STORAGE_KEY)) markActivity()

    const onActivity = () => {
      const now = Date.now()
      if (now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return
      lastWriteRef.current = now
      markActivity()
    }
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }))

    const poll = async () => {
      if (loggedOutRef.current) return
      const { accessToken, refreshToken } = useAuthStore.getState()
      if (!accessToken || !refreshToken) return

      const idleMs = Date.now() - getLastActivity()

      if (idleMs >= INACTIVITY_TIMEOUT_MS) {
        loggedOutRef.current = true
        forceLogout('timeout')
        return
      }

      if (idleMs >= INACTIVITY_TIMEOUT_MS - SESSION_WARNING_MS) {
        setShowWarning(true)
        setSecondsRemaining(Math.max(0, Math.round((INACTIVITY_TIMEOUT_MS - idleMs) / 1000)))
        return // don't bother proactively refreshing while we're about to log out anyway
      }

      setShowWarning(false)

      // Proactive refresh: renew the access token shortly before it expires
      // so an active user's next request never has to fail-then-retry.
      const expiryMs = getJwtExpiryMs(accessToken)
      if (expiryMs !== null && expiryMs - Date.now() <= TOKEN_REFRESH_LEAD_MS) {
        try {
          await refreshTokens()
        } catch {
          // Access token about to expire and refresh failed — the refresh
          // token itself is gone. Let the interceptor's own 401 handling (or
          // the next poll tick once idle catches up) deal with it, rather
          // than force a logout purely from a proactive background check.
        }
      }
    }

    const interval = window.setInterval(poll, SESSION_POLL_INTERVAL_MS)
    poll()

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity))
      window.clearInterval(interval)
    }
  }, [])

  return { showWarning, secondsRemaining, stayLoggedIn, logoutNow }
}
