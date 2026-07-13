import { Component, type ErrorInfo, type ReactNode } from 'react'

const RECOVERY_FLAG = 'agentsaas-error-recovery-attempted'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Catches any render-time crash (e.g. from corrupted persisted auth state)
// that would otherwise leave the user staring at a blank white page with no
// way to recover short of manually clearing site data in devtools. The first
// time this fires per session it wipes local storage and reloads once,
// automatically self-healing from stale/malformed data left over from an
// earlier build. If the crash persists after that, it shows a manual reset UI.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RevGenIQ dashboard] render error:', error, info)

    if (!sessionStorage.getItem(RECOVERY_FLAG)) {
      sessionStorage.setItem(RECOVERY_FLAG, '1')
      localStorage.clear()
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24, gap: 12,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: '#64748b', maxWidth: 420 }}>
            The dashboard hit an unexpected error. Resetting your local session should fix it.
          </p>
          <button
            onClick={() => {
              sessionStorage.clear()
              localStorage.clear()
              window.location.href = '/login'
            }}
            style={{
              padding: '8px 16px', borderRadius: 8, background: '#10B981', color: 'white',
              border: 'none', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reset & go to login
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
