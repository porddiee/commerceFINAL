'use client'

import { ReactNode, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  position?: 'left' | 'right'
}

/**
 * MobileDrawer - Slide-out drawer for mobile layouts
 * Used for side menus, filters, etc.
 */
export function MobileDrawer({ 
  isOpen, 
  onClose, 
  children, 
  position = 'left' 
}: MobileDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 w-80 bg-white shadow-xl transition-transform duration-300 ease-in-out',
          position === 'left' ? 'left-0' : 'right-0',
          isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
