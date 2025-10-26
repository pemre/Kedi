/// <reference path="../types/electron.d.ts" />
import { ContentItem } from "../types/content";
import { loadSettings, saveSettings } from "./settings";
import { clearCache } from "./dataLoader";
import { parseM3U, isValidM3U } from "./m3uParser";
import {
  saveIPTVData as saveToStorage,
  clearIPTVData as clearStorage,
  loadIPTVData as loadFromStorage,
  getIPTVStorageInfo
} from "./iptvStorage";

export interface SyncResult {
  success: boolean;
  message: string;
  itemCount?: number;
}

/**
 * Fetches and converts IPTV M3U data - Works on Web, Electron, and Capacitor
 */
export async function syncIPTVData(url: string, onProgress?: (message: string) => void): Promise<SyncResult> {
  try {
    onProgress?.("Starting IPTV sync...");

    // Step 1: Download M3U file using fetch (works everywhere)
    onProgress?.("Downloading M3U file...");
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to download M3U: ${response.status} ${response.statusText}`,
      };
    }

    const m3uContent = await response.text();

    // Step 2: Validate M3U format
    if (!isValidM3U(m3uContent)) {
      return {
        success: false,
        message: "Invalid M3U file format",
      };
    }

    // Step 3: Parse M3U to JSON
    onProgress?.("Converting M3U to JSON...");
    const contentItems = parseM3U(m3uContent);

    if (contentItems.length === 0) {
      return {
        success: false,
        message: "No valid entries found in M3U file",
      };
    }

    // Step 4: Save to IndexedDB
    onProgress?.("Saving to storage...");
    await saveToStorage(contentItems, url, m3uContent);

    // Update last sync time
    const settings = loadSettings();
    settings.iptvLastSync = new Date().toISOString();
    saveSettings(settings);

    // Clear the data cache so new content appears immediately
    clearCache();

    onProgress?.(`Completed! Found ${contentItems.length} items`);

    return {
      success: true,
      message: "IPTV data synced successfully",
      itemCount: contentItems.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Loads IPTV data from storage
 */
export function loadIPTVData(): ContentItem[] | null {
  // Note: This is a synchronous stub - actual loading is async
  // The actual data loading is handled asynchronously in loadIPTVDataAsync
  return null;
}

/**
 * Async version to load IPTV data from storage (IndexedDB)
 */
export async function loadIPTVDataAsync(): Promise<ContentItem[] | null> {
  try {
    return await loadFromStorage();
  } catch (error) {
    console.error("Failed to load IPTV cache:", error);
    return null;
  }
}

/**
 * Clears IPTV cache
 */
export async function clearIPTVData(): Promise<void> {
  try {
    await clearStorage();
  } catch (error) {
    console.error("Failed to clear IPTV cache:", error);
  }
}

/**
 * Gets IPTV cache information
 */
export async function getIPTVCacheInfo() {
  try {
    const info = await getIPTVStorageInfo();

    return {
      success: true,
      exists: info.exists,
      itemCount: info.metadata?.itemCount,
      storageSize: info.metadata?.storageSize,
      driver: info.driver,
      driverName: info.driverName,
      lastModified: info.metadata?.lastModified,
      lastSync: info.lastSync,
    };
  } catch (error) {
    console.error("Failed to get IPTV cache info:", error);
    return {
      success: false,
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Checks if a sync is due based on settings
 */
export function isSyncDue(): boolean {
  const settings = loadSettings();

  if (!settings.iptvEnabled || !settings.iptvAutoSync || !settings.iptvUrl) {
    return false;
  }

  // If never synced, sync is due
  if (!settings.iptvLastSync) {
    return true;
  }

  const lastSync = new Date(settings.iptvLastSync);
  const now = new Date();

  // Check if enough days have passed
  const daysSinceSync = Math.floor(
    (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceSync < settings.iptvSyncIntervalDays) {
    return false;
  }

  // Check if we're past the scheduled time today
  const [hours, minutes] = settings.iptvSyncTime.split(":").map(Number);
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  return now >= scheduledTime;
}

/**
 * Performs auto-sync if due
 */
export async function autoSyncIfDue(onProgress?: (message: string) => void): Promise<SyncResult | null> {
  if (!isSyncDue()) {
    return null;
  }

  const settings = loadSettings();
  onProgress?.("Auto-syncing IPTV data...");
  return await syncIPTVData(settings.iptvUrl, onProgress);
}
