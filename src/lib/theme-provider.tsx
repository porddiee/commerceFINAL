'use client'

import { useEffect } from 'react'

export function ThemeProvider() {
  useEffect(() => {
    // Apply theme on mount
    const savedPreferences = localStorage.getItem('preferences')
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences)
      if (prefs.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (prefs.theme === 'light') {
        document.documentElement.classList.remove('dark')
      }
      // Apply language
      document.documentElement.lang = prefs.language || 'en'
    }
  }, [])

  return null
}
