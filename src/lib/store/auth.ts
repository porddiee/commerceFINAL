import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  is_verified_seller: boolean
  verification_status: 'none' | 'pending' | 'approved' | 'rejected'
  verification_rejection_reason: string | null
  verification_document: string | null
  phone: string | null
  location: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      signOut: () => set({ user: null, profile: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
