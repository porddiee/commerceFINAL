'use client'

import { MobileLayout } from '../navigation/mobile-layout'
import { MobileHeader } from '../navigation/mobile-header'
import { MobileBottomNav } from '../navigation/mobile-bottom-nav'
import { User, Package, ShoppingCart, Star, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/auth'
import { useRouter } from 'next/navigation'

interface MobileProfileProps {
  profile?: any
}

/**
 * MobileProfile - Mobile profile (Me) page component
 * Contains: Profile, My Transactions, Manage Products, Reviews, Cart, Settings, Sign Out
 */
export function MobileProfile({ profile }: MobileProfileProps) {
  const { user, signOut } = useAuthStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const menuItems = [
    { icon: User, label: 'Profile', href: '/user/profile' },
    { icon: Package, label: 'My Transactions', href: '/user/transactions' },
    { icon: ShoppingCart, label: 'Manage Products', href: '/user/products' },
    { icon: Star, label: 'Reviews', href: '/user/reviews' },
    { icon: ShoppingCart, label: 'Cart', href: '/user/saved' },
    { icon: Settings, label: 'Settings', href: '/user/settings' },
  ]

  return (
    <MobileLayout>
      <MobileHeader title="Me" />
      
      <main className="pb-20">
        <div className="p-4">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{profile?.full_name || 'My Profile'}</h2>
                <p className="text-slate-500 text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  <Icon className="h-5 w-5 text-indigo-600" />
                  <span className="flex-1 text-left font-medium text-slate-900">{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Sign Out */}
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full mt-6 text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </main>

      <MobileBottomNav />
    </MobileLayout>
  )
}
