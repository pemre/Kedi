/**
 * TMDB Series Information System
 * 
 * Fetches detailed information about TV series from TMDB API
 * Features:
 * - 30-day localStorage caching
 * - Bearer token authentication
 * - Season and episode details
 */

import { loadSettings } from "./settings";

// TMDB Bearer Token (v4 API Read Access Token) - loaded from settings
const getTMDBBearerToken = () => {
  const settings = loadSettings();
  return settings.tmdbBearerToken || "";
};
const CACHE_PREFIX_SERIES = "tmdb-series-";
const CACHE_PREFIX_MOVIE = "tmdb-movie-";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export interface TmdbSeriesInfo {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  tagline: string;
  created_by: Array<{ id: number; name: string }>;
  networks: Array<{ id: number; name: string; logo_path: string | null }>;
  seasons: Array<{
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
  }>;
}

export interface TmdbSeriesCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
}

export interface TmdbMovieInfo {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number | null;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
}

export interface TmdbMovieCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
}

interface CachedData<T> {
  timestamp: number;
  data: T;
}

/**
 * Fetch JSON with localStorage caching and Bearer token authentication
 */
async function fetchWithCache<T>(url: string, cacheKey: string, ttlMs: number = THIRTY_DAYS): Promise<T> {
  const now = Date.now();
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached) as CachedData<T>;
      if (now - timestamp < ttlMs) {
        console.log(`📦 Using cached data for: ${cacheKey}`);
        return data;
      } else {
        // Cache expired
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (e) {
    console.error("Cache read error:", e);
  }
  
  console.log(`🌐 Fetching from TMDB: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getTMDBBearerToken()}`,
      'accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`TMDB API error (${response.status}):`, errorText);
    throw new Error(`TMDB API error: ${response.status}`);
  }
  
  const data = await response.json();

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data }));
    console.log(`💾 Cached data for: ${cacheKey}`);
  } catch (e) {
    console.error("Cache write error:", e);
  }
  
  return data;
}

/**
 * Search for a TV series by name
 */
export async function searchSeries(query: string, language: string = "tr-TR"): Promise<{ id: number } | null> {
  const url = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&language=${encodeURIComponent(language)}&include_adult=false`;
  const cacheKey = `${CACHE_PREFIX_SERIES}search-${query}-${language}`;

  try {
    const data = await fetchWithCache<{ results: Array<{ id: number }> }>(url, cacheKey, THIRTY_DAYS);
    return data?.results?.[0] || null;
  } catch (e) {
    console.error("Series search error:", e);
    return null;
  }
}

/**
 * Get detailed information about a TV series by TMDB ID
 */
export async function getSeriesDetails(tmdbId: number, language: string = "tr-TR"): Promise<TmdbSeriesInfo | null> {
  const url = `https://api.themoviedb.org/3/tv/${tmdbId}?language=${encodeURIComponent(language)}`;
  const cacheKey = `${CACHE_PREFIX_SERIES}details-${tmdbId}-${language}`;

  try {
    return await fetchWithCache<TmdbSeriesInfo>(url, cacheKey, THIRTY_DAYS);
  } catch (e) {
    console.error("Series details error:", e);
    return null;
  }
}

/**
 * Get cast and crew information for a TV series
 */
export async function getSeriesCredits(tmdbId: number): Promise<TmdbSeriesCredits | null> {
  const url = `https://api.themoviedb.org/3/tv/${tmdbId}/credits`;
  const cacheKey = `${CACHE_PREFIX_SERIES}credits-${tmdbId}`;

  try {
    return await fetchWithCache<TmdbSeriesCredits>(url, cacheKey, THIRTY_DAYS);
  } catch (e) {
    console.error("Series credits error:", e);
    return null;
  }
}

/**
 * Get full series information including details and credits
 */
export async function getFullSeriesInfo(
  seriesName: string, 
  language: string = "tr-TR"
): Promise<{ details: TmdbSeriesInfo; credits: TmdbSeriesCredits } | null> {
  try {
    // First, search for the series
    const searchResult = await searchSeries(seriesName, language);
    if (!searchResult) {
      // Try English if Turkish search fails
      if (language !== "en-US") {
        return getFullSeriesInfo(seriesName, "en-US");
      }
      console.error(`Series not found: ${seriesName}`);
      return null;
    }
    
    // Fetch details and credits in parallel
    const [details, credits] = await Promise.all([
      getSeriesDetails(searchResult.id, language),
      getSeriesCredits(searchResult.id)
    ]);
    
    if (!details || !credits) {
      console.error(`Failed to fetch complete info for: ${seriesName}`);
      return null;
    }
    
    return { details, credits };
  } catch (e) {
    console.error("Error fetching full series info:", e);
    return null;
  }
}

/**
 * Search for a movie by name
 */
export async function searchMovie(query: string, year: string | null = null, language: string = "tr-TR"): Promise<{ id: number } | null> {
  let url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=${encodeURIComponent(language)}&include_adult=false`;
  if (year) {
    url += `&year=${encodeURIComponent(year)}`;
  }
  const cacheKey = `${CACHE_PREFIX_MOVIE}search-${query}-${year || 'no-year'}-${language}`;

  try {
    const data = await fetchWithCache<{ results: Array<{ id: number }> }>(url, cacheKey, THIRTY_DAYS);
    return data?.results?.[0] || null;
  } catch (e) {
    console.error("Movie search error:", e);
    return null;
  }
}

/**
 * Get detailed information about a movie by TMDB ID
 */
export async function getMovieDetails(tmdbId: number, language: string = "tr-TR"): Promise<TmdbMovieInfo | null> {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?language=${encodeURIComponent(language)}`;
  const cacheKey = `${CACHE_PREFIX_MOVIE}details-${tmdbId}-${language}`;

  try {
    return await fetchWithCache<TmdbMovieInfo>(url, cacheKey, THIRTY_DAYS);
  } catch (e) {
    console.error("Movie details error:", e);
    return null;
  }
}

/**
 * Get cast and crew information for a movie
 */
export async function getMovieCredits(tmdbId: number): Promise<TmdbMovieCredits | null> {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}/credits`;
  const cacheKey = `${CACHE_PREFIX_MOVIE}credits-${tmdbId}`;

  try {
    return await fetchWithCache<TmdbMovieCredits>(url, cacheKey, THIRTY_DAYS);
  } catch (e) {
    console.error("Movie credits error:", e);
    return null;
  }
}

/**
 * Get full movie information including details and credits
 */
export async function getFullMovieInfo(
  movieName: string,
  year: string | null = null,
  language: string = "tr-TR"
): Promise<{ details: TmdbMovieInfo; credits: TmdbMovieCredits } | null> {
  try {
    // First, search for the movie
    const searchResult = await searchMovie(movieName, year, language);
    if (!searchResult) {
      // Try English if Turkish search fails
      if (language !== "en-US") {
        return getFullMovieInfo(movieName, year, "en-US");
      }
      console.error(`Movie not found: ${movieName}`);
      return null;
    }

    // Fetch details and credits in parallel
    const [details, credits] = await Promise.all([
      getMovieDetails(searchResult.id, language),
      getMovieCredits(searchResult.id)
    ]);

    if (!details || !credits) {
      console.error(`Failed to fetch complete info for: ${movieName}`);
      return null;
    }

    return { details, credits };
  } catch (e) {
    console.error("Error fetching full movie info:", e);
    return null;
  }
}

/**
 * Get TMDB image URL
 */
export function getTmdbImageUrl(path: string | null, size: string = "w500"): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

/**
 * Format vote average as percentage
 */
export function formatRating(voteAverage: number): string {
  return `${Math.round(voteAverage * 10)}%`;
}

/**
 * Format date string
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
