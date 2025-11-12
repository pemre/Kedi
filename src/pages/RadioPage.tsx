import { FilterSidebar } from "../components/FilterSidebar";
import { RadioStation } from "../components/RadioStation";
import { ContentItem } from "../types/content";

interface RadioPageProps {
  radioStations: ContentItem[];
  filteredRadioStations: ContentItem[];
  radioFilters: {
    category: string;
    language: string;
  };
  radioSearchTerm: string;
  radioSelectedLetter: string | null;
  radioAlphabetCounts: Record<string, number>;
  playingRadio: string | null;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
  onLetterChange: (letter: string | null) => void;
  onRadioPlay: (stationUrl: string) => void;
  onToggleMyList: (item: ContentItem) => void;
  isItemInMyList: (itemUrl: string) => boolean;
}

export function RadioPage({
  radioStations,
  filteredRadioStations,
  radioFilters,
  radioSearchTerm,
  radioSelectedLetter,
  radioAlphabetCounts,
  playingRadio,
  onFilterChange,
  onClearFilters,
  onSearchChange,
  onLetterChange,
  onRadioPlay,
  onToggleMyList,
  isItemInMyList
}: RadioPageProps) {
  const displayedStations = filteredRadioStations.filter(item => {
    // Apply search filter
    if (radioSearchTerm.trim() !== "") {
      const searchLower = radioSearchTerm.toLocaleLowerCase("tr-TR");
      const nameLower = item.name?.toLocaleLowerCase("tr-TR") || "";
      if (!nameLower.includes(searchLower)) return false;
    }
    
    // Apply letter filter
    if (radioSelectedLetter) {
      if (radioSelectedLetter === "0-9") {
        const firstChar = item.name?.charAt(0);
        if (!/[0-9]/.test(firstChar || "")) return false;
      } else {
        const firstChar = item.name?.charAt(0).toLocaleUpperCase("tr-TR") || "";
        if (firstChar !== radioSelectedLetter) return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen px-12 pt-24 mt-8">
      <div className="flex gap-6 pb-12">
        {/* Left Sidebar - Filters */}
        <div className="w-64 shrink-0">
          <FilterSidebar
            filters={radioFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            contentType="Radio"
            enabledFilters={{
              search: true,
              alphabet: true,
              category: true,
              language: true
            }}
            searchTerm={radioSearchTerm}
            onSearchChange={onSearchChange}
            selectedLetter={radioSelectedLetter}
            onLetterChange={onLetterChange}
            alphabetCounts={radioAlphabetCounts}
          />
        </div>

        {/* Right Content Area */}
        <div className="min-w-0 flex-1 space-y-8">
          {displayedStations.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-lg text-white/50">No radio stations found</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {displayedStations.map((item) => (
                <RadioStation
                  key={item.id}
                  item={item}
                  isPlaying={playingRadio === item.url}
                  onPlay={() => onRadioPlay(item.url)}
                  onToggleMyList={onToggleMyList}
                  isInMyList={isItemInMyList(item.url)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
