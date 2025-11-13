import React from "react";
import { Play } from "lucide-react";
import { PosterImage } from "./PosterImage";
import { ContentItem } from "../types/content";

interface MovieCardProps {
  item: ContentItem;
  onDetailsClick?: (item: ContentItem) => void;
  onPlay?: (item: ContentItem) => void;
  onHover?: (item: ContentItem | null) => void;
  variant?: 'default' | 'episode'; // 'default' navigates to details, 'episode' plays directly
}

export function MovieCard({ item, onDetailsClick, onPlay, onHover, variant = 'default' }: MovieCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (variant === 'episode' && onPlay) {
      onPlay(item);
    } else if (onDetailsClick) {
      onDetailsClick(item);
    }
  };
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
    if (item.type === "Series" && item.season && item.episode) {
      return `S${item.season}:E${item.episode}`;
    }
    return item.year || "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onHover?.(item);
    }
  };

  return (
    <button
      className="
        group relative isolate
        w-[110px] md:w-[160px] lg:w-[180px]
        shrink-0 cursor-pointer rounded-md text-left text-xs md:text-sm transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black
        hover:ring-3 hover:ring-white/60
      "
      onMouseEnter={() => onHover?.(item)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-qa={item.id}
      aria-label={`${item.name}${item.year ? `, ${item.year}` : ""}`}
      tabIndex={0}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md">
        <PosterImage
          src={item.logo}
          alt={item.name}
          title={item.name}
          type={item.type === "Series" ? "tv" : "movie"}
          className="h-full w-full object-cover"
        />
        
        {/* Play Icon Overlay - Only for episode variant */}
        {variant === 'episode' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
          </div>
        )}

        {/* Netflix-style hover overlay */}
        <div className="absolute inset-0"
             style={{
               background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 10%, transparent 50%)',
             }}
        />
          <div className="
            absolute top-0 p-3 flex items-center gap-1 w-full text-[10px]
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            bg-gradient-to-b from-black/80 to-transparent"
          >
              {item.source === "Plex"
                  ? (<div className="rounded px-1 bg-[#E5A00D]/80 text-black">Plex</div>)
                  : (<div className="rounded px-1 border border-white/40">{item.source}</div>)
              }
              {item.platform && (<div>{item.platform}</div>)}
              {item.language && (<div className="text-sm">{languageFlags[item.language] || item.language}</div>)}
              {item.quality && (<div className="rounded px-1 border border-white/40">{item.quality}</div>)}
          </div>

        {/* Netflix-style expanded info on hover - inside the image box */}
        <div className="absolute bottom-0 p-3 flex flex-col">
            <div className="line-clamp-1">{item.name}</div>
            <div className="text-xs text-white/60">{getSubtitle()}</div>
        </div>
      </div>
    </button>
  );
}
