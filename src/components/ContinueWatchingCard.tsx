import { Play, X } from "lucide-react";
import { PosterImage } from "./PosterImage";
import { Button } from "./ui/button";
import { WatchHistoryItem } from "../types/content";

interface ContinueWatchingCardProps {
  historyItem: WatchHistoryItem;
  onPlay?: (historyItem: WatchHistoryItem) => void;
  onRemove?: (url: string) => void;
}

export function ContinueWatchingCard({ historyItem, onPlay, onRemove }: ContinueWatchingCardProps) {
  const { content, progress } = historyItem;

  const languageFlags: { [key: string]: string } = {
    aze: "🇦🇿",
    deu: "🇩🇪",
    dut: "🇳🇱",
    eng: "🇬🇧",
    fra: "🇫🇷",
    por: "🇵🇹",
    tur: "🇹🇷",
  };

  // Build subtitle based on type
  const getSubtitle = () => {
    if (content.type === "Series" && content.season && content.episode) {
      return `S${content.season}:E${content.episode}`;
    }
    return content.year || "";
  };

  return (
    <div className="group relative isolate w-[150px] shrink-0 cursor-pointer md:w-[160px] lg:w-[170px]" data-qa={content.id}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-md">
        <PosterImage
          src={content.logo}
          alt={content.name}
          title={content.name}
          type={content.type === "Series" ? "tv" : "movie"}
          className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-110"
        />
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-[var(--netflix-red)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Netflix-style hover overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 transition-opacity duration-300 will-change-opacity group-hover:opacity-100" />
        
        {/* Remove Button */}
        {onRemove && (
          <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-300 will-change-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(content.url);
              }}
              className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Netflix-style expanded info on hover - inside the image box */}
        <div className="absolute inset-x-0 bottom-0 translate-y-4 p-3 opacity-0 transition-all duration-300 will-change-transform will-change-opacity group-hover:translate-y-0 group-hover:opacity-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                className="h-8 w-8 rounded-full bg-white hover:bg-white/90"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(historyItem);
                }}
              >
                <Play className="h-4 w-4 fill-black text-black" />
              </Button>
              <div className="flex-1">
                <h4 className="line-clamp-1 text-sm">{content.name}</h4>
                {getSubtitle() && (
                  <p className="text-xs text-white/70">{getSubtitle()}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {content.language && languageFlags[content.language] && (
                <span className="opacity-90">{languageFlags[content.language]}</span>
              )}
              {content.source === "Plex" && (
                <span className="rounded bg-[#E5A00D]/80 px-1.5 text-[10px] font-medium text-black">Plex</span>
              )}
              <span className="text-white/70">{progress}% watched</span>
              {content.category && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-white/70">{content.category}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
