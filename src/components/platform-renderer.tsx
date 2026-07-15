'use client'

import { useState, useEffect } from 'react'
import { getPlatform, Platform } from '@/lib/capacitor/platform'

interface PlatformRendererProps {
  web: React.ReactNode
  mobile: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * PlatformRenderer - Client component for platform-specific rendering
 * 
 * Renders different components based on the current platform (web, android, ios)
 * 
 * Usage:
 * <PlatformRenderer
 *   web={<WebHome products={products} />}
 *   mobile={<MobileHome products={products} />}
 * />
 */
export function PlatformRenderer({ web, mobile, fallback }: PlatformRendererProps) {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    getPlatform().then(setPlatform)
  }, [])

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted || !platform) {
    return fallback || null
  }

  // Render mobile component for Android and iOS
  if (platform === Platform.ANDROID || platform === Platform.IOS) {
    return <>{mobile}</>
  }

  // Render web component for web platform
  return <>{web}</>
}
