'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { User } from '@supabase/supabase-js'

interface ProfileProviderProps {
  user: User | null
  profile: any
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
