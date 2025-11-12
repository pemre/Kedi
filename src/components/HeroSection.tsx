import { PosterImage } from "./PosterImage";
import { ContentItem } from "../types/content";

interface HeroSectionProps {
  title: string;
  imageUrl: string;
  item?: ContentItem;
}

export function HeroSection({ title, imageUrl, item }: HeroSectionProps) {
  return (
    <div className="absolute h-[80vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <PosterImage
          src={imageUrl}
          alt={title || item?.name || "Content"}
          title={title || item?.name || "Content"}
          type={item?.type === "Series" ? "tv" : "movie"}
          className="h-full w-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end px-12 pb-40">

      </div>
    </div>
  );
}
