import { Radio as RadioIcon, Play, Plus, Check } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { ContentItem } from "../types/content";

interface TVChannelCardProps {
  item: ContentItem;
  onPlay?: (item: ContentItem) => void;
  onHover?: (item: ContentItem | null) => void;
  onToggleMyList?: (item: ContentItem) => void;
  isInMyList?: boolean;
}

export function TVChannelCard({ item, onPlay, onHover, onToggleMyList, isInMyList }: TVChannelCardProps) {
  return (
    <div 
      className="group relative isolate w-[150px] shrink-0 cursor-pointer md:w-[160px] lg:w-[170px]"
      onMouseEnter={() => onHover?.(item)}
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-gradient-to-br from-white/10 to-white/5">
        {/* Radial white background for transparent logos */}
        <div 
          className="pointer-events-none absolute inset-0" 
          style={{
            background: 'radial-gradient(circle, white 70%, transparent 100%)'
          }}
        />
        
        {item.logo ? (
          <ImageWithFallback
            src={item.logo}
            alt={item.name}
            className="relative z-10 h-full w-full object-contain p-6 transition-transform duration-300 will-change-transform group-hover:scale-110"
          />
        ) : (
          <div className="relative z-10 flex h-full items-center justify-center">
            <RadioIcon className="h-16 w-16 text-white/40" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 will-change-opacity group-hover:opacity-100" />
        
        {/* Action buttons */}
        <div className="absolute inset-x-0 bottom-0 z-30 translate-y-4 p-3 opacity-0 transition-all duration-300 will-change-transform will-change-opacity group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 w-7 rounded-full bg-white p-0 text-black hover:bg-white/80"
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.(item);
              }}
            >
              <Play className="h-3 w-3 fill-black" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 rounded-full border-2 border-white/40 p-0 hover:border-white"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMyList?.(item);
              }}
            >
              {isInMyList ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Netflix-style info on hover */}
      <div className="mt-2">
        <h3 className="line-clamp-1 text-sm transition-colors">{item.name}</h3>
        <div className="flex items-center gap-2">
          <p className="text-xs text-white/60">{item.category || item.type}</p>
          {item.source === "Plex" && (
            <span className="rounded bg-[#E5A00D]/80 px-1.5 text-[10px] font-medium text-black">Plex</span>
          )}
        </div>
      </div>
    </div>
  );
}
