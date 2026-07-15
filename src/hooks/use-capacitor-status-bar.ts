'use client'

import { useEffect, useState } from 'react'
import { isNativePlatform } from '@/lib/capacitor/platform'

/**
 * Hook for configuring the status bar in Capacitor apps
 * Note: This requires @capacitor/status-bar plugin to be installed
 * 
 * Usage:
 * useCapacitorStatusBar({ style: 'Style.Dark' as any })
 */
export function useCapacitorStatusBar(options?: {
  style?: any
  backgroundColor?: string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let isComponentMounted = true

    const setupStatusBar = async () => {
      const isNative = await isNativePlatform()
      
      if (!isNative || !isComponentMounted) {
        setMounted(true)
        return
      }

      try {
        // Dynamically import Capacitor StatusBar plugin
        // @ts-ignore - Plugin not installed in web development, will be installed for Capacitor build
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        
        // Set status bar style
        if (options?.style) {
          await StatusBar.setStyle({ style: options.style })
        }

        // Set status bar background color
        if (options?.backgroundColor) {
          await StatusBar.setBackgroundColor({ color: options.backgroundColor })
        }

        // Hide status bar overlay if needed
        await StatusBar.setOverlaysWebView({ overlay: false })

        setMounted(true)
      } catch (error) {
        // Plugin not installed - this is expected during web development
        console.debug('Capacitor StatusBar plugin not available (expected in web development):', error)
        setMounted(true)
      }
    }

    setupStatusBar()

    return () => {
      isComponentMounted = false
    }
  }, [options?.style, options?.backgroundColor])

  return { mounted }
}
