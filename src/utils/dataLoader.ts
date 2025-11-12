/// <reference path="../types/electron.d.ts" />
import { ContentItem } from "../types/content";
import { contentData } from "../data/contentData";
import { sortByNameTurkish } from "./turkishSort";
import { loadIPTVDataAsync } from "./iptvSync";
import { loadPlexData } from "./plexSync";
import { loadSettings } from "./settings";

let cachedData: ContentItem[] | null = null;

/**
 * Load content data with caching
 * Handles large files efficiently with single load and memory caching
 * Combines IPTV and Plex data if enabled, then falls back to static data
 * 
 * NOTE: When you have your real JSON file (30MB+), replace the import in
 * /data/contentData.ts with your actual data. The file supports lazy loading
 * and only processes what's needed for each page/row.
 */
export async function loadContentData(): Promise<ContentItem[]> {
  // Return cached data if available
  if (cachedData) {
    return cachedData;
  }

  const settings = loadSettings();
  const combinedData: ContentItem[] = [];

  // Load IPTV data if enabled (now async from Electron cache)
  if (settings.iptvEnabled) {
    const iptvData = await loadIPTVDataAsync();
    if (iptvData && iptvData.length > 0) {
      combinedData.push(...iptvData);
    }
  }

  // Load Plex data if enabled
  if (settings.plexEnabled) {
    const plexData = loadPlexData();
    if (plexData && plexData.length > 0) {
      combinedData.push(...plexData);
    }
  }

  // If we have data from IPTV or Plex, use that
  if (combinedData.length > 0) {
    cachedData = combinedData;
    return cachedData;
  }

  // Fall back to static content data
  cachedData = contentData;
  return cachedData;
}

/**
 * Get all content (returns cached data or loads if not cached)
 */
export async function getAllContent(): Promise<ContentItem[]> {
  return loadContentData();
}

/**
 * Efficiently filter and paginate content
 * Only processes the slice of data needed
 */
export function paginateContent(
  items: ContentItem[],
  page: number = 1,
  pageSize: number = 20
): { items: ContentItem[]; totalPages: number; currentPage: number } {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    totalPages: Math.ceil(items.length / pageSize),
    currentPage: page
  };
}

/**
 * Get limited items for content rows (optimized for home page)
 */
export function limitItems(items: ContentItem[], limit: number = 10): ContentItem[] {
  return items.slice(0, limit);
}

/**
 * Clear the cache (useful for reloading data)
 */
export function clearCache(): void {
  cachedData = null;
}

// Helper functions (async versions)
export async function getMovies(): Promise<ContentItem[]> {
  const data = await getAllContent();
  const movies = data.filter(item => item.type === "Movie");
  return sortByNameTurkish(movies);
}

export async function getSeries(): Promise<ContentItem[]> {
  const data = await getAllContent();
  const series = data.filter(item => item.type === "Series");
  return sortByNameTurkish(series);
}

export async function getTVChannels(): Promise<ContentItem[]> {
  const data = await getAllContent();
  const tvChannels = data.filter(item => item.type === "TV");
  return sortByNameTurkish(tvChannels);
}

export async function getRadioStations(): Promise<ContentItem[]> {
  const data = await getAllContent();
  const radioStations = data.filter(item => item.type === "Radio");
  return sortByNameTurkish(radioStations);
}

export async function getTVByCategory(category: string): Promise<ContentItem[]> {
  const channels = await getTVChannels();
  return channels.filter(item => item.category === category);
}

export async function getTrending(): Promise<ContentItem[]> {
  const data = await getAllContent();
  return data
    .filter(item => (item.type === "Movie" || item.type === "Series") && item.media === "On Demand")
    .slice(0, 6);
}

export async function getNewReleases(): Promise<ContentItem[]> {
  const data = await getAllContent();
  return data.filter(item => 
    (item.type === "Movie" || item.type === "Series") && item.year === "2024"
  );
}
