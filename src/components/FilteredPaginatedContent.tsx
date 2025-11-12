import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { MovieCard } from "./MovieCard";
import { TVChannelCard } from "./TVChannelCard";
import { ContentItem } from "../types/content";
import { paginateContent } from "../utils/dataLoader";
import { groupSeriesByShow, getRepresentativeItems, getGroupForItem, GroupedSeries } from "../utils/seriesGrouping";

// Turkish alphabet (Ğ excluded - no Turkish words start with Ğ)
const ALPHABET = ["0-9", ..."ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ".split("")];

/**
 * Compute the count of items for each letter in the alphabet (memoization-friendly)
 * Returns a Record<string, number> for efficient lookup
 */
export function computeAlphabetCounts(items: ContentItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  // Initialize all letters with 0
  ALPHABET.forEach(letter => {
    counts[letter] = 0;
  });
  
  // Count items for each letter
  items.forEach(item => {
    const firstChar = item.name?.charAt(0);
    if (!firstChar) return;
    
    if (/[0-9]/.test(firstChar)) {
      counts["0-9"]++;
    } else {
      const upperChar = firstChar.toLocaleUpperCase("tr-TR");
      if (counts.hasOwnProperty(upperChar)) {
        counts[upperChar]++;
      }
    }
  });
  
  return counts;
}

interface FilteredPaginatedContentProps {
  items: ContentItem[];
  pageSize?: number;
  onPlay: (item: ContentItem) => void;
  onItemHover?: (item: ContentItem | null) => void;
  onToggleMyList?: (item: ContentItem) => void;
  isItemInMyList?: (itemUrl: string) => boolean;
  onContentClick?: (item: ContentItem, group?: GroupedSeries) => void;
  searchTerm?: string;
  selectedLetter?: string | null;
}

export function FilteredPaginatedContent({ 
  items, 
  pageSize = 20, 
  onPlay,
  onItemHover,
  onToggleMyList,
  isItemInMyList,
  onContentClick,
  searchTerm = "",
  selectedLetter = null
}: FilteredPaginatedContentProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Group series items before filtering
  const groupedSeries = useMemo(() => {
    return groupSeriesByShow(items);
  }, [items]);

  // Get representative items for display (one per series group)
  const representativeItems = useMemo(() => {
    return getRepresentativeItems(groupedSeries);
  }, [groupedSeries]);

  // Filter items by search term and letter (Turkish-aware, highly performant)
  const filteredItems = useMemo(() => {
    let result = representativeItems;
    
    // Apply search filter (fuzzy contains search, Turkish locale aware)
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLocaleLowerCase("tr-TR");
      result = result.filter(item => {
        const nameLower = item.name?.toLocaleLowerCase("tr-TR") || "";
        return nameLower.includes(searchLower);
      });
    }
    
    // Apply letter filter
    if (selectedLetter) {
      if (selectedLetter === "0-9") {
        result = result.filter(item => {
          const firstChar = item.name?.charAt(0);
          return firstChar && /[0-9]/.test(firstChar);
        });
      } else {
        result = result.filter(item => {
          const firstChar = item.name?.charAt(0).toLocaleUpperCase("tr-TR");
          return firstChar === selectedLetter;
        });
      }
    }
    
    return result;
  }, [representativeItems, searchTerm, selectedLetter]);

  // Reset to page 1 when items, search, or letter filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, searchTerm, selectedLetter]);

  const { items: paginatedItems, totalPages } = useMemo(() => 
    paginateContent(filteredItems, currentPage, pageSize),
    [filteredItems, currentPage, pageSize]
  );

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Handle content click - navigate to details page for both movies and series
  const handleContentClick = (item: ContentItem) => {
    if (onContentClick) {
      if (item.type === "Series") {
        const group = getGroupForItem(item, groupedSeries);
        onContentClick(item, group || undefined);
      } else {
        onContentClick(item);
      }
    }
  };

  // Generate unique key for an item
  const getItemKey = (item: ContentItem): string => {
    return item.type === "Series" 
      ? `${item.name}-${item.language || 'no-lang'}-${item.type}`
      : `${item.type}-${item.id}`;
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

  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2">
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
  );

  if (items.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-lg text-white/50">No content found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="text-sm text-white/50">
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} results
          </div>
          <PaginationControls />
        </div>
      )}

      {/* Content Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-lg text-white/50">
            {searchTerm ? `No results for "${searchTerm}"` : selectedLetter ? `No items starting with "${selectedLetter}"` : "No content found"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {paginatedItems.map((item) => {
            if (item.type === "TV") {
              return <TVChannelCard key={item.id} item={item} onPlay={onPlay} onHover={onItemHover} onToggleMyList={onToggleMyList} isInMyList={isItemInMyList?.(item.url) || false} />;
            }
            
            return (
              <MovieCard 
                key={item.id} 
                item={item} 
                onDetailsClick={handleContentClick}
                onHover={onItemHover}
              />
            );
          })}
        </div>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-6">
          <PaginationControls />
          <div className="text-sm text-white/50">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
