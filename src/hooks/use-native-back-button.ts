'use client'

import { useEffect } from 'react'
import { isNativePlatform } from '@/lib/capacitor/platform'

/**
 * Hook for handling native back button in Capacitor apps
 * Note: This requires @capacitor/app plugin to be installed
 * 
 * Usage:
 * useNativeBackButton(() => {
 *   // Handle back button press
 *   console.log('Back button pressed')
 * })
 */
export function useNativeBackButton(handler: () => void) {
  useEffect(() => {
    let mounted = true

    const setupBackButton = async () => {
      const isNative = await isNativePlatform()
      
      if (!isNative || !mounted) {
        return
      }

      try {
        // Dynamically import Capacitor App plugin
        // @ts-ignore - Plugin not installed in web development, will be installed for Capacitor build
        const { App } = await import('@capacitor/app')
        
        // Listen for back button events
        await App.addListener('backButton', handler)
      } catch (error) {
        console.warn('Capacitor App plugin not available:', error)
      }
    }

    setupBackButton()

    return () => {
      mounted = false
      // Clean up listeners
      // @ts-ignore - Plugin not installed in web development, will be installed for Capacitor build
      import('@capacitor/app').then(({ App }) => {
        App.removeAllListeners()
      }).catch(() => {
        // Ignore cleanup errors
      })
    }
  }, [handler])
}
