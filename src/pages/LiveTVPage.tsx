import { HeroSection } from "../components/HeroSection";
import { FilterSidebar } from "../components/FilterSidebar";
import { LiveTVPaginatedContent } from "../components/LiveTVPaginatedContent";
import { ContentItem } from "../types/content";

interface LiveTVPageProps {
  tvChannels: ContentItem[];
  filteredTVChannels: ContentItem[];
  liveTVFilters: {
    category: string;
    quality: string;
    language: string;
  };
  liveTVSearchTerm: string;
  liveTVSelectedLetter: string | null;
  liveTVAlphabetCounts: Record<string, number>;
  hoveredTV: ContentItem | null;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
  onLetterChange: (letter: string | null) => void;
  onPlay: (item: ContentItem) => void;
  onItemHover: (item: ContentItem | null) => void;
  onToggleMyList: (item: ContentItem) => void;
  isItemInMyList: (itemUrl: string) => boolean;
}

export function LiveTVPage({
  tvChannels,
  filteredTVChannels,
  liveTVFilters,
  liveTVSearchTerm,
  liveTVSelectedLetter,
  liveTVAlphabetCounts,
  hoveredTV,
  onFilterChange,
  onClearFilters,
  onSearchChange,
  onLetterChange,
  onPlay,
  onItemHover,
  onToggleMyList,
  isItemInMyList
}: LiveTVPageProps) {
  const backgroundItem = hoveredTV || filteredTVChannels[0] || tvChannels[0];

  return (
    <>
      {/* Background Hero */}
      {backgroundItem && (
        <HeroSection
          title=""
          imageUrl={backgroundItem.logo}
          item={backgroundItem}
        />
      )}
      
      {/* Main Content with Sidebar */}
      <div className="relative z-10 mt-18 md:mt-32 px-6 md:px-12 pb-12">
        <div className="flex gap-6">
          <FilterSidebar
            filters={liveTVFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            contentType="TV"
            enabledFilters={{
              search: true,
              alphabet: true,
              category: true,
              quality: true,
              language: true
            }}
            searchTerm={liveTVSearchTerm}
            onSearchChange={onSearchChange}
            selectedLetter={liveTVSelectedLetter}
            onLetterChange={onLetterChange}
            alphabetCounts={liveTVAlphabetCounts}
          />

          {/* Right Content Area */}
          <div className="min-w-0 flex-1">
            <LiveTVPaginatedContent
              items={filteredTVChannels}
              pageSize={24}
              onPlay={onPlay}
              onItemHover={onItemHover}
              onToggleMyList={onToggleMyList}
              isItemInMyList={isItemInMyList}
              searchTerm={liveTVSearchTerm}
              selectedLetter={liveTVSelectedLetter}
            />
          </div>
        </div>
      </div>
    </>
  );
}
