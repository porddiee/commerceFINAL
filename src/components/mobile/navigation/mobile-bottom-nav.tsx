'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/browse', icon: Search, label: 'Browse' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Me' },
]

/**
 * MobileBottomNav - Bottom navigation bar for mobile layouts
 * Shows 4 tabs: Home, Browse, Messages, Me
 */
export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
