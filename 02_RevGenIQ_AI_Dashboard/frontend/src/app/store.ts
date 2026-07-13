import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Workspace } from '@/services/api'

interface AuthState {
  user: User | null
  workspace: Workspace | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setWorkspace: (workspace: Workspace, accessToken: string) => void
  refreshTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      workspace: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ user, accessToken, refreshToken })
      },

      setWorkspace: (workspace, accessToken) => {
        localStorage.setItem('access_token', accessToken)
        set({ workspace, accessToken })
      },

      // Used by the session-timeout "Stay Logged In" flow and the axios
      // interceptor's silent refresh — updates tokens only, leaving
      // user/workspace untouched.
      refreshTokens: (accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ accessToken, refreshToken })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, workspace: null, accessToken: null, refreshToken: null })
      },
    }),
    {
      name: 'agentsaas-auth',
      partialize: (state) => ({
        user: state.user,
        workspace: state.workspace,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
