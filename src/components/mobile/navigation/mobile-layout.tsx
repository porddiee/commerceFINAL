'use client'

import { ReactNode } from 'react'
import { useSafeArea } from '@/hooks/use-safe-area'
import { useCapacitorStatusBar } from '@/hooks/use-capacitor-status-bar'

interface MobileLayoutProps {
  children: ReactNode
}

/**
 * MobileLayout - Wrapper component for mobile-specific layouts
 * Handles safe area insets and status bar configuration for mobile devices
 */
export function MobileLayout({ children }: MobileLayoutProps) {
  const { insets } = useSafeArea()
  
  // Configure status bar for mobile
  useCapacitorStatusBar({ style: 'Style.Dark' as any })

  return (
    <div 
      className="min-h-screen bg-slate-50"
      style={{
        paddingTop: `${insets.top}px`,
        paddingBottom: `${insets.bottom}px`,
        paddingLeft: `${insets.left}px`,
        paddingRight: `${insets.right}px`,
      }}
    >
      {children}
    </div>
  )
}
