/**
 * IPTV Storage Utility using localForage
 * Works across Web, Electron, and Capacitor (Android)
 */

import { ContentItem } from '../types/content';

// Dynamic import of localforage to avoid module resolution issues
let localforage: any;
let iptvStore: any;

// Initialize localForage lazily
async function getStore() {
  if (!iptvStore) {
    if (!localforage) {
      // Dynamic import works in both browser and Node.js
      const module = await import('localforage');
      localforage = module.default || module;
    }
    iptvStore = localforage.createInstance({
      name: 'kedi-tv',
      storeName: 'iptv_data',
      description: 'IPTV content cache for Kedi TV'
    });
  }
  return iptvStore;
}

// Keys for storage
const STORAGE_KEYS = {
  CONTENT: 'iptv_content',
  M3U_RAW: 'iptv_m3u_raw', // Store raw M3U for debugging
  METADATA: 'iptv_metadata',
  LAST_SYNC: 'iptv_last_sync'
};

export interface IPTVMetadata {
  itemCount: number;
  lastModified: string;
  sourceUrl: string;
  storageSize?: number; // Approximate size in bytes
}

/**
 * Save IPTV content to IndexedDB
 */
export async function saveIPTVData(
  content: ContentItem[],
  sourceUrl: string,
  rawM3U?: string
): Promise<void> {
  const store = await getStore();
  const metadata: IPTVMetadata = {
    itemCount: content.length,
    lastModified: new Date().toISOString(),
    sourceUrl,
    storageSize: JSON.stringify(content).length
  };

  await store.setItem(STORAGE_KEYS.CONTENT, content);
  await store.setItem(STORAGE_KEYS.METADATA, metadata);
  await store.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

  // Optionally save raw M3U for debugging
  if (rawM3U) {
    await store.setItem(STORAGE_KEYS.M3U_RAW, rawM3U);
  }
}

/**
 * Load IPTV content from IndexedDB
 */
export async function loadIPTVData(): Promise<ContentItem[] | null> {
  try {
    const store = await getStore();
    return await store.getItem(STORAGE_KEYS.CONTENT);
  } catch (error) {
    console.error('Failed to load IPTV data:', error);
    return null;
  }
}

/**
 * Get IPTV metadata (without loading full content)
 */
export async function getIPTVMetadata(): Promise<IPTVMetadata | null> {
  try {
    const store = await getStore();
    return await store.getItem(STORAGE_KEYS.METADATA);
  } catch (error) {
    console.error('Failed to load IPTV metadata:', error);
    return null;
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    const store = await getStore();
    return await store.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Failed to get last sync time:', error);
    return null;
  }
}

/**
 * Clear all IPTV data from storage
 */
export async function clearIPTVData(): Promise<void> {
  const store = await getStore();
  await store.clear();
}

/**
 * Get storage driver information
 * @returns The driver being used by localForage (e.g., 'indexedDB', 'webSQL', 'localStorage')
 */
export async function getStorageDriver(): Promise<string> {
  const store = await getStore();
  return store.driver();
}

/**
 * Get storage driver name in human-readable format
 */
export async function getStorageDriverName(): Promise<string> {
  const driver = await getStorageDriver();

  // LocalForage internal driver names mapped to user-friendly names
  const driverNames: Record<string, string> = {
    'asyncStorage': 'IndexedDB',              // LocalForage uses "asyncStorage" internally for IndexedDB
    'indexedDB': 'IndexedDB',                 // Alternative name (some versions)
    'webSQLStorage': 'WebSQL',                // LocalForage internal name
    'webSQL': 'WebSQL',                       // Alternative name
    'localStorageWrapper': 'LocalStorage',    // LocalForage internal name
    'localStorage': 'LocalStorage'            // Alternative name
  };

  return driverNames[driver] || `${driver} (Unknown)`;
}

/**
 * Get comprehensive storage information
 */
export async function getIPTVStorageInfo(): Promise<{
  exists: boolean;
  metadata: IPTVMetadata | null;
  driver: string;
  driverName: string;
  lastSync: string | null;
}> {
  const metadata = await getIPTVMetadata();
  const driver = await getStorageDriver();
  const driverName = await getStorageDriverName();
  const lastSync = await getLastSyncTime();

  return {
    exists: metadata !== null,
    metadata,
    driver,
    driverName,
    lastSync
  };
}

/**
 * Check if IPTV data exists
 */
export async function hasIPTVData(): Promise<boolean> {
  try {
    const store = await getStore();
    const content = await store.getItem(STORAGE_KEYS.CONTENT);
    return content !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get raw M3U content (for debugging)
 */
export async function getRawM3U(): Promise<string | null> {
  try {
    const store = await getStore();
    return await store.getItem(STORAGE_KEYS.M3U_RAW);
  } catch (error) {
    console.error('Failed to load raw M3U:', error);
    return null;
  }
}

