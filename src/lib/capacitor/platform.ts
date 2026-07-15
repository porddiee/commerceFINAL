// Platform detection utilities for Capacitor
export const Platform = {
  WEB: "web",
  ANDROID: "android",
  IOS: "ios",
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

/**
 * Get the current platform
 * Dynamically imports Capacitor to avoid web build errors
 */
export async function getPlatform(): Promise<Platform> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return Platform.WEB;
  }

  try {
    // Dynamically import Capacitor
    const { Capacitor } = await import('@capacitor/core');
    
    if (!Capacitor.isNativePlatform()) {
      return Platform.WEB;
    }

    const platform = Capacitor.getPlatform();
    
    // Normalize platform name to match our enum
    if (platform === 'android') {
      return Platform.ANDROID;
    } else if (platform === 'ios') {
      return Platform.IOS;
    }
    
    return Platform.WEB;
  } catch (error) {
    // If Capacitor is not available, assume web
    console.warn('Capacitor not available, defaulting to web platform:', error);
    return Platform.WEB;
  }
}

/**
 * Check if the current platform is native (Android or iOS)
 */
export async function isNativePlatform(): Promise<boolean> {
  const platform = await getPlatform();
  return platform === Platform.ANDROID || platform === Platform.IOS;
}

/**
 * Check if the current platform is Android
 */
export async function isAndroid(): Promise<boolean> {
  const platform = await getPlatform();
  return platform === Platform.ANDROID;
}

/**
 * Check if the current platform is iOS
 */
export async function isIOS(): Promise<boolean> {
  const platform = await getPlatform();
  return platform === Platform.IOS;
}

/**
 * Check if the current platform is web
 */
export async function isWeb(): Promise<boolean> {
  const platform = await getPlatform();
  return platform === Platform.WEB;
}
