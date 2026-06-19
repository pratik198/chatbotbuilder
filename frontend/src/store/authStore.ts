import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: { id: string; email: string; name: string } | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, workspaceName: string) => Promise<void>
  refresh: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      login: async (email, password) => {
        const res = await axios.post('/api/v1/auth/login', { email, password })
        const { accessToken, refreshToken, user } = res.data.data
        set({ accessToken, refreshToken, user })
      },

      register: async (email, password, name, workspaceName) => {
        const res = await axios.post('/api/v1/auth/register', {
          email,
          password,
          fullName: name,
          workspaceName,
        })
        const { accessToken, refreshToken, user } = res.data.data
        set({ accessToken, refreshToken, user })
      },

      refresh: async () => {
        const { refreshToken } = get()
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post('/api/v1/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        set({ accessToken, refreshToken: newRefresh })
      },

      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'chatplatform-auth',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
    }
  )
)
