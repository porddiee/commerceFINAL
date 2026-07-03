'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface ProfileProviderProps {
  user: User | null
  profile: Profile | null
  children: React.ReactNode
}

export default function ProfileProvider({ user, profile, children }: ProfileProviderProps) {
  const { setUser, setProfile } = useAuthStore()

  useEffect(() => {
    setUser(user)
    setProfile(profile)
  }, [user, profile, setUser, setProfile])

  return <>{children}</>
}
