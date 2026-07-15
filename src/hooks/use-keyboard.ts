'use client'

import { useEffect, useState } from 'react'
import { isNativePlatform } from '@/lib/capacitor/platform'

interface KeyboardInfo {
  keyboardHeight: number
}

/**
 * Hook for handling keyboard visibility in Capacitor apps
 * Note: This requires @capacitor/keyboard plugin to be installed
 * 
 * Usage:
 * const { keyboardVisible, keyboardHeight } = useKeyboard()
 */
export function useKeyboard() {
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    let mounted = true

    const setupKeyboard = async () => {
      const isNative = await isNativePlatform()
      
      if (!isNative || !mounted) {
        return
      }

      try {
        // Dynamically import Capacitor Keyboard plugin
        // @ts-ignore - Plugin not installed in web development, will be installed for Capacitor build
        const capacitorKeyboard = await import('@capacitor/keyboard')
        const Keyboard = capacitorKeyboard.Keyboard
        
        // Listen for keyboard show event
        await Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
          if (mounted) {
            setKeyboardVisible(true)
            setKeyboardHeight(info.keyboardHeight)
          }
        })

        // Listen for keyboard hide event
        await Keyboard.addListener('keyboardWillHide', () => {
          if (mounted) {
            setKeyboardVisible(false)
            setKeyboardHeight(0)
          }
        })
      } catch (error) {
        // Plugin not installed - this is expected during web development
        // Will be installed when building Capacitor app
        console.debug('Capacitor Keyboard plugin not available (expected in web development):', error)
      }
    }

    setupKeyboard()

    return () => {
      mounted = false
      // Clean up listeners
      // @ts-ignore - Plugin not installed in web development, will be installed for Capacitor build
      import('@capacitor/keyboard').then((capacitorKeyboard) => {
        capacitorKeyboard.Keyboard?.removeAllListeners()
      }).catch(() => {
        // Ignore cleanup errors
      })
    }
  }, [])

  return { keyboardVisible, keyboardHeight }
}
