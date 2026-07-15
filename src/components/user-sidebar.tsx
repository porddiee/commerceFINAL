'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  Home,
  Search,
  MessageSquare,
  ShoppingBag,
  FileText,
  LayoutDashboard,
  Menu,
  X,
  Package,
} from 'lucide-react'
import { useSidebarStore } from '@/lib/store/sidebar'
import { useAuthStore } from '@/lib/store/auth'
import { createClient } from '@/lib/supabase/client'
import { messagesService } from '@/services'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

const publicNavItems: NavItem[] = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Browse Products', href: '/browse', icon: Search },
]

const userNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/user', icon: LayoutDashboard },
  { title: 'Messages', href: '/user/messages', icon: MessageSquare },
  { title: 'My Transactions', href: '/user/transactions', icon: Package },
  { title: 'Manage Products', href: '/user/products', icon: ShoppingBag },
  { title: 'Reviews', href: '/user/reviews', icon: FileText },
]

export function UserSidebar({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const pathname = usePathname()
  const { isOpen, toggle, setOpen } = useSidebarStore()
  const { user } = useAuthStore()
  const [isMobile, setIsMobile] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (user) {
      fetchUnreadMessages()
    }
  }, [user, pathname])

  // Real-time subscription for message updates
  useEffect(() => {
    if (!user) return

    const supabase = createClient()
    const channel = supabase
      .channel(`sidebar-messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadMessages()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchUnreadMessages = async () => {
    if (!user) return
    try {
      const filteredMessages = await messagesService.getUnreadMessagesForUser(user.id)
      setUnreadMessageCount(filteredMessages.length)
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }

  const navItems = isAuthenticated ? [...publicNavItems, ...userNavItems] : publicNavItems
  const shouldExpand = isOpen || isHovered

  return (
    <>
      {/* Mobile menu button - outside sidebar so it's always visible */}
      <div className="lg:hidden fixed top-4 left-4 z-[100]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(!isOpen)}
          className="bg-indigo-600 text-white border-0 shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] rounded-full h-9 w-9"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-35 transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — indigo gradient matching homepage */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-[60] h-screen bg-gradient-to-b from-indigo-900 via-indigo-800 to-blue-900 border-r border-white/10 transition-all duration-300 shadow-2xl shadow-indigo-900/50',
          shouldExpand ? 'w-64' : 'w-16',
          'lg:translate-x-0',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center p-4 border-b border-white/10 h-16">
            <div className="flex items-center gap-2 overflow-hidden">
              {shouldExpand && (
                <span className="font-black text-xl text-white whitespace-nowrap tracking-tight">
                  SGShop
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isMessages = item.href === '/user/messages'
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-white/20 text-white shadow-sm shadow-black/10 backdrop-blur-sm'
                      : 'text-indigo-200/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className={cn('h-5 w-5 transition-transform group-hover:scale-105 duration-200', isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white')} />
                    {isMessages && unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center shadow-md font-bold">
                        {unreadMessageCount}
                      </span>
                    )}
                  </div>
                  {shouldExpand && (
                    <span className={cn('whitespace-nowrap font-semibold text-sm', isActive ? 'text-white' : 'text-indigo-100/80 group-hover:text-white')}>
                      {item.title}
                    </span>
                  )}
                  {/* Active left accent bar */}
                  {isActive && !shouldExpand && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-r-full" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
