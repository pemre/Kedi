import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.keditv.app',
  appName: 'Kedi TV',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow HTTP for IPTV streams
  },
  android: {
    path: 'capacitor/android',
    allowMixedContent: true, // Allow mixed HTTP/HTTPS content for IPTV
    backgroundColor: '#000000',
    webContentsDebuggingEnabled: true, // Enable for development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
