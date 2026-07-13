/** Decodes a JWT's payload client-side — no verification, just reading the
 * `exp` claim so we know when to proactively refresh. The server is the only
 * party that ever trusts this token; this is purely a UX optimization to
 * refresh before a request fails, not a security check. */
export function getJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const decoded = JSON.parse(json) as { exp?: number }
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}
