import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      fullName : null,
      isAuthenticated: false,

      login: ({ token, email,fullName, userId }) =>
        set({
          token,
          email,
          userId,
          fullName,
          isAuthenticated: true
        }),

      logout: () =>
        set({
          token: null,
          userId: null,
          email: null,
          fullName : null,
          isAuthenticated: false
        }),
    }),
    {
      name: 'finsight-auth',

      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true;
        }
      }
    }
  )
)