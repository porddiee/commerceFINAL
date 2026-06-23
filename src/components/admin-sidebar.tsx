'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  LayoutDashboard,
  Users,
  Shield,
  ShoppingBag,
  Tag,
  FileText,
  Menu,
  X,
} from 'lucide-react'
import { useSidebarStore } from '@/lib/store/sidebar'

interface NavItem {
  title: string
  href: string
  icon: any
}

const adminNavItems: NavItem[] = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Verifications', href: '/admin/verifications', icon: Shield },
  { title: 'Listings', href: '/admin/listings', icon: ShoppingBag },
  { title: 'Categories', href: '/admin/categories', icon: Tag },
  { title: 'Reports', href: '/admin/reports', icon: FileText },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isOpen, toggle, setOpen } = useSidebarStore()
  const [isMobile, setIsMobile] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const shouldExpand = isOpen || isHovered

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(!isOpen)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] rounded-full"
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02]">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              {shouldExpand && (
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 whitespace-nowrap">SuriMart</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30' 
                      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 text-gray-700 dark:text-gray-300'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
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
