import { useState, useEffect } from "react";
import { getPosterUrl } from "../utils/posterFallback";

interface PosterImageProps {
  src: string;
  alt: string;
  title: string;
  type: "tv" | "movie";
  className?: string;
  fallbackClassName?: string;
}

/**
 * Image component with TMDB-first poster fallback
 * 
 * Priority order:
 * 1. Check cache (15 days TTL)
 * 2. Try TMDB API
 * 3. Try original src (item.logo)
 * 4. Show "No Poster" placeholder
 * 
 * All results are cached for 15 days
 */
export function PosterImage({
  src,
  alt,
  title,
  type,
  className = "",
  fallbackClassName = ""
}: PosterImageProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPoster = async () => {
      setIsLoading(true);
      setShowPlaceholder(false);

      try {
        const result = await getPosterUrl(src, title, type);

        if (!mounted) return;

        if (result.source === "placeholder") {
          setShowPlaceholder(true);
          setPosterUrl(null);
        } else {
          setPosterUrl(result.url);
          setShowPlaceholder(false);
        }
      } catch (error) {
        console.error(`Failed to load poster for "${title}":`, error);
        if (mounted) {
          setShowPlaceholder(true);
          setPosterUrl(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPoster();

    return () => {
      mounted = false;
    };
  }, [src, title, type]);

  if (isLoading) {
    // Show loading spinner
    return (
      <div className={`animate-pulse bg-gradient-to-br from-zinc-800 to-zinc-900 ${className}`}>
        <div className="flex h-full items-center justify-center">
          <svg
            className="h-8 w-8 animate-spin text-zinc-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (showPlaceholder) {
    // Show "No Poster" placeholder
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 ${fallbackClassName || className}`}>
        <div className="text-center p-4">
          <svg
            className="mx-auto h-12 w-12 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-xs text-zinc-500">No Poster</p>
        </div>
      </div>
    );
  }

  // Show poster image
  return (
    <img
      src={posterUrl || ""}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
