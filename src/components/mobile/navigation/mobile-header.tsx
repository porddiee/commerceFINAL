'use client'

import { ReactNode } from 'react'
import { Menu, Bell, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore, useCartStore } from '@/lib/store/auth'

interface MobileHeaderProps {
  title?: string
  rightAction?: ReactNode
  showMenu?: boolean
  showCart?: boolean
  showNotifications?: boolean
  onMenuClick?: () => void
}

/**
 * MobileHeader - Header component for mobile layouts
 */
export function MobileHeader({ 
  title = 'SuriMart',
  rightAction,
  showMenu = true,
  showCart = true,
  showNotifications = true,
  onMenuClick 
}: MobileHeaderProps) {
  const { user } = useAuthStore()
  const { cartCount } = useCartStore()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button */}
        {showMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Center - Title */}
        <h1 className="text-lg font-bold text-slate-900 flex-1 text-center">
          {title}
        </h1>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {rightAction || (
            <>
              {user && showCart && (
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-indigo-600 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Button>
              )}
              {user && showNotifications && (
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Bell className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
