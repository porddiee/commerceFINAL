'use client'

import { useEffect, useState } from 'react'
import { isNativePlatform } from '@/lib/capacitor/platform'

interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Hook for handling safe area insets in Capacitor apps
 * Useful for devices with notches (iPhone X, etc.)
 * 
 * Usage:
 * const { insets } = useSafeArea()
 * // Use insets.top, insets.bottom, etc. for padding
 */
export function useSafeArea() {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let isComponentMounted = true

    const setupSafeArea = async () => {
      const isNative = await isNativePlatform()
      
      if (!isNative || !isComponentMounted) {
        setMounted(true)
        return
      }

      try {
        // Dynamically import Capacitor SafeArea plugin
        // @ts-ignore - Plugin not installed in web development, will be installed for Capacitor build
        const { SafeArea } = await import('@capacitor/safe-area')
        
        // Get initial safe area insets
        const { insets: safeInsets } = await SafeArea.getSafeAreaInsets()
        
        if (isComponentMounted) {
          setInsets(safeInsets)
          setMounted(true)
        }

        // Listen for safe area changes
        await SafeArea.addListener('safeAreaChanged', ({ insets: newInsets }: { insets: SafeAreaInsets }) => {
          if (isComponentMounted) {
            setInsets(newInsets)
          }
        })
      } catch (error) {
        // Plugin not installed - this is expected during web development
        console.debug('Capacitor SafeArea plugin not available (expected in web development):', error)
        setMounted(true)
      }
    }

    setupSafeArea()

    return () => {
      isComponentMounted = false
      // Clean up listeners
      // @ts-ignore - Plugin not installed in web development, will be installed for Capacitor build
      import('@capacitor/safe-area').then(({ SafeArea }) => {
        SafeArea.removeAllListeners()
      }).catch(() => {
        // Ignore cleanup errors
      })
    }
  }, [])

  return { insets, mounted }
}
