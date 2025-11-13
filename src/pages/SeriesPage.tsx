import { HeroSection } from "../components/HeroSection";
import { FilterSidebar } from "../components/FilterSidebar";
import { FilteredPaginatedContent } from "../components/FilteredPaginatedContent";
import { ContentDetailsPage } from "../components/ContentDetailsPage";
import { ContentItem } from "../types/content";
import { GroupedSeries } from "../utils/seriesGrouping";

interface SeriesPageProps {
  popularSeries: ContentItem[];
  filteredSeries: ContentItem[];
  seriesFilters: {
    category: string;
    platform: string;
    quality: string;
    year: string;
    language: string;
  };
  seriesSearchTerm: string;
  seriesSelectedLetter: string | null;
  seriesAlphabetCounts: Record<string, number>;
  hoveredSeries: ContentItem | null;
  viewingSeriesDetails: GroupedSeries | null;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
  onLetterChange: (letter: string | null) => void;
  onPlay: (item: ContentItem) => void;
  onItemHover: (item: ContentItem | null) => void;
  onToggleMyList: (item: ContentItem) => void;
  isItemInMyList: (itemUrl: string) => boolean;
  onSeriesClick: (group: GroupedSeries) => void;
  onBackFromSeriesDetails: () => void;
}

export function SeriesPage({
  popularSeries,
  filteredSeries,
  seriesFilters,
  seriesSearchTerm,
  seriesSelectedLetter,
  seriesAlphabetCounts,
  hoveredSeries,
  viewingSeriesDetails,
  onFilterChange,
  onClearFilters,
  onSearchChange,
  onLetterChange,
  onPlay,
  onItemHover,
  onToggleMyList,
  isItemInMyList,
  onSeriesClick,
  onBackFromSeriesDetails
}: SeriesPageProps) {
  // Show series details page if viewing a series
  if (viewingSeriesDetails) {
    return (
      <ContentDetailsPage
        item={viewingSeriesDetails.representative}
        group={viewingSeriesDetails}
        onPlay={onPlay}
        onDetailsClick={(item) => {
          // For episodes within series details, navigate to that episode's details
          const group = viewingSeriesDetails;
          handleContentClick(item, group);
        }}
        onItemHover={onItemHover}
        onToggleMyList={onToggleMyList}
        isItemInMyList={isItemInMyList}
        onBack={onBackFromSeriesDetails}
      />
    );
  }
  
  const backgroundItem = hoveredSeries || filteredSeries[0] || popularSeries[0];

  const handleContentClick = (item: ContentItem, group?: GroupedSeries) => {
    if (group) {
      onSeriesClick(group);
    }
  };

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
            filters={seriesFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            contentType="Series"
            enabledFilters={{
              search: true,
              alphabet: true,
              category: true,
              platform: true,
              quality: true,
              year: true,
              language: true
            }}
            searchTerm={seriesSearchTerm}
            onSearchChange={onSearchChange}
            selectedLetter={seriesSelectedLetter}
            onLetterChange={onLetterChange}
            alphabetCounts={seriesAlphabetCounts}
          />

          {/* Right Content Area */}
          <div className="min-w-0 flex-1">
            <FilteredPaginatedContent
              items={filteredSeries}
              pageSize={24}
              onPlay={onPlay}
              onItemHover={onItemHover}
              onToggleMyList={onToggleMyList}
              isItemInMyList={isItemInMyList}
              onContentClick={handleContentClick}
              searchTerm={seriesSearchTerm}
              selectedLetter={seriesSelectedLetter}
            />
          </div>
        </div>
      </div>
    </>
  );
}
