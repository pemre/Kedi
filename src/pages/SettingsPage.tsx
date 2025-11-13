/// <reference path="../types/electron.d.ts" />
import { useState, DragEvent, useEffect } from "react";
import { AppSettings, loadSettings, saveSettings, resetSettings } from "../utils/settings";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { X, Check, GripVertical, ChevronLeft, RotateCcw, RefreshCw, Calendar, Play, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { syncIPTVData, getIPTVCacheInfo } from "../utils/iptvSync";
import { syncPlexData } from "../utils/plexSync";

interface SettingsPageProps {
  onClose?: () => void;
  onSettingsChange?: (settings: AppSettings) => void;
  onContentReload?: () => void;
}

// Available languages
const AVAILABLE_LANGUAGES = [
  { code: "alb", name: "Albanian", flag: "🇦🇱" },
  { code: "aze", name: "Azerbaijani", flag: "🇦🇿" },
  { code: "bul", name: "Bulgarian", flag: "🇧🇬" },
  { code: "chi", name: "Chinese", flag: "🇨🇳" },
  { code: "cze", name: "Czech", flag: "🇨🇿" },
  { code: "deu", name: "German", flag: "🇩🇪" },
  { code: "dut", name: "Dutch", flag: "🇳🇱" },
  { code: "eng", name: "English", flag: "🇬🇧" },
  { code: "fra", name: "French", flag: "🇫🇷" },
  { code: "gre", name: "Greek", flag: "🇬🇷" },
  { code: "hin", name: "Hindi", flag: "🇮🇳" },
  { code: "hun", name: "Hungarian", flag: "🇭🇺" },
  { code: "ita", name: "Italian", flag: "🇮🇹" },
  { code: "jpn", name: "Japanese", flag: "🇯🇵" },
  { code: "kor", name: "Korean", flag: "🇰🇷" },
  { code: "per", name: "Persian", flag: "🇮🇷" },
  { code: "pol", name: "Polish", flag: "🇵🇱" },
  { code: "por", name: "Portuguese", flag: "🇵🇹" },
  { code: "rum", name: "Romanian", flag: "🇷🇴" },
  { code: "rus", name: "Russian", flag: "🇷🇺" },
  { code: "spa", name: "Spanish", flag: "🇪🇸" },
  { code: "swe", name: "Swedish", flag: "🇸🇪" },
  { code: "tur", name: "Turkish", flag: "🇹🇷" },
  { code: "ukr", name: "Ukrainian", flag: "🇺🇦" },
];

export function SettingsPage({ onClose, onSettingsChange, onContentReload }: SettingsPageProps) {
  const [initialSettings, setInitialSettings] = useState<AppSettings>(loadSettings());
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlexSyncing, setIsPlexSyncing] = useState(false);
  const [isTestingPlex, setIsTestingPlex] = useState(false);
  const [isTestingTMDB, setIsTestingTMDB] = useState(false);
  const [isTestingYouTube, setIsTestingYouTube] = useState(false);
  const [iptvCacheInfo, setIptvCacheInfo] = useState<{
    exists: boolean;
    itemCount?: number;
    storageSize?: number;
    driver?: string;
    driverName?: string;
    lastModified?: string;
    lastSync?: string;
  } | null>(null);
  const [iptvUrlSaveTimeout, setIptvUrlSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [iptvTimeSaveTimeout, setIptvTimeSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [plexUrlSaveTimeout, setPlexUrlSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [plexTokenSaveTimeout, setPlexTokenSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [plexTimeSaveTimeout, setPlexTimeSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load IPTV cache info on mount and when IPTV is enabled
  useEffect(() => {
    if (settings.iptvEnabled) {
      loadCacheInfo();
    }
  }, [settings.iptvEnabled]);

  // Also load cache info when the page first opens (for already-enabled IPTV)
  useEffect(() => {
    if (settings.iptvEnabled) {
      loadCacheInfo();
    }
  }, []);

  const loadCacheInfo = async () => {
    try {
      const info = await getIPTVCacheInfo();
      if (info && info.success) {
        setIptvCacheInfo({
          exists: info.exists || false,
          itemCount: info.itemCount,
          storageSize: info.storageSize,
          driver: info.driver,
          driverName: info.driverName,
          lastModified: info.lastModified,
          lastSync: info.lastSync,
        });
      } else if (info && !info.success) {
        console.error("Failed to get IPTV cache info:", info.error);
      }
    } catch (error) {
      console.error("Error loading IPTV cache info:", error);
    }
  };

  const handleIptvUrlChange = (url: string) => {
    const newSettings = { ...settings, iptvUrl: url };
    setSettings(newSettings);

    // Clear existing timeout
    if (iptvUrlSaveTimeout) {
      clearTimeout(iptvUrlSaveTimeout);
    }

    // Auto-save after 500ms of no typing
    const timeout = setTimeout(() => {
      saveSettings(newSettings);
      onSettingsChange?.(newSettings);
      setInitialSettings(newSettings); // Update initial to mark as saved
    }, 500);

    setIptvUrlSaveTimeout(timeout);
  };

  const handleIptvTimeChange = (time: string) => {
    const newSettings = { ...settings, iptvSyncTime: time };
    setSettings(newSettings);

    // Clear existing timeout
    if (iptvTimeSaveTimeout) {
      clearTimeout(iptvTimeSaveTimeout);
    }

    // Auto-save after 500ms of no typing
    const timeout = setTimeout(() => {
      saveSettings(newSettings);
      onSettingsChange?.(newSettings);
      setInitialSettings(newSettings); // Update initial to mark as saved
    }, 500);

    setIptvTimeSaveTimeout(timeout);
  };

  const handlePlexUrlChange = (url: string) => {
    const newSettings = { ...settings, plexUrl: url };
    setSettings(newSettings);

    // Clear existing timeout
    if (plexUrlSaveTimeout) {
      clearTimeout(plexUrlSaveTimeout);
    }

    // Auto-save after 500ms of no typing
    const timeout = setTimeout(() => {
      saveSettings(newSettings);
      onSettingsChange?.(newSettings);
      setInitialSettings(newSettings); // Update initial to mark as saved
    }, 500);

    setPlexUrlSaveTimeout(timeout);
  };

  const handlePlexTokenChange = (token: string) => {
    const newSettings = { ...settings, plexToken: token };
    setSettings(newSettings);

    // Clear existing timeout
    if (plexTokenSaveTimeout) {
      clearTimeout(plexTokenSaveTimeout);
    }

    // Auto-save after 500ms of no typing
    const timeout = setTimeout(() => {
      saveSettings(newSettings);
      onSettingsChange?.(newSettings);
      setInitialSettings(newSettings); // Update initial to mark as saved
    }, 500);

    setPlexTokenSaveTimeout(timeout);
  };

  const handlePlexTimeChange = (time: string) => {
    const newSettings = { ...settings, plexSyncTime: time };
    setSettings(newSettings);

    // Clear existing timeout
    if (plexTimeSaveTimeout) {
      clearTimeout(plexTimeSaveTimeout);
    }

    // Auto-save after 500ms of no typing
    const timeout = setTimeout(() => {
      saveSettings(newSettings);
      onSettingsChange?.(newSettings);
      setInitialSettings(newSettings); // Update initial to mark as saved
    }, 500);

    setPlexTimeSaveTimeout(timeout);
  };

  // Check if settings have changed from initial values
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSave = () => {
    saveSettings(settings);
    onSettingsChange?.(settings);
    setInitialSettings(settings); // Update initial settings to mark as saved
    toast.success("Settings saved successfully");
    // Don't close the settings page - keep it open
  };

  const handleReset = () => {
    const defaultSettings = resetSettings();
    setSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
    toast.success("Settings reset to defaults");
    // Close the settings page after resetting
    onClose?.();
  };

  const handleLanguageToggle = (langCode: string) => {
    setSettings((prev) => {
      const isSelected = prev.languagePreferences.includes(langCode);
      if (isSelected) {
        // Remove language
        return {
          ...prev,
          languagePreferences: prev.languagePreferences.filter((code) => code !== langCode),
        };
      } else {
        // Add language
        return {
          ...prev,
          languagePreferences: [...prev.languagePreferences, langCode],
        };
      }
    });
  };

  const moveLanguage = (fromIndex: number, toIndex: number) => {
    setSettings((prev) => {
      const newPreferences = [...prev.languagePreferences];
      const [movedItem] = newPreferences.splice(fromIndex, 1);
      newPreferences.splice(toIndex, 0, movedItem);
      return { ...prev, languagePreferences: newPreferences };
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveLanguage(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleManualSync = async () => {
    if (!settings.iptvUrl) {
      toast.error("Please enter an IPTV URL first");
      return;
    }

    // Save settings before syncing to ensure URL is persisted
    saveSettings(settings);
    onSettingsChange?.(settings);
    setInitialSettings(settings);

    setIsSyncing(true);
    const result = await syncIPTVData(settings.iptvUrl, (message) => {
      toast.info(message);
    });
    setIsSyncing(false);

    if (result.success) {
      toast.success(`${result.message} (${result.itemCount} items)`);
      // Update the last sync time in current settings
      const updatedSettings = {
        ...settings,
        iptvLastSync: new Date().toISOString(),
      };
      setSettings(updatedSettings);
      saveSettings(updatedSettings);
      onSettingsChange?.(updatedSettings);
      setInitialSettings(updatedSettings);
      // Reload cache info
      await loadCacheInfo();
      // Trigger content reload in parent to show new content immediately
      onContentReload?.();
    } else {
      toast.error(result.message);
    }
  };

  const handleManualPlexSync = async () => {
    if (!settings.plexUrl || !settings.plexToken) {
      toast.error("Please enter Plex server URL and token first");
      return;
    }

    // Save settings before syncing to ensure URL and token are persisted
    saveSettings(settings);
    onSettingsChange?.(settings);
    setInitialSettings(settings);

    setIsPlexSyncing(true);
    const result = await syncPlexData(settings.plexUrl, settings.plexToken, (message) => {
      toast.info(message);
    });
    setIsPlexSyncing(false);

    if (result.success) {
      toast.success(`${result.message} (${result.itemCount} items)`);
      // Update the last sync time in current settings
      const updatedSettings = {
        ...settings,
        plexLastSync: new Date().toISOString(),
      };
      setSettings(updatedSettings);
      saveSettings(updatedSettings);
      onSettingsChange?.(updatedSettings);
      setInitialSettings(updatedSettings);
      // Trigger content reload in parent to show new content immediately
      onContentReload?.();
    } else {
      toast.error(result.message);
    }
  };

  const formatLastSync = (isoDate: string | null): string => {
    if (!isoDate) return "Never";
    
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleTestPlex = async () => {
    if (!settings.plexUrl || !settings.plexToken) {
      toast.error("Please enter Plex server URL and token first");
      return;
    }

    setIsTestingPlex(true);

    try {
      // Test connection by fetching libraries
      const plexUrl = settings.plexUrl.replace(/\/$/, "");
      const response = await fetch(`${plexUrl}/library/sections?X-Plex-Token=${settings.plexToken}`, {
        headers: {
          Accept: "application/json",
        },
      });

      setIsTestingPlex(false);

      if (response.ok) {
        const data = await response.json();
        const libraryCount = data.MediaContainer?.Directory?.length || 0;
        toast.success(`Plex connection successful! Found ${libraryCount} libraries ✓`);
      } else {
        toast.error(`Plex connection failed: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      setIsTestingPlex(false);
      toast.error(`Plex connection error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleTestTMDB = async () => {
    if (!settings.tmdbBearerToken) {
      toast.error("Please enter a TMDB bearer token first");
      return;
    }

    setIsTestingTMDB(true);

    try {
      // Test with a search endpoint that requires valid authentication
      const response = await fetch("https://api.themoviedb.org/3/search/tv?query=test&language=en-US&include_adult=false", {
        headers: {
          "Authorization": `Bearer ${settings.tmdbBearerToken}`,
          "accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        setIsTestingTMDB(false);
        toast.error(`TMDB connection failed: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      setIsTestingTMDB(false);

      // If we got here, the request was successful
      toast.success("TMDB connection successful! ✓");
    } catch (error) {
      setIsTestingTMDB(false);
      toast.error(`TMDB connection error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleTestYouTube = async () => {
    if (!settings.youtubeApiKey) {
      toast.error("Please enter a YouTube API key first");
      return;
    }

    setIsTestingYouTube(true);

    try {
      // Test with a simple search query
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${settings.youtubeApiKey}`
      );

      setIsTestingYouTube(false);

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          toast.success("YouTube API connection successful! ✓");
        } else {
          toast.warning("YouTube API connected but returned no results");
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || response.statusText;
        toast.error(`YouTube API connection failed: ${errorMessage}`);
      }
    } catch (error) {
      setIsTestingYouTube(false);
      toast.error(`YouTube API connection error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const selectedLanguages = settings.languagePreferences;
  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    (lang) => !selectedLanguages.includes(lang.code)
  );

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 to-black pointer-events-none" />

      {/* Content */}
      <div className="relative pt-18 md:pt-32 px-6 md:px-12 pb-6 md:pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {onClose && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-white/20 bg-white/5 hover:bg-white/10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              <h1 className="text-4xl">Settings</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-white/20 bg-white/5 hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-[#E50914] hover:bg-[#E50914]/90 disabled:opacity-50"
              >
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-8">
            {/* Language Preferences */}
            <section className="p-6 border border-white/10 rounded-lg bg-white/5 space-y-6">
              <div>
                <h2 className="text-xl mb-1">Language Preferences</h2>
                <p className="text-white/60 text-sm">
                  Select your preferred languages. Languages on the left have higher priority.
                  Drag to reorder.
                </p>
              </div>

              {/* Selected Languages */}
              {selectedLanguages.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm text-white/70">Selected Languages (Priority Order)</Label>
                  <div className="flex flex-wrap gap-3">
                    {selectedLanguages.map((langCode, index) => {
                      const lang = AVAILABLE_LANGUAGES.find((l) => l.code === langCode);
                      if (!lang) return null;

                      return (
                        <div
                          key={langCode}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-2 px-4 py-2 bg-[#E50914]/20 border border-[#E50914]/50 rounded-lg cursor-move hover:bg-[#E50914]/30 transition-all ${
                            draggedIndex === index ? "opacity-50" : ""
                          }`}
                        >
                          <GripVertical className="h-4 w-4 text-white/50" />
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleLanguageToggle(langCode)}
                            className="h-6 w-6 ml-2 hover:bg-white/10"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {index === 0 && (
                            <span className="text-xs bg-[#E50914] px-2 py-0.5 rounded">Primary</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Languages */}
              {availableToAdd.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm text-white/70">Available Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableToAdd.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageToggle(lang.code)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                      >
                        <span className="text-sm">{lang.flag}</span>
                        <span className="text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* IPTV Source */}
            <section className="p-6 border border-white/10 rounded-lg bg-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl mb-1">IPTV Source</h2>
                  <p className="text-white/60 text-sm">
                    Enable and configure external IPTV data source
                  </p>
                </div>
                <Switch
                  checked={settings.iptvEnabled}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...settings, iptvEnabled: checked };
                    setSettings(newSettings);
                    saveSettings(newSettings); // Auto-save
                    onSettingsChange?.(newSettings);
                  }}
                />
              </div>

              {settings.iptvEnabled && (
                <div className="space-y-6">
                  {/* IPTV URL */}
                  <div className="space-y-2">
                    <Label htmlFor="iptv-url">IPTV Fetching URL</Label>
                    <Input
                      id="iptv-url"
                      type="url"
                      placeholder="https://example.com/iptv/data.json"
                      value={settings.iptvUrl}
                      onChange={(e) => handleIptvUrlChange(e.target.value)}
                      className="border-white/20 bg-transparent text-white placeholder:text-white/40"
                    />
                  </div>

                  {/* Auto Sync Toggle */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                      <Label>Auto Sync</Label>
                      <p className="text-sm text-white/60 mt-1">Automatically download updates</p>
                    </div>
                    <Switch
                      checked={settings.iptvAutoSync}
                      onCheckedChange={(checked) => {
                        const newSettings = { ...settings, iptvAutoSync: checked };
                        setSettings(newSettings);
                        saveSettings(newSettings); // Auto-save
                        onSettingsChange?.(newSettings);
                        setInitialSettings(newSettings);
                      }}
                    />
                  </div>

                  {/* Auto Sync Settings */}
                  {settings.iptvAutoSync && (
                    <div className="space-y-4 pl-4 border-l-2 border-[#E50914]/30">
                      {/* Sync Interval */}
                      <div className="space-y-2">
                        <Label htmlFor="sync-interval">Sync Every</Label>
                        <Select
                          value={settings.iptvSyncIntervalDays.toString()}
                          onValueChange={(value) => {
                            const newSettings = {
                              ...settings,
                              iptvSyncIntervalDays: parseInt(value),
                            };
                            setSettings(newSettings);
                            saveSettings(newSettings); // Auto-save
                            onSettingsChange?.(newSettings);
                            setInitialSettings(newSettings);
                          }}
                        >
                          <SelectTrigger
                            id="sync-interval"
                            className="border-white/20 bg-transparent text-white"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="2">2 Days</SelectItem>
                            <SelectItem value="3">3 Days</SelectItem>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="14">14 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sync Time */}
                      <div className="space-y-2">
                        <Label htmlFor="sync-time">Sync Time (24h)</Label>
                        <Input
                          id="sync-time"
                          type="time"
                          value={settings.iptvSyncTime}
                          onChange={(e) => handleIptvTimeChange(e.target.value)}
                          className="border-white/20 bg-transparent text-white"
                        />
                        <p className="text-xs text-white/50">
                          Downloads will occur at this time each interval
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Last Sync Info & Manual Sync */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-white/50" />
                      <div>
                        <p className="text-sm text-white/70">Last synced</p>
                        <p className="text-sm text-white/90 mt-0.5">
                          {formatLastSync(settings.iptvLastSync)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleManualSync}
                      disabled={isSyncing || !settings.iptvUrl}
                      variant="outline"
                      className="border-[#E50914]/50 bg-[#E50914]/10 hover:bg-[#E50914]/20 text-white"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </Button>
                  </div>

                  {/* Cache Info */}
                  {iptvCacheInfo && (
                    <div className="p-4 border border-white/10 rounded-lg bg-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-white/70 mb-2">
                        <HardDrive className="h-4 w-4" />
                        <span className="text-sm font-medium">Storage Information</span>
                      </div>
                      {iptvCacheInfo.exists ? (
                        <>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-white/50">Items Cached</p>
                              <p className="text-white/90 font-medium">
                                {iptvCacheInfo.itemCount?.toLocaleString() || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/50">Storage Size</p>
                              <p className="text-white/90 font-medium">
                                {iptvCacheInfo.storageSize
                                  ? `${(iptvCacheInfo.storageSize / 1024 / 1024).toFixed(2)} MB`
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/50">Storage Type</p>
                              <p className="text-white/90 font-medium">
                                {iptvCacheInfo.driverName || "Unknown"}
                              </p>
                            </div>
                          </div>
                          {iptvCacheInfo.lastModified && (
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-white/50 text-xs">Last Modified</p>
                              <p className="text-white/70 text-sm">
                                {new Date(iptvCacheInfo.lastModified).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-white/60">No cache found. Sync to create cache.</p>
                          {iptvCacheInfo.driverName && (
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-white/50 text-xs">Storage Type (Ready)</p>
                              <p className="text-white/70 text-sm">
                                {iptvCacheInfo.driverName}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Plex Integration */}
            <section className="p-6 border border-white/10 rounded-lg bg-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl mb-1">Plex Integration</h2>
                  <p className="text-white/60 text-sm">
                    Connect your Plex Media Server to access your movies and TV shows
                  </p>
                </div>
                <Switch
                  checked={settings.plexEnabled}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...settings, plexEnabled: checked };
                    setSettings(newSettings);
                    saveSettings(newSettings); // Auto-save
                    onSettingsChange?.(newSettings);
                    setInitialSettings(newSettings);
                  }}
                />
              </div>

              {settings.plexEnabled && (
                <div className="space-y-6">
                  {/* Plex Server URL */}
                  <div className="space-y-2">
                    <Label htmlFor="plex-url">Plex Server URL</Label>
                    <Input
                      id="plex-url"
                      type="url"
                      placeholder="http://192.168.1.100:32400"
                      value={settings.plexUrl}
                      onChange={(e) => handlePlexUrlChange(e.target.value)}
                      className="border-white/20 bg-transparent text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/50">
                      Include the full URL with port (typically 32400)
                    </p>
                  </div>

                  {/* Plex Token */}
                  <div className="space-y-2">
                    <Label htmlFor="plex-token">Plex Token</Label>
                    <Input
                      id="plex-token"
                      type="text"
                      placeholder="xxxxxxxxxxxxxxxxxxxx"
                      value={settings.plexToken}
                      onChange={(e) => handlePlexTokenChange(e.target.value)}
                      className="border-white/20 bg-transparent text-white placeholder:text-white/40 font-mono text-sm"
                    />
                    <p className="text-xs text-white/50">
                      Find your token at{" "}
                      <a
                        href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E50914] hover:underline"
                      >
                        Plex Support
                      </a>
                    </p>
                  </div>

                  {/* Test Connection */}
                  <div className="flex justify-end py-4 border-t border-white/10">
                    <Button
                      onClick={handleTestPlex}
                      disabled={isTestingPlex || !settings.plexUrl || !settings.plexToken}
                      variant="outline"
                      size="sm"
                      className="border-[#E50914]/50 bg-[#E50914]/10 hover:bg-[#E50914]/20 text-white"
                    >
                      <Play className={`h-3 w-3 mr-2 ${isTestingPlex ? "animate-pulse" : ""}`} />
                      {isTestingPlex ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>

                  {/* Auto Sync Toggle */}
                  <div className="flex items-center justify-between py-4 border-t border-white/10">
                    <div>
                      <Label>Auto Sync</Label>
                      <p className="text-sm text-white/60 mt-1">Automatically sync Plex library</p>
                    </div>
                    <Switch
                      checked={settings.plexAutoSync}
                      onCheckedChange={(checked) => {
                        const newSettings = { ...settings, plexAutoSync: checked };
                        setSettings(newSettings);
                        saveSettings(newSettings); // Auto-save
                        onSettingsChange?.(newSettings);
                        setInitialSettings(newSettings);
                      }}
                    />
                  </div>

                  {/* Auto Sync Settings */}
                  {settings.plexAutoSync && (
                    <div className="space-y-4 pl-4 border-l-2 border-[#E50914]/30">
                      {/* Sync Interval */}
                      <div className="space-y-2">
                        <Label htmlFor="plex-sync-interval">Sync Every</Label>
                        <Select
                          value={settings.plexSyncIntervalDays.toString()}
                          onValueChange={(value) => {
                            const newSettings = {
                              ...settings,
                              plexSyncIntervalDays: parseInt(value),
                            };
                            setSettings(newSettings);
                            saveSettings(newSettings); // Auto-save
                            onSettingsChange?.(newSettings);
                            setInitialSettings(newSettings);
                          }}
                        >
                          <SelectTrigger
                            id="plex-sync-interval"
                            className="border-white/20 bg-transparent text-white"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="2">2 Days</SelectItem>
                            <SelectItem value="3">3 Days</SelectItem>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="14">14 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sync Time */}
                      <div className="space-y-2">
                        <Label htmlFor="plex-sync-time">Sync Time (24h)</Label>
                        <Input
                          id="plex-sync-time"
                          type="time"
                          value={settings.plexSyncTime}
                          onChange={(e) => handlePlexTimeChange(e.target.value)}
                          className="border-white/20 bg-transparent text-white"
                        />
                        <p className="text-xs text-white/50">
                          Library sync will occur at this time each interval
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Last Sync Info & Manual Sync */}
                  <div className="flex items-center justify-between py-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-white/50" />
                      <div>
                        <p className="text-sm text-white/70">Last synced</p>
                        <p className="text-sm text-white/90 mt-0.5">
                          {formatLastSync(settings.plexLastSync)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleManualPlexSync}
                      disabled={isPlexSyncing || !settings.plexUrl || !settings.plexToken}
                      variant="outline"
                      className="border-[#E50914]/50 bg-[#E50914]/10 hover:bg-[#E50914]/20 text-white"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isPlexSyncing ? "animate-spin" : ""}`} />
                      {isPlexSyncing ? "Syncing..." : "Sync Now"}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* TMDB Support */}
            <section className="p-6 border border-white/10 rounded-lg bg-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl mb-1">TMDB Support</h2>
                  <p className="text-white/60 text-sm">
                    Enable movie/series metadata and poster fallback from TMDB
                  </p>
                </div>
                <Switch
                  checked={settings.tmdbEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, tmdbEnabled: checked }))
                  }
                />
              </div>

              {settings.tmdbEnabled && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="tmdb-token">API Read Access Token (v4)</Label>
                    <Input
                      id="tmdb-token"
                      type="text"
                      placeholder="eyJhbGciOiJIUzI1NiJ9..."
                      value={settings.tmdbBearerToken}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, tmdbBearerToken: e.target.value }))
                      }
                      className="border-white/20 bg-transparent text-white placeholder:text-white/40 font-mono text-sm"
                    />
                    <p className="text-xs text-white/50">
                      Get your token from{" "}
                      <a
                        href="https://www.themoviedb.org/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E50914] hover:underline"
                      >
                        TMDB API Settings
                      </a>
                    </p>
                  </div>

                  {/* Test Connection Button */}
                  <div className="flex justify-end py-4 border-t border-white/10">
                    <Button
                      onClick={handleTestTMDB}
                      disabled={isTestingTMDB || !settings.tmdbBearerToken}
                      variant="outline"
                      size="sm"
                      className="border-[#E50914]/50 bg-[#E50914]/10 hover:bg-[#E50914]/20 text-white"
                    >
                      <Play className={`h-3 w-3 mr-2 ${isTestingTMDB ? "animate-pulse" : ""}`} />
                      {isTestingTMDB ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* YouTube */}
            <section className="p-6 border border-white/10 rounded-lg bg-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl mb-1">YouTube Integration</h2>
                  <p className="text-white/60 text-sm">
                    Enable YouTube video search and playback
                  </p>
                </div>
                <Switch
                  checked={settings.youtubeEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, youtubeEnabled: checked }))
                  }
                />
              </div>

              {settings.youtubeEnabled && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-key">YouTube Data API v3 Key</Label>
                    <Input
                      id="youtube-key"
                      type="password"
                      placeholder="AIzaSy..."
                      value={settings.youtubeApiKey}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, youtubeApiKey: e.target.value }))
                      }
                      className="border-white/20 bg-transparent text-white placeholder:text-white/40 font-mono text-sm"
                    />
                    <p className="text-xs text-white/50">
                      Get your API key from{" "}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E50914] hover:underline"
                      >
                        Google Cloud Console
                      </a>
                    </p>
                  </div>

                  {/* Test Connection Button */}
                  <div className="flex justify-end py-4 border-t border-white/10">
                    <Button
                      onClick={handleTestYouTube}
                      disabled={isTestingYouTube || !settings.youtubeApiKey}
                      variant="outline"
                      size="sm"
                      className="border-[#E50914]/50 bg-[#E50914]/10 hover:bg-[#E50914]/20 text-white"
                    >
                      <Play className={`h-3 w-3 mr-2 ${isTestingYouTube ? "animate-pulse" : ""}`} />
                      {isTestingYouTube ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* UI Preferences */}
            <section className="p-6 border border-white/10 rounded-lg bg-white/5 space-y-6">
              <div>
                <h2 className="text-xl mb-1">UI Preferences</h2>
                <p className="text-white/60 text-sm">Customize the application appearance and visible sections</p>
              </div>

              <div className="space-y-0 divide-y divide-white/10">
                {/* Show Logo */}
                <div className="flex items-center justify-between py-4 first:pt-0">
                  <div>
                    <Label>Show Logo</Label>
                    <p className="text-sm text-white/60 mt-1">Display the Kedi logo in the top bar</p>
                  </div>
                  <Switch
                    checked={settings.showLogo}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, showLogo: checked }))
                    }
                  />
                </div>

                {/* Show Home */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <Label>Show Home</Label>
                    <p className="text-sm text-white/60 mt-1">Display Home section in navigation</p>
                  </div>
                  <Switch
                    checked={settings.showHome}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, showHome: checked }))
                    }
                  />
                </div>

                {/* Show Series */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <Label>Show Series</Label>
                    <p className="text-sm text-white/60 mt-1">Display Series section in navigation</p>
                  </div>
                  <Switch
                    checked={settings.showSeries}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, showSeries: checked }))
                    }
                  />
                </div>

                {/* Show Movies */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <Label>Show Movies</Label>
                    <p className="text-sm text-white/60 mt-1">Display Movies section in navigation</p>
                  </div>
                  <Switch
                    checked={settings.showMovies}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, showMovies: checked }))
                    }
                  />
                </div>

                {/* Show Live */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <Label>Show Live</Label>
                    <p className="text-sm text-white/60 mt-1">Display Live TV section in navigation</p>
                  </div>
                  <Switch
                    checked={settings.showLive}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, showLive: checked }))
                    }
                  />
                </div>

                {/* Show Radio */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <Label>Show Radio</Label>
                    <p className="text-sm text-white/60 mt-1">Display Radio section in navigation</p>
                  </div>
                  <Switch
                    checked={settings.showRadio}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, showRadio: checked }))
                    }
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Save reminder at bottom */}
          {hasChanges && (
            <div className="mt-8 p-4 bg-[#E50914]/20 border border-[#E50914]/50 rounded-lg flex items-center justify-between">
              <p className="text-sm">You have unsaved changes</p>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-[#E50914] hover:bg-[#E50914]/90"
              >
                <Check className="h-3 w-3 mr-2" />
                Save Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
