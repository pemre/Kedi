import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { loadSettings } from "../utils/settings";

const YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumb: string;
  description: string;
}

interface YouTubePageProps {
  onSettingsClick?: () => void;
}

export function YouTubePage({ onSettingsClick }: YouTubePageProps) {
  const settings = loadSettings();
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [selected, setSelected] = useState<YouTubeVideo | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const prevStack = useRef<string[]>([]);

  const canSearch = useMemo(() => q.trim().length > 0, [q]);

  async function search({ pageToken, reset = false }: { pageToken?: string; reset?: boolean } = {}) {
    if (!canSearch) return;
    
    if (!settings.youtubeEnabled || !settings.youtubeApiKey) {
      setError("YouTube is not enabled or API key is missing. Please configure it in Settings.");
      return;
    }
    
    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({
      key: settings.youtubeApiKey,
      part: "snippet",
      type: "video",
      q: q.trim(),
      maxResults: "12",
    });

    if (pageToken) params.set("pageToken", pageToken);

    try {
      const res = await fetch(`${YT_SEARCH_URL}?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Manage page tokens
      if (reset) {
        prevStack.current = [];
      } else if (pageToken) {
        prevStack.current.push(pageToken);
      }

      setNextPageToken(data.nextPageToken || null);

      const items = (data.items || []).map((it: any) => ({
        id: it.id.videoId,
        title: it.snippet.title,
        channel: it.snippet.channelTitle,
        publishedAt: it.snippet.publishedAt,
        thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url,
        description: it.snippet.description,
      }));

      setResults(items);
      if (items.length > 0) setSelected(items[0]);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    search({ reset: true });
  }

  function nextPage() {
    if (nextPageToken) search({ pageToken: nextPageToken });
  }

  async function prevPage() {
    if (prevStack.current.length === 0) return;
    
    if (!settings.youtubeEnabled || !settings.youtubeApiKey) {
      setError("YouTube is not enabled or API key is missing. Please configure it in Settings.");
      return;
    }

    const tokensCopy = [...prevStack.current];
    tokensCopy.pop();

    setIsLoading(true);
    setError("");

    try {
      const baseParams = new URLSearchParams({
        key: settings.youtubeApiKey,
        part: "snippet",
        type: "video",
        q: q.trim(),
        maxResults: "12",
      });

      let data = null;
      let res = await fetch(`${YT_SEARCH_URL}?${baseParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();

      for (const tok of tokensCopy) {
        baseParams.set("pageToken", tok);
        res = await fetch(`${YT_SEARCH_URL}?${baseParams.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      }

      prevStack.current = tokensCopy;
      setNextPageToken(data.nextPageToken || null);

      const items = (data.items || []).map((it: any) => ({
        id: it.id.videoId,
        title: it.snippet.title,
        channel: it.snippet.channelTitle,
        publishedAt: it.snippet.publishedAt,
        thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url,
        description: it.snippet.description,
      }));

      setResults(items);
      if (items.length > 0) setSelected(items[0]);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  }

  const debounced = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (!q) return;
    if (debounced.current) clearTimeout(debounced.current);
    debounced.current = setTimeout(() => {
      search({ reset: true });
    }, 400);
    return () => clearTimeout(debounced.current);
  }, [q]);

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 to-black pointer-events-none" />
      
      {/* Main content */}
      <div className="relative pt-48 px-12 pb-24">
        <div className="flex gap-8">
          {/* Left Sidebar - Search Panel (FilterSidebar style) */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-24 h-fit space-y-6 rounded-lg border border-white/10 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">YouTube Search</h3>
              </div>

              <div className="space-y-4">
                {/* Search Input */}
                <div>
                  <label className="mb-2 block text-sm text-white/70">Search Videos</label>
                  <form onSubmit={onSubmit}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                      <Input
                        type="text"
                        placeholder="Search YouTube..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="border-white/20 bg-transparent pl-10 text-white placeholder:text-white/40 backdrop-blur-sm hover:bg-white/5 focus:bg-white/5"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!canSearch || isLoading}
                      className="w-full mt-3 bg-[#E50914] hover:bg-[#E50914]/90 text-white disabled:opacity-50"
                    >
                      {isLoading ? "Searching..." : "Search"}
                    </Button>
                  </form>
                </div>

                {/* Info */}
                <div className="text-xs text-white/50 space-y-2">
                  {!settings.youtubeEnabled || !settings.youtubeApiKey ? (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                      <p className="text-yellow-200 mb-2">YouTube is not configured</p>
                      {onSettingsClick && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onSettingsClick}
                          className="w-full border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20"
                        >
                          <Settings className="h-3 w-3 mr-2" />
                          Configure in Settings
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <p>Enter your search query above and press Enter or click Search to find videos.</p>
                      {results.length > 0 && (
                        <p className="text-white/70">
                          Found {results.length} results
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Pagination Controls */}
                {results.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={prevPage}
                      disabled={prevStack.current.length === 0 || isLoading}
                      className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      onClick={nextPage}
                      disabled={!nextPageToken || isLoading}
                      className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-30"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Video Player and Results Grid */}
          <div className="flex-1 space-y-8">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* Selected Video Player */}
            {selected && (
              <div className="rounded-lg overflow-hidden shadow-2xl border border-white/10">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    title={selected.title}
                    src={`https://www.youtube.com/embed/${selected.id}?autoplay=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="p-6 bg-zinc-900/50 border-t border-white/10">
                  <h2 className="text-xl mb-2">{selected.title}</h2>
                  <p className="text-sm text-white/70">{selected.channel}</p>
                  {selected.description && (
                    <p className="text-sm text-white/60 mt-3 line-clamp-3">{selected.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* No selection state */}
            {!selected && results.length === 0 && !isLoading && (
              <div className="text-center py-24 text-white/40">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Search for videos to get started</p>
              </div>
            )}

            {/* Results Grid - 3 columns */}
            {results.length > 0 && (
              <div>
                <h3 className="text-xl mb-6">Search Results</h3>
                <div className="grid grid-cols-3 gap-6">
                  {results.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setSelected(video)}
                      className={`group relative aspect-video rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:z-10 ${
                        selected?.id === video.id 
                          ? "ring-2 ring-[#E50914] shadow-xl shadow-[#E50914]/20" 
                          : "ring-1 ring-white/10"
                      }`}
                    >
                      {/* Thumbnail */}
                      <img
                        src={video.thumb}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h4 className="text-sm font-medium line-clamp-2 mb-1">
                            {video.title}
                          </h4>
                          <p className="text-xs text-white/70 line-clamp-1">
                            {video.channel}
                          </p>
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {selected?.id === video.id && (
                        <div className="absolute top-2 right-2 bg-[#E50914] text-white text-xs px-2 py-1 rounded">
                          Playing
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="text-center py-24">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#E50914] border-r-transparent"></div>
                <p className="mt-4 text-white/60">Searching...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
