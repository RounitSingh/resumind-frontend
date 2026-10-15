import { create } from "zustand"

import { ApiError, authApi, type AuthResponse, type AuthUser } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import { useWorkspaceStore } from "@/store/workspace-store"

type Status = "loading" | "authenticated" | "unauthenticated"

type AuthState = {
  user: AuthUser | null
  // Lives in memory only. The refresh token is an httpOnly cookie.
  accessToken: string | null
  status: Status
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  // Restores the session from the refresh cookie on first load.
  restore: () => Promise<void>
  // New access token, or null when the session is over. Called by the axios interceptor.
  refresh: () => Promise<string | null>
  // The session ended server-side (refresh failed).
  expire: () => void
}

// Other users' data must never leak into the next session.
const clearUserData = () => {
  void queryClient.cancelQueries()
  queryClient.clear()
  useWorkspaceStore.getState().reset()
}

export const useAuthStore = create<AuthState>((set, get) => {
  const signIn = ({ user, accessToken }: AuthResponse) =>
    set({ user, accessToken, status: "authenticated" })
  const signOut = () => set({ user: null, accessToken: null, status: "unauthenticated" })

  // Refresh tokens rotate, so parallel refreshes would invalidate each other: share one.
  let inflight: Promise<string | null> | null = null

  return {
    user: null,
    accessToken: null,
    status: "loading",

    login: async (email, password) => signIn(await authApi.login(email, password)),
    register: async (email, password) => signIn(await authApi.register(email, password)),

    logout: async () => {
      signOut()
      clearUserData()
      await authApi.logout().catch(() => {})
    },

    refresh: () => {
      inflight ??= authApi.refresh()
        .then((r) => {
          signIn(r)
          return r.accessToken
        })
        .catch((e) => {
          if (e instanceof ApiError && e.status === 0) throw e // offline: don't sign out
          set({ accessToken: null })
          return null
        })
        .finally(() => {
          inflight = null
        })
      return inflight
    },

    restore: async () => {
      try {
        if (!(await get().refresh())) signOut()
      } catch {
        signOut()
      }
    },

    expire: () => {
      signOut()
      clearUserData()
    },
  }
})
