'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  Search,
  Heart,
  MessageSquare,
  Bell,
  Settings,
  Plus,
  ShoppingBag,
  FileText,
  LayoutDashboard,
  Menu,
  X,
  User,
  LogOut,
  Package,
  DollarSign,
} from 'lucide-react'
import { useSidebarStore } from '@/lib/store/sidebar'
import { useAuthStore } from '@/lib/store/auth'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  title: string
  href: string
  icon: any
}

const publicNavItems: NavItem[] = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Browse Products', href: '/browse', icon: Search },
]

const userNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/user', icon: LayoutDashboard },
  { title: 'Messages', href: '/user/messages', icon: MessageSquare },
  { title: 'My Transactions', href: '/user/transactions', icon: Package },
  { title: 'Manage Products', href: '/user/listings', icon: ShoppingBag },
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
    if (user) {
      fetchUnreadMessages()
    }
  }, [user, pathname])

  const fetchUnreadMessages = async () => {
    if (!user) return
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .is('is_read', false)
      
      // Filter out deleted messages for current user
      const filteredMessages = data?.filter((msg: any) => !msg.deleted_by_receiver) || []
      setUnreadMessageCount(filteredMessages.length)
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }

  const navItems = isAuthenticated ? [...publicNavItems, ...userNavItems] : publicNavItems
  const shouldExpand = isOpen || isHovered

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(!isOpen)}
          className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white border-0 shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] rounded-full"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r-2 border-gray-200 dark:border-gray-700 transition-all duration-300 shadow-xl',
          shouldExpand ? 'w-64' : 'w-16',
          'lg:translate-x-0',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center p-4 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02]">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              {shouldExpand && (
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-blue-400 dark:to-purple-400 whitespace-nowrap">SuriMart</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isMessages = item.href === '/user/messages'
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg shadow-purple-500/30' 
                      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 text-gray-700 dark:text-gray-300'
                  )}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isMessages && unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                        {unreadMessageCount}
                      </span>
                    )}
                  </div>
                  {shouldExpand && <span className="whitespace-nowrap font-medium">{item.title}</span>}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
