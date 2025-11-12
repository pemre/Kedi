// Type declarations for Electron API exposed via preload script

export interface IPTVCacheInfo {
  success: boolean;
  exists?: boolean;
  itemCount?: number;
  jsonCacheSize?: number;
  m3uCacheSize?: number;
  jsonCachePath?: string;
  m3uCachePath?: string;
  lastModified?: string;
  error?: string;
}

export interface IPTVDownloadResult {
  success: boolean;
  itemCount?: number;
  jsonCacheSize?: number;
  m3uCacheSize?: number;
  jsonCachePath?: string;
  m3uCachePath?: string;
  error?: string;
}

export interface IPTVLoadResult {
  success: boolean;
  data?: any[];
  cacheSize?: number;
  cachePath?: string;
  error?: string;
}

export interface ElectronAPI {
  platform: string;
  isElectron: boolean;
  mpv: {
    init: () => Promise<{ success: boolean; error?: string }>;
    play: (url: string) => Promise<{ success: boolean; error?: string }>;
    pause: (v: boolean) => Promise<{ success: boolean; error?: string }>;
    seek: (s: number, mode: string) => Promise<{ success: boolean; error?: string }>;
    volume: (v: number) => Promise<{ success: boolean; error?: string }>;
    stop: () => Promise<{ success: boolean; error?: string }>;
    kill: () => Promise<{ success: boolean; error?: string }>;
    onExit: (callback: () => void) => () => void;
  };
  iptv: {
    downloadAndConvert: (url: string) => Promise<IPTVDownloadResult>;
    loadCache: () => Promise<IPTVLoadResult>;
    clearCache: () => Promise<{ success: boolean; error?: string }>;
    getCacheInfo: () => Promise<IPTVCacheInfo>;
    onProgress: (callback: (message: string) => void) => () => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
