/// <reference path="../types/electron.d.ts" />
import { ContentItem } from "../types/content";
import { loadSettings, saveSettings } from "./settings";
import { clearCache } from "./dataLoader";

export interface SyncResult {
  success: boolean;
  message: string;
  itemCount?: number;
}

/**
 * Fetches and converts IPTV M3U data using Electron's file caching system
 */
export async function syncIPTVData(url: string, onProgress?: (message: string) => void): Promise<SyncResult> {
  if (!window.electron?.isElectron) {
    return {
      success: false,
      message: "IPTV sync is only available in Electron app",
    };
  }

  try {
    // Set up progress listener
    let cleanupProgress: (() => void) | null = null;
    if (onProgress) {
      cleanupProgress = window.electron.iptv.onProgress(onProgress);
    }

    onProgress?.("Starting IPTV sync...");

    // Download M3U and convert to JSON, store in cache
    const result = await window.electron.iptv.downloadAndConvert(url);

    // Cleanup progress listener
    if (cleanupProgress) {
      cleanupProgress();
    }

    if (!result.success) {
      return {
        success: false,
        message: result.error || "Failed to download and convert M3U file",
      };
    }

    // Update last sync time
    const settings = loadSettings();
    settings.iptvLastSync = new Date().toISOString();
    saveSettings(settings);

    // Clear the data cache so new content appears immediately
    clearCache();

    onProgress?.(`Completed! Found ${result.itemCount} items`);

    return {
      success: true,
      message: "IPTV data synced successfully",
      itemCount: result.itemCount,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Loads IPTV data from Electron cache
 */
export function loadIPTVData(): ContentItem[] | null {
  // Note: This is now a synchronous function that returns null if not in Electron
  // The actual data loading is handled asynchronously in dataLoader.ts
  if (!window.electron?.isElectron) {
    console.warn("IPTV data loading is only available in Electron app");
    return null;
  }

  // Return null here - the actual loading is async and handled by loadIPTVDataAsync
  return null;
}

/**
 * Async version to load IPTV data from Electron cache
 */
export async function loadIPTVDataAsync(): Promise<ContentItem[] | null> {
  if (!window.electron?.isElectron) {
    return null;
  }

  try {
    const result = await window.electron.iptv.loadCache();

    if (!result.success || !result.data) {
      return null;
    }

    return result.data as ContentItem[];
  } catch (error) {
    console.error("Failed to load IPTV cache:", error);
    return null;
  }
}

/**
 * Clears IPTV cache
 */
export async function clearIPTVData(): Promise<void> {
  if (!window.electron?.isElectron) {
    return;
  }

  try {
    await window.electron.iptv.clearCache();
  } catch (error) {
    console.error("Failed to clear IPTV cache:", error);
  }
}

/**
 * Gets IPTV cache information
 */
export async function getIPTVCacheInfo() {
  if (!window.electron?.isElectron) {
    return null;
  }

  try {
    const result = await window.electron.iptv.getCacheInfo();
    return result;
  } catch (error) {
    console.error("Failed to get IPTV cache info:", error);
    return null;
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
