'use client'

import { useAuthStore } from '@/lib/store/auth'
import { AdminSidebar } from '@/components/admin-sidebar'
import { UserSidebar } from '@/components/user-sidebar'

export function DynamicSidebar() {
  const { user, profile } = useAuthStore()
  
  const isAdmin = profile?.role === 'admin'
  
  if (isAdmin) {
    return <AdminSidebar />
  }
  
  return <UserSidebar isAuthenticated={!!user} />
}
