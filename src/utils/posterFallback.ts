/**
 * TMDB Poster Fallback System - Simplified Approach
 * 
 * Priority order:
 * 1. Check cache (15 days TTL)
 * 2. Try TMDB API
 * 3. Try original item.logo
 * 4. Show "No Poster" placeholder
 * 
 * Result is cached for 15 days regardless of source (TMDB/logo/placeholder)
 */

// TMDB Bearer Token (v4 API Read Access Token)
const TMDB_BEARER_TOKEN = "YOUR_TMDB_BEARER_TOKEN";
const CACHE_NAME = "poster-cache-v1";
const LS_PREFIX = "tmdb-cache-";
const POSTER_RESULT_CACHE_PREFIX = "poster-result-";
const ONE_DAY = 24 * 60 * 60 * 1000;
const FIFTEEN_DAYS = 15 * ONE_DAY;

const LANG_PRIORITY = ["tr", "en", ""]; // Try Turkish first, then English, then any

interface TmdbConfig {
  images: {
    secure_base_url: string;
    poster_sizes: string[];
  };
}

interface TmdbSearchResult {
  id: number;
  poster_path?: string;
  backdrop_path?: string;
}

interface TmdbImages {
  posters?: Array<{
    file_path: string;
    iso_639_1?: string;
    vote_average?: number;
  }>;
}

export interface PosterResult {
  url: string;
  source: "tmdb" | "logo" | "placeholder";
  meta?: {
    tmdbId?: number;
    language?: string;
    size?: string;
  };
}

/**
 * Fetch JSON with localStorage caching and Bearer token authentication
 */
async function getJsonCached(url: string, ttlMs: number = ONE_DAY): Promise<any> {
  const lsKey = LS_PREFIX + url;
  const now = Date.now();
  
  try {
    const cached = localStorage.getItem(lsKey);
    if (cached) {
      const { t, v } = JSON.parse(cached);
      if (now - t < ttlMs) {
        return v;
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TMDB_BEARER_TOKEN}`,
      'accept': 'application/json'
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`TMDB API error (${res.status}):`, errorText);
    throw new Error(`TMDB API error: ${res.status}`);
  }
  
  const data = await res.json();
  
  try {
    localStorage.setItem(lsKey, JSON.stringify({ t: now, v: data }));
  } catch (e) {
    // localStorage might be full, continue without caching
  }
  
  return data;
}

/**
 * Get TMDB configuration (base URL and available sizes)
 */
async function getTmdbConfig(): Promise<TmdbConfig> {
  const url = 'https://api.themoviedb.org/3/configuration';
  return getJsonCached(url, 7 * ONE_DAY); // Config changes rarely
}

/**
 * Search for a title on TMDB
 */
async function searchTitle(
  query: string,
  type: "tv" | "movie" = "tv",
  language: string = "tr-TR"
): Promise<TmdbSearchResult | null> {
  const url = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(
    query
  )}&language=${encodeURIComponent(language)}&include_adult=false`;
  
  const data = await getJsonCached(url, ONE_DAY);
  return data?.results?.[0] || null;
}

/**
 * Pick the best poster based on language priority and vote average
 */
function pickBestPoster(images: TmdbImages, prefer: string[] = LANG_PRIORITY) {
  if (!images?.posters?.length) return null;
  
  const posters = images.posters.slice().sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  
  for (const lang of prefer) {
    const hit = posters.find(p => (p.iso_639_1 || "") === lang);
    if (hit) return hit;
  }
  
  return posters[0];
}

/**
 * Get all available images for a TMDB ID
 */
async function getImagesFor(id: number, type: "tv" | "movie" = "tv"): Promise<TmdbImages> {
  const url = `https://api.themoviedb.org/3/${type}/${id}/images?include_image_language=tr,en,null`;
  return getJsonCached(url, ONE_DAY);
}

/**
 * Fetch and cache image using Cache Storage API
 */
async function cacheFetch(requestUrl: string): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(requestUrl);
  
  if (cached) return cached;
  
  const res = await fetch(requestUrl, { mode: "cors", cache: "no-store" });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  
  await cache.put(requestUrl, res.clone());
  return res;
}

/**
 * Try to fetch poster from TMDB
 */
async function tryTmdb(title: string, type: "tv" | "movie"): Promise<string | null> {
  try {
    console.log(`🎬 Trying TMDB for "${title}" (${type})`);
    
    const cfg = await getTmdbConfig();
    const base = cfg?.images?.secure_base_url || "https://image.tmdb.org/t/p/";
    const size = (cfg?.images?.poster_sizes || []).includes("w500") 
      ? "w500" 
      : (cfg?.images?.poster_sizes?.[0] || "w500");
    
    // Try Turkish search first, then English
    let hit = await searchTitle(title, type, "tr-TR");
    if (!hit) hit = await searchTitle(title, type, "en-US");
    if (!hit) {
      console.log(`❌ TMDB: Title not found`);
      return null;
    }
    
    console.log(`✅ Found TMDB ID: ${hit.id}`);
    
    const images = await getImagesFor(hit.id, type);
    const chosen = pickBestPoster(images);
    
    if (!chosen?.file_path) {
      console.log(`❌ TMDB: No posters found`);
      return null;
    }
    
    const cdnUrl = `${base}${size}${chosen.file_path}`;
    console.log(`🖼️ TMDB poster: ${cdnUrl} (${chosen.iso_639_1 || "no lang"})`);
    
    // Cache the image
    await cacheFetch(cdnUrl);
    
    return cdnUrl;
  } catch (error) {
    console.error(`❌ TMDB fetch failed:`, error);
    return null;
  }
}

/**
 * Try to load the original logo URL
 */
async function tryLogo(logoUrl: string): Promise<string | null> {
  try {
    console.log(`📷 Trying original logo URL`);
    
    const res = await fetch(logoUrl, { method: 'HEAD', mode: 'no-cors' });
    // With no-cors, we can't check status, so we'll just try to cache it
    await cacheFetch(logoUrl);
    
    console.log(`✅ Logo URL works`);
    return logoUrl;
  } catch (error) {
    console.log(`❌ Logo URL failed:`, error);
    return null;
  }
}

/**
 * Generate cache key for poster result
 * Uses Unicode-safe encoding for titles with special characters
 */
function getPosterCacheKey(originalUrl: string, title: string, type: "tv" | "movie"): string {
  // Create a simple hash from the URL and title to avoid btoa Unicode issues
  const combined = originalUrl + title;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to base36 for a shorter, URL-safe string
  const hashStr = Math.abs(hash).toString(36);
  return `${POSTER_RESULT_CACHE_PREFIX}${hashStr}-${type}`;
}

/**
 * Get cached poster result
 */
function getCachedPosterResult(originalUrl: string, title: string, type: "tv" | "movie"): PosterResult | null {
  const cacheKey = getPosterCacheKey(originalUrl, title, type);
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { t, result } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - t < FIFTEEN_DAYS) {
        console.log(`✨ Using cached result (${result.source}) for "${title}"`);
        return result;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (e) {
    console.error("Error reading poster cache:", e);
  }
  
  return null;
}

/**
 * Save poster result to cache
 */
function savePosterResultToCache(
  originalUrl: string, 
  title: string, 
  type: "tv" | "movie", 
  result: PosterResult
): void {
  const cacheKey = getPosterCacheKey(originalUrl, title, type);
  const now = Date.now();
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ t: now, result }));
    console.log(`💾 Cached poster result (${result.source}) for "${title}" (15 days)`);
  } catch (e) {
    console.error("Error saving poster cache:", e);
  }
}

/**
 * Check if TMDB API is configured
 */
export function isTmdbConfigured(): boolean {
  return TMDB_BEARER_TOKEN !== "YOUR_TMDB_BEARER_TOKEN";
}

/**
 * Get poster URL using simplified priority system
 * 
 * Priority: Cache > TMDB > Logo > Placeholder
 * All results are cached for 15 days
 */
export async function getPosterUrl(
  originalUrl: string,
  title: string,
  type: "tv" | "movie"
): Promise<PosterResult> {
  // 1. Check cache first
  const cached = getCachedPosterResult(originalUrl, title, type);
  if (cached) {
    return cached;
  }

  let result: PosterResult;

  // 2. Try TMDB (if configured)
  if (isTmdbConfigured()) {
    const tmdbUrl = await tryTmdb(title, type);
    if (tmdbUrl) {
      result = {
        url: tmdbUrl,
        source: "tmdb",
        meta: { size: "w500" }
      };
      savePosterResultToCache(originalUrl, title, type, result);
      return result;
    }
  } else {
    console.log(`⚠️ TMDB not configured, skipping`);
  }

  // 3. Try original logo
  const logoUrl = await tryLogo(originalUrl);
  if (logoUrl) {
    result = {
      url: logoUrl,
      source: "logo"
    };
    savePosterResultToCache(originalUrl, title, type, result);
    return result;
  }

  // 4. Use placeholder
  result = {
    url: "",
    source: "placeholder"
  };
  savePosterResultToCache(originalUrl, title, type, result);
  return result;
}
