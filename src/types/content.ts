export interface ContentItem {
  id: number;
  name: string;
  language: string | null;
  media: "Live" | "On Demand" | null;
  type: "TV" | "Series" | "Movie" | "Radio";
  category: string | null;
  quality: string | null;
  platform: string | null;
  year: string | null;
  season: string | null;
  episode: string | null;
  logo: string;
  url: string;
  source: "IPTV" | "Plex";
}

export interface YearFilter {
  before?: string;
  after?: string;
}

export interface ContentRowFilters {
  language?: string[];
  media?: "Live" | "On Demand" | null;
  type?: "TV" | "Series" | "Movie" | "Radio" | null;
  category?: string[];
  quality?: string[];
  platform?: string[];
  name?: string;
  year?: YearFilter;
  season?: string;
  episode?: string;
}

export interface ContentRowConfig {
  id: string;
  title: string;
  filters: ContentRowFilters;
  order: number;
  limit: number; // Number of items to display in row (default: 10)
}

export interface WatchHistoryItem {
  content: ContentItem;
  currentTime: number;
  duration: number;
  lastWatched: number; // timestamp
  progress: number; // percentage (0-100)
}
