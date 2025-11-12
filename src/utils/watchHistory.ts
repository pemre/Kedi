import { WatchHistoryItem, ContentItem } from "../types/content";

const WATCH_HISTORY_KEY = "iptv_watch_history";
const MAX_HISTORY_ITEMS = 12;
const MIN_PROGRESS_PERCENT = 5; // Don't save if watched less than 5%
const MAX_PROGRESS_PERCENT = 95; // Don't save if watched more than 95% (considered complete)

export function loadWatchHistory(): WatchHistoryItem[] {
  try {
    const stored = localStorage.getItem(WATCH_HISTORY_KEY);
    if (stored) {
      const history = JSON.parse(stored);
      // Sort by lastWatched descending (most recent first)
      return history.sort((a: WatchHistoryItem, b: WatchHistoryItem) => b.lastWatched - a.lastWatched);
    }
  } catch (error) {
    console.error("Error loading watch history from localStorage:", error);
  }
  return [];
}

export function saveWatchProgress(
  item: ContentItem,
  currentTime: number,
  duration: number
): void {
  try {
    const progress = (currentTime / duration) * 100;
    
    // Don't save if video just started or is nearly complete
    if (progress < MIN_PROGRESS_PERCENT || progress > MAX_PROGRESS_PERCENT) {
      return;
    }

    const history = loadWatchHistory();
    
    // Remove existing entry for this content (by URL)
    const filteredHistory = history.filter(h => h.content.url !== item.url);
    
    // Add new entry at the beginning
    const newHistoryItem: WatchHistoryItem = {
      content: item,
      currentTime,
      duration,
      lastWatched: Date.now(),
      progress: Math.round(progress)
    };
    
    const updatedHistory = [newHistoryItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Error saving watch progress to localStorage:", error);
  }
}

export function getLastWatchedTime(item: ContentItem): number | null {
  const history = loadWatchHistory();
  const historyItem = history.find(h => h.content.url === item.url);
  return historyItem ? historyItem.currentTime : null;
}

export function removeFromWatchHistory(itemUrl: string): void {
  try {
    const history = loadWatchHistory();
    const updatedHistory = history.filter(h => h.content.url !== itemUrl);
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Error removing from watch history:", error);
  }
}

export function clearWatchHistory(): void {
  try {
    localStorage.removeItem(WATCH_HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing watch history:", error);
  }
}
