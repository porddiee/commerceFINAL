'use client'

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { usePathname, useRouter } from 'next/navigation'

export function OAuthHandler() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const setupAppUrlOpenListener = async () => {
      await App.addListener('appUrlOpen', async (event) => {
        console.log('App URL opened:', event.url)
        
        // Handle the OAuth callback URL from custom scheme
        if (event.url.includes('auth/callback')) {
          // Close the browser
          await Browser.close()
          
          // Extract the auth code from the URL
          let url: URL
          try {
            // Try to parse as regular URL first
            url = new URL(event.url)
          } catch {
            // If it's a custom scheme, construct a fake URL for parsing
            const urlStr = event.url.replace('com.sgshop.app://', 'https://dummy.com/')
            url = new URL(urlStr)
          }
          
          const code = url.searchParams.get('code')
          const error = url.searchParams.get('error')
          const errorDescription = url.searchParams.get('error_description')
          
          if (error) {
            console.error('OAuth error:', error, errorDescription)
            router.push('/login?error=' + encodeURIComponent(errorDescription || error))
          } else if (code) {
            // Navigate to the callback page with the code
            router.push(`/auth/callback?code=${code}`)
          }
        }
      })
    }

    setupAppUrlOpenListener()

    return () => {
      App.removeAllListeners()
    }
  }, [router])

  // Handle OAuth callback in the browser
  useEffect(() => {
    if (pathname === '/auth/callback') {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')
      const errorDescription = url.searchParams.get('error_description')

      if (error) {
        console.error('OAuth error:', error, errorDescription)
        router.push('/login?error=' + encodeURIComponent(errorDescription || error))
      } else if (code) {
        // The callback page will handle the code exchange
        // This is just a fallback if the appUrlOpen listener doesn't catch it
      }
    }
  }, [pathname, router])

  return null
}
