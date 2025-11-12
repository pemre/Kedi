import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Star, Calendar, TrendingUp, Users, ChevronRight, Play } from "lucide-react";
import { ContentItem, WatchHistoryItem } from "../types/content";
import { GroupedSeries, getSortedSeasons } from "../utils/seriesGrouping";
import { getFullSeriesInfo, getTmdbImageUrl, formatRating, formatDate, TmdbSeriesInfo, TmdbSeriesCredits } from "../utils/tmdbSeries";
import { loadWatchHistory } from "../utils/watchHistory";
import { Button } from "./ui/button";
import { ContentRow } from "./ContentRow";
import { MovieCard } from "./MovieCard";

interface SeriesDetailsPageProps {
  group: GroupedSeries;
  onPlay: (item: ContentItem) => void;
  onItemHover?: (item: ContentItem | null) => void;
  onToggleMyList?: (item: ContentItem) => void;
  isItemInMyList?: (itemUrl: string) => boolean;
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

export function SeriesDetailsPage({
  group,
  onPlay,
  onItemHover,
  onToggleMyList,
  isItemInMyList,
  onBack
}: SeriesDetailsPageProps) {
  const [tmdbInfo, setTmdbInfo] = useState<{ details: TmdbSeriesInfo; credits: TmdbSeriesCredits } | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);

  const sortedSeasons = getSortedSeasons(group);

  // Load watch history on mount
  useEffect(() => {
    setWatchHistory(loadWatchHistory());
  }, []);

  // Refresh watch history periodically when component is visible
  useEffect(() => {
    // Check every 2 seconds for watch history updates
    const interval = setInterval(() => {
      setWatchHistory(loadWatchHistory());
    }, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const loadTmdbData = async () => {
      setLoading(true);
      const seriesName = group.representative.name;
      const info = await getFullSeriesInfo(seriesName);
      setTmdbInfo(info);
      setLoading(false);
    };

    loadTmdbData();
  }, [group.representative.name]);

  // Get top 5 cast members
  const topCast = tmdbInfo?.credits.cast.slice(0, 5) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Background Gradient */}
      {tmdbInfo?.details.backdrop_path && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${getTmdbImageUrl(tmdbInfo.details.backdrop_path, "original")})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 px-12 pb-12 pt-32">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E50914] border-t-transparent"></div>
          </div>
        ) : (
          <div className="relative space-y-12">            
            {/* Series Header Info */}
            {tmdbInfo && (
              <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
                {/* Poster */}
                {tmdbInfo.details.poster_path && (
                  <div className="flex justify-center lg:justify-start">
                    <img
                      src={getTmdbImageUrl(tmdbInfo.details.poster_path, "w500") || ""}
                      alt={tmdbInfo.details.name}
                      className="h-auto w-full max-w-[350px] rounded-lg shadow-2xl"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="space-y-6">
                  <div>
                    <h1 className="mb-2 text-4xl md:text-5xl">{tmdbInfo.details.name}</h1>
                    {tmdbInfo.details.tagline && (
                      <p className="text-lg italic text-white/60">{tmdbInfo.details.tagline}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      <span className="text-lg">{formatRating(tmdbInfo.details.vote_average)}</span>
                      <span className="text-white/40">({tmdbInfo.details.vote_count.toLocaleString()} votes)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-white/60" />
                      <span>{formatDate(tmdbInfo.details.first_air_date)} - {tmdbInfo.details.status === "Ended" ? formatDate(tmdbInfo.details.last_air_date) : "Present"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-white/60" />
                      <span>{tmdbInfo.details.number_of_seasons} Seasons, {tmdbInfo.details.number_of_episodes} Episodes</span>
                    </div>
                  </div>

                  {/* Genres */}
                  {tmdbInfo.details.genres.length > 0 && (
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

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={onBack}
                      className="border-white/20 bg-[var(--netflix-red)] text-white backdrop-blur-sm hover:bg-[var(--netflix-red)]/80"
                    >
                     <ArrowLeft className="h-8 w-8" />
                      Back
                    </Button>

                    {/* Play Button */}
                    {sortedSeasons.length > 0 && (() => {
                      const latestEpisode = sortedSeasons[0]?.episodes[0];
                    
                      // Check if this episode has watch history
                      const historyItem = watchHistory.find(h => h.content.url === latestEpisode.url);
                      
                      const seasonEpisode = latestEpisode.season && latestEpisode.episode
                        ? `S${latestEpisode.season.padStart(2, '0')} E${latestEpisode.episode.padStart(2, '0')}`
                        : 'Latest Episode';
                      
                      const label = historyItem 
                        ? `${seasonEpisode} (Continue ${formatTime(historyItem.currentTime)})`
                        : seasonEpisode;
                    
                      return (
                        <Button
                          onClick={() => onPlay(latestEpisode)}
                          className="border-white/20 bg-[var(--netflix-red)] text-white backdrop-blur-sm hover:bg-[var(--netflix-red)]/80"
                        >
                          <Play className="h-8 w-8" />
                          Play {label}
                        </Button>
                      );
                    })()}
                  </div>

                  {/* Overview */}
                  <p className="text-lg leading-relaxed text-white/80">{tmdbInfo.details.overview}</p>

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

                  {/* Networks */}
                  {tmdbInfo.details.networks.length > 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-white/60">Available on:</span>
                      <div className="flex items-center gap-3">
                        {tmdbInfo.details.networks.map((network) => (
                          <span key={network.id} className="text-sm text-white/80">
                            {network.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seasons & Episodes */}
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
                      onPlay={onPlay}
                      onHover={onItemHover}
                      onToggleMyList={onToggleMyList}
                      isInMyList={isItemInMyList?.(episode.url) || false}
                    />
                  ))}
                </ContentRow>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
