import { HeroSection } from "../components/HeroSection";
import { FilterSidebar } from "../components/FilterSidebar";
import { FilteredPaginatedContent } from "../components/FilteredPaginatedContent";
import { ContentDetailsPage } from "../components/ContentDetailsPage";
import { ContentItem } from "../types/content";

interface MoviesPageProps {
  allMovies: ContentItem[];
  filteredMovies: ContentItem[];
  movieFilters: {
    category: string;
    platform: string;
    quality: string;
    year: string;
    language: string;
  };
  movieSearchTerm: string;
  movieSelectedLetter: string | null;
  movieAlphabetCounts: Record<string, number>;
  hoveredMovie: ContentItem | null;
  viewingMovieDetails: ContentItem | null;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
  onLetterChange: (letter: string | null) => void;
  onPlay: (item: ContentItem) => void;
  onItemHover: (item: ContentItem | null) => void;
  onToggleMyList: (item: ContentItem) => void;
  isItemInMyList: (itemUrl: string) => boolean;
  onMovieClick: (item: ContentItem) => void;
  onBackFromMovieDetails: () => void;
}

export function MoviesPage({
  allMovies,
  filteredMovies,
  movieFilters,
  movieSearchTerm,
  movieSelectedLetter,
  movieAlphabetCounts,
  hoveredMovie,
  viewingMovieDetails,
  onFilterChange,
  onClearFilters,
  onSearchChange,
  onLetterChange,
  onPlay,
  onItemHover,
  onToggleMyList,
  isItemInMyList,
  onMovieClick,
  onBackFromMovieDetails
}: MoviesPageProps) {
  // Show movie details page if viewing a movie
  if (viewingMovieDetails) {
    return (
      <ContentDetailsPage
        item={viewingMovieDetails}
        onPlay={onPlay}
        onDetailsClick={onMovieClick}
        onItemHover={onItemHover}
        onToggleMyList={onToggleMyList}
        isItemInMyList={isItemInMyList}
        onBack={onBackFromMovieDetails}
      />
    );
  }

  const backgroundItem = hoveredMovie || filteredMovies[0] || allMovies[0];

  const handleContentClick = (item: ContentItem) => {
    onMovieClick(item);
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
            filters={movieFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            contentType="Movie"
            enabledFilters={{
              search: true,
              alphabet: true,
              category: true,
              platform: true,
              quality: true,
              year: true,
              language: true
            }}
            searchTerm={movieSearchTerm}
            onSearchChange={onSearchChange}
            selectedLetter={movieSelectedLetter}
            onLetterChange={onLetterChange}
            alphabetCounts={movieAlphabetCounts}
          />

          {/* Right Content Area */}
          <div className="min-w-0 flex-1">
            <FilteredPaginatedContent
              items={filteredMovies}
              pageSize={24}
              onPlay={onPlay}
              onItemHover={onItemHover}
              onToggleMyList={onToggleMyList}
              isItemInMyList={isItemInMyList}
              onContentClick={handleContentClick}
              searchTerm={movieSearchTerm}
              selectedLetter={movieSelectedLetter}
            />
          </div>
        </div>
      </div>
    </>
  );
}
