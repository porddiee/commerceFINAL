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
  { title: 'Products', href: '/admin/listings', icon: ShoppingBag },
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
          className="bg-indigo-600 text-white border-0 shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] rounded-full"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar — indigo gradient matching homepage */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-indigo-900 via-indigo-800 to-blue-900 border-r border-white/10 transition-all duration-300 shadow-2xl shadow-indigo-900/50',
          shouldExpand ? 'w-64' : 'w-16',
          'lg:translate-x-0',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center p-4 border-b border-white/10">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/20 hover:shadow-indigo-400/30 transition-all duration-200 hover:scale-[1.05] backdrop-blur-sm">
                <span className="text-white font-black text-lg">M</span>
              </div>
              {shouldExpand && (
                <span className="font-black text-xl text-white whitespace-nowrap tracking-tight">
                  SuriMart
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                    isActive
                      ? 'bg-white/20 text-white shadow-sm shadow-black/10 backdrop-blur-sm'
                      : 'text-indigo-200/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105 duration-200', isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white')} />
                  {shouldExpand && (
                    <span className={cn('whitespace-nowrap font-semibold text-sm', isActive ? 'text-white' : 'text-indigo-100/80 group-hover:text-white')}>
                      {item.title}
                    </span>
                  )}
                  {/* Active left accent bar when collapsed */}
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
