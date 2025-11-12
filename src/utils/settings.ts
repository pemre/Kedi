export interface AppSettings {
  languagePreferences: string[];
  iptvEnabled: boolean;
  iptvUrl: string;
  iptvAutoSync: boolean;
  iptvSyncIntervalDays: number;
  iptvSyncTime: string; // HH:MM format (24h)
  iptvLastSync: string | null; // ISO date string
  plexEnabled: boolean;
  plexUrl: string; // Plex server URL (e.g., http://192.168.1.100:32400)
  plexToken: string;
  plexAutoSync: boolean;
  plexSyncIntervalDays: number;
  plexSyncTime: string; // HH:MM format (24h)
  plexLastSync: string | null; // ISO date string
  tmdbEnabled: boolean;
  tmdbBearerToken: string;
  youtubeEnabled: boolean;
  youtubeApiKey: string;
  showLogo: boolean;
  showHome: boolean;
  showSeries: boolean;
  showMovies: boolean;
  showLive: boolean;
  showRadio: boolean;
}

const STORAGE_KEY = "kedi_app_settings";

const DEFAULT_SETTINGS: AppSettings = {
  languagePreferences: ["eng"],
  iptvEnabled: false,
  iptvUrl: "",
  iptvAutoSync: false,
  iptvSyncIntervalDays: 7,
  iptvSyncTime: "03:00", // 3 AM by default
  iptvLastSync: null,
  plexEnabled: false,
  plexUrl: "",
  plexToken: "",
  plexAutoSync: false,
  plexSyncIntervalDays: 7,
  plexSyncTime: "03:00", // 3 AM by default
  plexLastSync: null,
  tmdbEnabled: false,
  tmdbBearerToken: "",
  youtubeEnabled: false,
  youtubeApiKey: "",
  showLogo: true,
  showHome: true,
  showSeries: true,
  showMovies: true,
  showLive: true,
  showRadio: true,
};

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export function resetSettings(): AppSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to reset settings:", error);
    return DEFAULT_SETTINGS;
  }
}
