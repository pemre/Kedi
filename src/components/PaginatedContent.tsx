import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { MovieCard } from "./MovieCard";
import { TVChannelCard } from "./TVChannelCard";
import { ContentItem } from "../types/content";
import { paginateContent } from "../utils/dataLoader";

interface PaginatedContentProps {
  items: ContentItem[];
  pageSize?: number;
  onPlay: (item: ContentItem) => void;
  onItemHover?: (item: ContentItem | null) => void;
  onToggleMyList?: (item: ContentItem) => void;
  isItemInMyList?: (itemUrl: string) => boolean;
}

export function PaginatedContent({ items, pageSize = 20, onPlay, onItemHover, onToggleMyList, isItemInMyList }: PaginatedContentProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const { items: paginatedItems, totalPages } = useMemo(() => 
    paginateContent(items, currentPage, pageSize),
    [items, currentPage, pageSize]
  );

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-lg text-white/50">No content found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Content Grid */}
      <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {paginatedItems.map((item) => {
          if (item.type === "TV") {
            return <TVChannelCard key={item.id} item={item} onPlay={onPlay} onHover={onItemHover} onToggleMyList={onToggleMyList} isInMyList={isItemInMyList?.(item.url) || false} />;
          }
          return <MovieCard key={item.id} item={item} onPlay={onPlay} onHover={onItemHover} onToggleMyList={onToggleMyList} isInMyList={isItemInMyList?.(item.url) || false} />;
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="h-9 w-9 border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-white/50">
                  ...
                </span>
              );
            }
            
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageClick(page as number)}
                className={
                  currentPage === page
                    ? "h-9 w-9 bg-[#E50914] hover:bg-[#E50914]/90"
                    : "h-9 w-9 border-white/20 bg-white/5 hover:bg-white/10"
                }
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="h-9 w-9 border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Results info */}
      <div className="text-center text-sm text-white/50">
        Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, items.length)} of {items.length} results
      </div>
    </div>
  );
}
