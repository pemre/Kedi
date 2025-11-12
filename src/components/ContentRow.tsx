import { ChevronLeft, ChevronRight, Menu, Settings } from "lucide-react";
import { Button } from "./ui/button";
import {useRef, useState, useCallback, ReactNode} from "react";

interface ContentRowProps {
  title: string;
  children: ReactNode;
  rowId?: string;
  onConfigure?: () => void;
  dragHandleProps?: any;
  isDraggable?: boolean;
}

export function ContentRow({ title, children, rowId, onConfigure, dragHandleProps, isDraggable = false }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollTimeoutRef = useRef<number | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    }, 100);
  }, []);

  return (
    <div className="group/row relative px-12">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl md:text-2xl">{title}</h2>
        
        {/* Row Management Icons */}
        {isDraggable && (
          <div className="flex items-center gap-2 opacity-40 transition-opacity group-hover/row:opacity-100">
            {/* Hamburger Icon for Drag & Drop */}
            <button
              {...dragHandleProps}
              className="cursor-move rounded p-1 hover:bg-white/10 transition-colors"
              title="Drag to reorder"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Cog Icon for Configuration */}
            {onConfigure && (
              <button
                onClick={onConfigure}
                className="rounded p-1 hover:bg-white/10 transition-colors"
                title="Configure row"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Left Arrow */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 z-20 h-[225px] md:h-[240px] lg:h-[255px] w-12 -translate-y-1/2 rounded-none bg-black/60 opacity-0 transition-opacity hover:bg-black/80 group-hover/row:opacity-100"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2 overflow-x-scroll scrollbar-hide md:gap-3"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 z-20 h-[225px] md:h-[240px] lg:h-[255px] w-12 -translate-y-1/2 rounded-none bg-black/60 opacity-0 transition-opacity hover:bg-black/80 group-hover/row:opacity-100"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}
    </div>
  );
}
