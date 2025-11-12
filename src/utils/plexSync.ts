import { ContentItem } from "../types/content";
import { loadSettings, saveSettings } from "./settings";
import { clearCache } from "./dataLoader";

const PLEX_DATA_KEY = "kedi_plex_data";

export interface SyncResult {
  success: boolean;
  message: string;
  itemCount?: number;
}

interface PlexLibrary {
  key: string;
  title: string;
  type: string; // "movie" or "show"
}

interface PlexMediaItem {
  key: string;
  title: string;
  year?: number;
  thumb?: string;
  art?: string;
  type: string; // "movie", "show", "season", "episode"
  parentKey?: string;
  grandparentKey?: string;
  parentTitle?: string; // For episodes, this is the show name
  index?: number; // season or episode number
  parentIndex?: number; // season number for episodes
  Media?: Array<{
    id: string;
    duration?: number;
    videoResolution?: string;
    Part?: Array<{
        key: string;
    }>;
  }>;
}

/**
 * Validates that the data is a valid ContentItem array
 */
function validatePlexData(data: any): data is ContentItem[] {
  if (!Array.isArray(data)) {
    return false;
  }

  if (data.length === 0) {
    return true; // Empty array is valid
  }

  const sample = data[0];
  return (
    typeof sample === "object" &&
    sample !== null &&
    "id" in sample &&
    "name" in sample &&
    "type" in sample &&
    "source" in sample
  );
}

/**
 * Normalizes Plex media item to ContentItem
 */
function normalizePlexItem(
  item: PlexMediaItem,
  plexUrl: string,
  plexToken: string,
  idOffset: number,
  showTitle?: string // Optional show title for episodes
): ContentItem | null {
  // Skip seasons, we only want episodes
  if (item.type === "season") {
    return null;
  }

  const type = item.type === "movie"
      ? "Movie"
      : item.type === "show" || item.type === "episode"
          ? "Series"
          : null;
  if (!type) return null;

  // Build the stream URL
  const mediaKey = item.Media?.[0]?.Part?.[0]?.key || "";
  const streamUrl = mediaKey ? `${plexUrl}${mediaKey}?X-Plex-Token=${plexToken}` : "";

  // Get thumb URL
  const thumbUrl = item.thumb ? `${plexUrl}${item.thumb}?X-Plex-Token=${plexToken}` : "";

  // Determine quality from resolution
  const resolution = item.Media?.[0]?.videoResolution || "";
  let quality = null;
  if (resolution.includes("4k") || resolution.includes("2160")) {
    quality = "4K";
  } else if (resolution.includes("1080")) {
    quality = "FHD";
  } else if (resolution.includes("720")) {
    quality = "HD";
  }

  // For episodes, use the show title; for movies and shows, use the item title
  let name = item.title;
  if (item.type === "episode") {
    name = showTitle || item.parentTitle || item.title;
  }

  return {
    id: idOffset + parseInt(item.key.replace(/\D/g, "") || "0"),
    name: name,
    language: null, // Plex doesn't easily expose primary language
    media: "On Demand",
    type: type,
    category: null,
    quality: quality,
    platform: "Plex",
    year: item.year?.toString() || null,
    season: item.type === "episode" && item.parentIndex ? item.parentIndex.toString() : null,
    episode: item.type === "episode" && item.index ? item.index.toString() : null,
    logo: thumbUrl,
    url: streamUrl,
    source: "Plex",
  };
}

/**
 * Fetches all libraries from Plex server
 */
async function fetchPlexLibraries(plexUrl: string, plexToken: string): Promise<PlexLibrary[]> {
  const response = await fetch(`${plexUrl}/library/sections?X-Plex-Token=${plexToken}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Plex libraries: ${response.statusText}`);
  }

  const data = await response.json();
  const directories = data.MediaContainer?.Directory || [];

  // Filter for movie and TV show libraries
  return directories.filter((lib: any) => lib.type === "movie" || lib.type === "show");
}

/**
 * Fetches all items from a specific Plex library
 */
async function fetchPlexLibraryItems(
  plexUrl: string,
  plexToken: string,
  libraryKey: string
): Promise<PlexMediaItem[]> {
  const response = await fetch(
    `${plexUrl}/library/sections/${libraryKey}/all?X-Plex-Token=${plexToken}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch library items: ${response.statusText}`);
  }

  const data = await response.json();
  return data.MediaContainer?.Metadata || [];
}

/**
 * Fetches all seasons for a TV show
 */
async function fetchShowSeasons(
  plexUrl: string,
  plexToken: string,
  showKey: string
): Promise<PlexMediaItem[]> {
  // Remove /children suffix if it exists to avoid double /children/children
  const cleanKey = showKey.replace(/\/children$/, '');

  try {
    const response = await fetch(`${plexUrl}${cleanKey}/children?X-Plex-Token=${plexToken}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch show seasons (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    return data.MediaContainer?.Metadata || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching seasons for ${showKey}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Fetches all episodes for a specific season
 */
async function fetchSeasonEpisodes(
  plexUrl: string,
  plexToken: string,
  seasonKey: string
): Promise<PlexMediaItem[]> {
  // Remove /children suffix if it exists to avoid double /children/children
  const cleanKey = seasonKey.replace(/\/children$/, '');

  try {
    const response = await fetch(`${plexUrl}${cleanKey}/children?X-Plex-Token=${plexToken}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch season episodes (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    return data.MediaContainer?.Metadata || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching episodes for ${seasonKey}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Fetches all episodes for a TV show by iterating through seasons
 */
async function fetchShowEpisodes(
  plexUrl: string,
  plexToken: string,
  showKey: string
): Promise<PlexMediaItem[]> {
  const seasons = await fetchShowSeasons(plexUrl, plexToken, showKey);
  const allEpisodes: PlexMediaItem[] = [];

  for (const season of seasons) {
    if (season.type === "season") {
      try {
        const episodes = await fetchSeasonEpisodes(plexUrl, plexToken, season.key);
        allEpisodes.push(...episodes);
      } catch (error) {
        console.error(`Failed to fetch episodes for season ${season.title}:`, error);
      }
    }
  }

  return allEpisodes;
}

/**
 * Fetches all content from Plex server
 */
export async function fetchPlexData(
  plexUrl: string,
  plexToken: string,
  onProgress?: (message: string) => void
): Promise<ContentItem[]> {
  // Remove trailing slash from URL
  plexUrl = plexUrl.replace(/\/$/, "");

  onProgress?.("Fetching Plex libraries...");

  // Fetch all libraries
  const libraries = await fetchPlexLibraries(plexUrl, plexToken);

  const allItems: ContentItem[] = [];
  let idOffset = 1000000; // Start with high ID to avoid conflicts with IPTV data

  // Fetch items from each library
  for (let i = 0; i < libraries.length; i++) {
    const library = libraries[i];
    onProgress?.(`Processing library ${i + 1}/${libraries.length}: ${library.title}`);

    const items = await fetchPlexLibraryItems(plexUrl, plexToken, library.key);

    for (const item of items) {
      if (item.type === "movie") {
        // Add movie directly
        const normalizedItem = normalizePlexItem(item, plexUrl, plexToken, idOffset);
        if (normalizedItem) {
          allItems.push(normalizedItem);
          idOffset++;
        }
      } else if (item.type === "show") {
        // Fetch all episodes for the show
        try {
          onProgress?.(`Fetching episodes for: ${item.title}`);
          const episodes = await fetchShowEpisodes(plexUrl, plexToken, item.key);
          for (const episode of episodes) {
            const normalizedEpisode = normalizePlexItem(episode, plexUrl, plexToken, idOffset, item.title);
            if (normalizedEpisode) {
              allItems.push(normalizedEpisode);
              idOffset++;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch episodes for show ${item.title}:`, error);
        }
      }
    }
  }

  onProgress?.(`Completed! Found ${allItems.length} items`);
  return allItems;
}

/**
 * Saves Plex data to localStorage
 */
export function savePlexData(data: ContentItem[]): void {
  try {
    localStorage.setItem(PLEX_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save Plex data:", error);
    throw error;
  }
}

/**
 * Loads Plex data from localStorage
 */
export function loadPlexData(): ContentItem[] | null {
  try {
    const stored = localStorage.getItem(PLEX_DATA_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    return validatePlexData(data) ? data : null;
  } catch (error) {
    console.error("Failed to load Plex data:", error);
    return null;
  }
}

/**
 * Clears Plex data from localStorage
 */
export function clearPlexData(): void {
  localStorage.removeItem(PLEX_DATA_KEY);
}

/**
 * Performs a sync operation: fetches and saves Plex data
 */
export async function syncPlexData(
  plexUrl: string,
  plexToken: string,
  onProgress?: (message: string) => void
): Promise<SyncResult> {
  try {
    const data = await fetchPlexData(plexUrl, plexToken, onProgress);
    savePlexData(data);

    // Update last sync time
    const settings = loadSettings();
    settings.plexLastSync = new Date().toISOString();
    saveSettings(settings);

    // Clear the data cache so new content appears immediately
    clearCache();

    return {
      success: true,
      message: "Plex data synced successfully",
      itemCount: data.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Checks if a sync is due based on settings
 */
export function isSyncDue(): boolean {
  const settings = loadSettings();

  if (!settings.plexEnabled || !settings.plexAutoSync || !settings.plexUrl || !settings.plexToken) {
    return false;
  }

  // If never synced, sync is due
  if (!settings.plexLastSync) {
    return true;
  }

  const lastSync = new Date(settings.plexLastSync);
  const now = new Date();

  // Check if enough days have passed
  const daysSinceSync = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceSync < settings.plexSyncIntervalDays) {
    return false;
  }

  // Check if we're past the scheduled time today
  const [hours, minutes] = settings.plexSyncTime.split(":").map(Number);
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
  onProgress?.("Auto-syncing Plex library...");
  return await syncPlexData(settings.plexUrl, settings.plexToken, onProgress);
}
