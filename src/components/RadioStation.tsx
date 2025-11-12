import { Play, Radio as RadioIcon, Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { ContentItem } from "../types/content";

interface RadioStationProps {
  item: ContentItem;
  isPlaying?: boolean;
  onPlay?: () => void;
  onToggleMyList?: (item: ContentItem) => void;
  isInMyList?: boolean;
}

export function RadioStation({ item, isPlaying = false, onPlay, onToggleMyList, isInMyList = false }: RadioStationProps) {
  const languageFlags: { [key: string]: string } = {
    aze: "🇦🇿",
    deu: "🇩🇪",
    dut: "🇳🇱",
    eng: "🇬🇧",
    fra: "🇫🇷",
    por: "🇵🇹",
    tur: "🇹🇷",
  };
  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-white/15 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
      data-qa={item.id}
    >
      {/* Play Button */}
      <Button
        size="icon"
        onClick={onPlay}
        className={`h-12 w-12 shrink-0 rounded-full transition-all ${
          isPlaying
            ? "bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-magenta)] shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            : "bg-white/10 text-foreground hover:bg-white/20"
        }`}
      >
        {isPlaying ? (
          <RadioIcon className="h-5 w-5 text-black" />
        ) : (
          <Play className="h-5 w-5 fill-current" />
        )}
      </Button>

      {/* My List Button */}
      {onToggleMyList && (
        <Button
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMyList(item);
          }}
          className="h-10 w-10 shrink-0 rounded-full border-2 border-white/30 bg-transparent opacity-0 transition-all hover:border-white hover:bg-white/10 group-hover:opacity-100"
          title={isInMyList ? "Remove from My List" : "Add to My List"}
        >
          {isInMyList ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Station Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate transition-colors group-hover:text-purple-400">
          {item.name}
        </h3>
        <div className="flex items-center gap-2">
          {item.category && <p className="text-sm text-muted-foreground">{item.category}</p>}
          {item.language && (
            <>
              {item.category && <span className="text-muted-foreground">•</span>}
              <p className="text-sm text-muted-foreground">
                {languageFlags[item.language] || item.language}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="hidden items-center gap-1 md:flex">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t from-[var(--neon-cyan)] to-[var(--neon-magenta)] transition-all ${
              isPlaying ? "animate-pulse" : "opacity-30"
            }`}
            style={{
              height: `${Math.random() * 24 + 8}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
