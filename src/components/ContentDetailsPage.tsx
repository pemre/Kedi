import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Star, Calendar, TrendingUp, Users, ChevronRight, Play, Download, Plus, Check } from "lucide-react";
import { ContentItem, WatchHistoryItem } from "../types/content";
import { GroupedSeries, getSortedSeasons } from "../utils/seriesGrouping";
import { getFullSeriesInfo, getFullMovieInfo, getTmdbImageUrl, formatRating, formatDate, TmdbSeriesInfo, TmdbSeriesCredits, TmdbMovieInfo, TmdbMovieCredits } from "../utils/tmdbSeries";
import { loadWatchHistory } from "../utils/watchHistory";
import { getFileSize, formatFileSize, downloadFile, generateFilename } from "../utils/fileDownload";
import { Button } from "./ui/button";
import { ContentRow } from "./ContentRow";
import { MovieCard } from "./MovieCard";
import { toast } from "sonner";
import { DownloadProgressToast } from "./DownloadProgressToast";
import { FileDownloadProgress } from "../types/electron";

interface ContentDetailsPageProps {
  item: ContentItem;
  group?: GroupedSeries; // Only for series
  onPlay: (item: ContentItem) => void;
  onDetailsClick: (item: ContentItem) => void;
  onItemHover?: (item: ContentItem | null) => void;
  onToggleMyList: (item: ContentItem) => void;
  isItemInMyList: (itemUrl: string) => boolean;
  onBack: () => void;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function ContentDetailsPage({
  item,
  group,
  onPlay,
  onDetailsClick,
  onItemHover,
  onToggleMyList,
  isItemInMyList,
  onBack
}: ContentDetailsPageProps) {
  const [tmdbInfo, setTmdbInfo] = useState<
    | { type: 'series'; details: TmdbSeriesInfo; credits: TmdbSeriesCredits }
    | { type: 'movie'; details: TmdbMovieInfo; credits: TmdbMovieCredits }
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [fileSize, setFileSize] = useState<number | null | 'loading' | 'error'>('loading');

  const isSeries = item.type === "Series";
  const isLiveStream = item.media === "Live";
  const sortedSeasons = isSeries && group ? getSortedSeasons(group) : [];

  // Check if item is in my list
  const isInMyList = isItemInMyList(item.url);

  // Load watch history on mount
  useEffect(() => {
    setWatchHistory(loadWatchHistory());
  }, []);

  // Refresh watch history periodically when component is visible
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchHistory(loadWatchHistory());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Load TMDB data
  useEffect(() => {
    const loadTmdbData = async () => {
      setLoading(true);

      if (isSeries) {
        const seriesName = group?.representative.name || item.name;
        const info = await getFullSeriesInfo(seriesName);
        if (info) {
          setTmdbInfo({ type: 'series', ...info });
        }
      } else {
        const movieName = item.name;
        const year = item.year;
        const info = await getFullMovieInfo(movieName, year);
        if (info) {
          setTmdbInfo({ type: 'movie', ...info });
        }
      }

      setLoading(false);
    };

    loadTmdbData();
  }, [item.name, item.year, isSeries, group]);

  // Load file size (only for non-live streams)
  useEffect(() => {
    if (isLiveStream) {
      setFileSize(null);
      return;
    }

    const loadFileSize = async () => {
      setFileSize('loading');
      const size = await getFileSize(item.url);
      setFileSize(size === null ? 'error' : size);
    };

    loadFileSize();
  }, [item.url, isLiveStream]);

  // Handle download
  const handleDownload = () => {
    const filename = generateFilename(item.name, item.year, item.season, item.episode);

    // Show initial toast
    let toastId: string | number | undefined;
    let downloadControls: { pause: () => void; resume: () => void; cancel: () => void } | null = null;

    const controls = downloadFile(item.url, filename, (progress: FileDownloadProgress) => {
      // Update or create toast with progress
      if (!toastId) {
        toastId = toast(
          <DownloadProgressToast
            progress={progress}
            onPause={() => downloadControls?.pause()}
            onResume={() => downloadControls?.resume()}
            onCancel={() => {
              downloadControls?.cancel();
              if (toastId) toast.dismiss(toastId);
            }}
          />,
          {
            duration: progress.status === 'downloading' || progress.status === 'paused' ? Infinity : 3000,
          }
        );
      } else {
        toast(
          <DownloadProgressToast
            progress={progress}
            onPause={() => downloadControls?.pause()}
            onResume={() => downloadControls?.resume()}
            onCancel={() => {
              downloadControls?.cancel();
              if (toastId) toast.dismiss(toastId);
            }}
          />,
          {
            id: toastId,
            duration: progress.status === 'downloading' || progress.status === 'paused' ? Infinity : 3000,
          }
        );
      }

      // Dismiss toast after completion, error, or cancel
      if (progress.status === 'complete' || progress.status === 'error' || progress.status === 'canceled') {
        setTimeout(() => {
          if (toastId) toast.dismiss(toastId);
        }, 3000);
      }
    });

    if (controls) {
      downloadControls = controls;
    }
  };

  // Get top 5 cast members
  const topCast = tmdbInfo?.credits.cast.slice(0, 5) || [];

  // Get backdrop and poster paths
  const backdropPath = tmdbInfo?.details.backdrop_path;
  const posterPath = tmdbInfo?.details.poster_path;

  // Get title and tagline based on type
  const title = tmdbInfo?.type === 'series'
    ? (tmdbInfo.details as TmdbSeriesInfo).name
    : tmdbInfo?.type === 'movie'
    ? (tmdbInfo.details as TmdbMovieInfo).title
    : item.name;

  const tagline = tmdbInfo?.details.tagline;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Background Gradient */}
      {backdropPath && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${getTmdbImageUrl(backdropPath, "original")})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 px-6 md:px-12 pb-6 md:pb-12 pt-18 md:pt-32">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E50914] border-t-transparent"></div>
          </div>
        ) : (
          <div className="relative space-y-12">
            {/* Content Header Info */}
            <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
              {/* Poster */}
              {posterPath && (
                <div className="flex justify-center">
                  <img
                    src={getTmdbImageUrl(posterPath, "w500") || ""}
                    alt={title}
                    className="w-1/2 md:w-full max-w-[350px] rounded-lg shadow-2xl"
                  />
                </div>
              )}

              {/* Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="mb-2 text-4xl md:text-5xl">{title}</h1>
                  {tagline && (
                    <p className="text-lg italic text-white/60">{tagline}</p>
                  )}
                </div>

                {/* Stats - Only show if TMDB data is available */}
                {tmdbInfo && (
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      <span className="text-lg">{formatRating(tmdbInfo.details.vote_average)}</span>
                      <span className="text-white/40">({tmdbInfo.details.vote_count.toLocaleString()} votes)</span>
                    </div>

                    {tmdbInfo.type === 'series' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-white/60" />
                          <span>
                            {formatDate((tmdbInfo.details as TmdbSeriesInfo).first_air_date)} - {" "}
                            {(tmdbInfo.details as TmdbSeriesInfo).status === "Ended"
                              ? formatDate((tmdbInfo.details as TmdbSeriesInfo).last_air_date)
                              : "Present"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-white/60" />
                          <span>
                            {(tmdbInfo.details as TmdbSeriesInfo).number_of_seasons} Seasons, {" "}
                            {(tmdbInfo.details as TmdbSeriesInfo).number_of_episodes} Episodes
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-white/60" />
                          <span>{formatDate((tmdbInfo.details as TmdbMovieInfo).release_date)}</span>
                        </div>
                        {(tmdbInfo.details as TmdbMovieInfo).runtime && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-white/60" />
                            <span>{(tmdbInfo.details as TmdbMovieInfo).runtime} min</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Genres */}
                {tmdbInfo && tmdbInfo.details.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tmdbInfo.details.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="rounded-full bg-white/10 px-4 py-1.5 text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons - Always show these */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={onBack}
                    className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  {/* Play Button - Series: Latest Episode, Movie: Play Movie */}
                  {isSeries ? (
                    sortedSeasons.length > 0 && (() => {
                      const latestEpisode = sortedSeasons[0]?.episodes[0];
                      const historyItem = watchHistory.find(h => h.content.url === latestEpisode.url);

                      const seasonEpisode = latestEpisode.season && latestEpisode.episode
                        ? `S${latestEpisode.season.padStart(2, '0')} E${latestEpisode.episode.padStart(2, '0')}`
                        : 'Latest Episode';

                      const label = historyItem
                        ? `${seasonEpisode} (Continue ${formatTime(historyItem.currentTime)})`
                        : seasonEpisode;

                      return (
                        <>
                          <Button
                            onClick={() => onPlay(latestEpisode)}
                            className="border-white/20 bg-[var(--netflix-red)] text-white backdrop-blur-sm hover:bg-[var(--netflix-red)]/80"
                          >
                            <Play className="h-5 w-5" />
                            Play {label}
                          </Button>
                          <Button
                            onClick={() => window.location.href = `vlc://${latestEpisode.url}`}
                            className="border-white/20 bg-[#E85E00] text-white backdrop-blur-sm hover:bg-[#E85E00]/80"
                          >
                            <Play className="h-5 w-5" />
                            Play {label} (VLC)
                          </Button>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <Button
                        onClick={() => onPlay(item)}
                        className="border-white/20 bg-[var(--netflix-red)] text-white backdrop-blur-sm hover:bg-[var(--netflix-red)]/80"
                      >
                        <Play className="h-5 w-5" />
                        Play Movie
                      </Button>
                      <Button
                        onClick={() => window.location.href = `vlc://${item.url}`}
                        className="border-white/20 bg-[#E85E00] text-white backdrop-blur-sm hover:bg-[#E85E00]/80"
                      >
                        <Play className="h-5 w-5" />
                        Play Movie (VLC)
                      </Button>
                    </>
                  )}

                  {/* Add to My List Button */}
                  <Button
                    onClick={() => onToggleMyList(item)}
                    className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  >
                    {isInMyList ? (
                      <>
                        <Check className="h-5 w-5" />
                        In My List
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        Add to My List
                      </>
                    )}
                  </Button>

                  {/* Download Button */}
                  {!isLiveStream && (
                    <Button
                      onClick={handleDownload}
                      disabled={fileSize === 'loading' || fileSize === 'error'}
                      className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-5 w-5" />
                      {fileSize === 'loading'
                        ? 'Loading...'
                        : fileSize === 'error'
                        ? 'Size Unknown'
                        : `Download ${typeof fileSize === 'number' ? `(${formatFileSize(fileSize)})` : ''}`
                      }
                    </Button>
                  )}
                </div>

                <div className="text-sm text-white/60">
                    Download directly: <a
                        href={item.url}
                        download
                        className="underline hover:text-white"
                    >
                        {item.url}
                    </a>
                </div>

                {/* Overview */}
                {tmdbInfo && tmdbInfo.details.overview && (
                  <p className="text-lg leading-relaxed text-white/80">{tmdbInfo.details.overview}</p>
                )}

                {/* Show fallback message if no TMDB data */}
                {!tmdbInfo && (
                  <div className="rounded-lg bg-white/5 p-4 text-white/60">
                    <p>Additional details are not available for this content, but you can still play it above.</p>
                  </div>
                )}

                {/* Cast */}
                {topCast.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-white/60">
                      <Users className="h-5 w-5" />
                      <span className="text-sm">Starring</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {topCast.map((actor, index) => (
                        <div key={actor.id} className="text-sm">
                          <span className="text-white/90">{actor.name}</span>
                          {index < topCast.length - 1 && <span className="text-white/40">,</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Networks/Production Companies */}
                {tmdbInfo && tmdbInfo.type === 'series' && (tmdbInfo.details as TmdbSeriesInfo).networks.length > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-white/60">Available on:</span>
                    <div className="flex items-center gap-3">
                      {(tmdbInfo.details as TmdbSeriesInfo).networks.map((network) => (
                        <span key={network.id} className="text-sm text-white/80">
                          {network.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tmdbInfo && tmdbInfo.type === 'movie' && (tmdbInfo.details as TmdbMovieInfo).production_companies.length > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-white/60">Production:</span>
                    <div className="flex items-center gap-3">
                      {(tmdbInfo.details as TmdbMovieInfo).production_companies.slice(0, 3).map((company) => (
                        <span key={company.id} className="text-sm text-white/80">
                          {company.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seasons & Episodes - Only for Series */}
            {isSeries && sortedSeasons.length > 0 && (
              <div className="space-y-8">
                <h2 className="flex items-center gap-2 text-2xl md:text-3xl">
                  <ChevronRight className="h-6 w-6 text-[var(--netflix-red)]" />
                  All Seasons & Episodes
                </h2>

                {sortedSeasons.map(({ season, episodes }) => (
                  <ContentRow key={season} title={`Season ${season}`}>
                    {episodes.map((episode) => (
                      <MovieCard
                        key={episode.id}
                        item={episode}
                        variant="episode"
                        onPlay={onPlay}
                        onHover={onItemHover}
                      />
                    ))}
                  </ContentRow>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
