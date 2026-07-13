export const PENDING_INVITE_KEY = 'pending_invite_token'

// ── Session timeout ───────────────────────────────────────────────────────────
// Inactivity is tracked via a shared localStorage timestamp rather than a
// pure in-memory timer, so activity in *any* open tab resets the clock for
// *all* of them — see hooks/useSessionTimeout.ts.
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000  // auto-logout after 30 min idle
export const SESSION_WARNING_MS = 2 * 60 * 1000       // warn 2 min before that
export const ACTIVITY_STORAGE_KEY = 'revgeniq_last_activity'
export const ACTIVITY_WRITE_THROTTLE_MS = 5000        // don't write on every single mousemove
export const SESSION_POLL_INTERVAL_MS = 5000           // how often each tab re-checks the clock
export const TOKEN_REFRESH_LEAD_MS = 90 * 1000         // proactively refresh if access token expires within this window
