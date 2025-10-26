import { Capacitor } from '@capacitor/core';

export type Platform = 'electron' | 'android-tv' | 'web';

/**
 * Detect the current platform
 */
export function getPlatform(): Platform {
  // Check if running in Electron
  if ((window as any).electron?.isElectron) {
    return 'electron';
  }

  // Check if running on Android TV via Capacitor
  if (Capacitor.getPlatform() === 'android') {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('android') &&
        (userAgent.includes('tv') || userAgent.includes('aftm') || userAgent.includes('aftb'))) {
      return 'android-tv';
    }
  }

  return 'web';
}
