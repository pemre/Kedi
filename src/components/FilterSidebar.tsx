import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { X, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { filters as filtersData } from "../data/filtersData";
import { sortStringsTurkish } from "../utils/turkishSort";

interface FilterConfig {
  category?: boolean;
  platform?: boolean;
  quality?: boolean;
  year?: boolean;
  language?: boolean;
  search?: boolean;
  alphabet?: boolean;
}

interface FilterSidebarProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  enabledFilters: FilterConfig;
  contentType: "Movie" | "Series" | "TV" | "Radio";
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  selectedLetter?: string | null;
  onLetterChange?: (letter: string | null) => void;
  alphabetCounts?: Record<string, number>;
}

export function FilterSidebar({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  enabledFilters,
  contentType,
  searchTerm = "",
  onSearchChange,
  selectedLetter = null,
  onLetterChange,
  alphabetCounts = {}
}: FilterSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const hasActiveFilters = Object.values(filters).some((value) => value !== "all") ||
                          searchTerm !== "" || 
                          selectedLetter !== null;
  
  // Turkish alphabet (Ğ excluded - no Turkish words start with Ğ)
  const alphabet = useMemo(() => ["0-9", ..."ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ".split("")], []);
  
  // Get filter options for the current content type
  const typeFilters = useMemo(() => {
    if (!filtersData || !filtersData.types) return undefined;
    return filtersData.types[contentType];
  }, [contentType]);
  
  // Language flag mapping
  const languageFlags: { [key: string]: string } = {
    alb: "🇦🇱",
    aze: "🇦🇿",
    bul: "🇧🇬",
    chi: "🇨🇳",
    cze: "🇨🇿",
    deu: "🇩🇪",
    dut: "🇳🇱",
    eng: "🇬🇧",
    fra: "🇫🇷",
    gre: "🇬🇷",
    hin: "🇮🇳",
    hun: "🇭🇺",
    ita: "🇮🇹",
    jpn: "🇯🇵",
    kor: "🇰🇷",
    per: "🇮🇷",
    pol: "🇵🇱",
    por: "🇵🇹",
    rum: "🇷🇴",
    rus: "🇷🇺",
    spa: "🇪🇸",
    swe: "🇸🇪",
    tur: "🇹🇷",
    ukr: "🇺🇦",
  };
  
  // Language name mapping
  const languageNames: { [key: string]: string } = {
    alb: "Albanian",
    aze: "Azerbaijani",
    bul: "Bulgarian",
    chi: "Chinese",
    cze: "Czech",
    deu: "German",
    dut: "Dutch",
    eng: "English",
    fra: "French",
    gre: "Greek",
    hin: "Hindi",
    hun: "Hungarian",
    ita: "Italian",
    jpn: "Japanese",
    kor: "Korean",
    per: "Persian",
    pol: "Polish",
    por: "Portuguese",
    rum: "Romanian",
    rus: "Russian",
    spa: "Spanish",
    swe: "Swedish",
    tur: "Turkish",
    ukr: "Ukrainian",
  };
  
  // Helper to get formatted language display
  const getLanguageDisplay = (code: string) => {
    const flag = languageFlags[code.toLowerCase()] || "";
    const name = languageNames[code.toLowerCase()] || code.toUpperCase();
    return `${flag} ${name}`.trim();
  };
  
  // Get sorted filter options
  const getCategoryOptions = useMemo(() => {
    if (!typeFilters?.category) return [];
    return sortStringsTurkish(typeFilters.category);
  }, [typeFilters]);
  
  const getPlatformOptions = useMemo(() => {
    if (!typeFilters?.platform) return [];
    return sortStringsTurkish(typeFilters.platform);
  }, [typeFilters]);
  
  const getQualityOptions = useMemo(() => {
    if (!typeFilters?.quality) return [];
    // Quality should be in specific order: 4K, UHD, FHD, HD, SD
    const qualityOrder = ["4K", "UHD", "FHD", "HD", "SD"];
    return typeFilters.quality.sort((a, b) => {
      const indexA = qualityOrder.indexOf(a.toUpperCase());
      const indexB = qualityOrder.indexOf(b.toUpperCase());
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [typeFilters]);
  
  const getYearOptions = useMemo(() => {
    if (!typeFilters?.year) return [];
    // Years should be sorted descending (newest first)
    return [...typeFilters.year].sort((a, b) => {
      const yearA = parseInt(a);
      const yearB = parseInt(b);
      return yearB - yearA;
    });
  }, [typeFilters]);
  
  const getLanguageOptions = useMemo(() => {
    if (!typeFilters?.language) return [];
    // Sort by language name
    return [...typeFilters.language].sort((a, b) => {
      const nameA = languageNames[a.toLowerCase()] || a;
      const nameB = languageNames[b.toLowerCase()] || b;
      return nameA.localeCompare(nameB);
    });
  }, [typeFilters]);
  
  const handleClearAll = () => {
    onClearFilters();
    onSearchChange?.("");
    onLetterChange?.(null);
  };

  return (
    <>
      {/* Mobile Filter Button - Bottom Left */}
      <Button
        onClick={() => setIsMobileOpen(true)}
        className={`
          fixed bottom-6 right-6 z-40 rounded-full p-0 shadow-lg text-white backdrop-blur-xs
          h-10 w-10 border-white/20 border-1 bg-white/10 hover:bg-white/20 lg:hidden
          ${isMobileOpen ? 'bg-[#E50914]' : ''}
        `}
      >
        <SlidersHorizontal className="h-6 w-6" />
      </Button>

      {/* Backdrop Overlay for Mobile */}
      {isMobileOpen && (
        <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile: fixed overlay, Desktop: static in layout */}
      <div
        className={`
          fixed left-6 bottom-6 z-50 w-64 md:w-80 space-y-6 overflow-y-auto rounded-lg border border-white/10 bg-black/50 p-6 transition-transform duration-300 ease-in-out shadow-2xl
          lg:static lg:top-0 lg:left-0 lg:bottom-0 lg:h-fit lg:w-64 lg:shrink-0 lg:bg-black/50 backdrop-blur-xs
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'}
        `}
      >
        <div className="space-y-4">
          {/* Search Filter */}
          {enabledFilters.search && onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                type="text"
                placeholder="Search titles..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="border-white/20 bg-transparent pl-10 text-white placeholder:text-white/40 backdrop-blur-sm hover:bg-white/5 focus:bg-white/5"
              />
            </div>
          )}

          {/* Alphabet Filter */}
          {enabledFilters.alphabet && onLetterChange && (
              <div className="flex flex-wrap gap-1.5">
                {alphabet.map((letter) => {
                  const count = alphabetCounts[letter] || 0;
                  const isSelected = selectedLetter === letter;

                  return (
                    <Button
                      key={letter}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => onLetterChange(isSelected ? null : letter)}
                      disabled={count === 0}
                      className={
                        isSelected
                          ? `h-7 ${letter === "0-9" ? "w-10 text-xs" : "w-7 text-xs"} bg-[#E50914] hover:bg-[#E50914]/90`
                          : `h-7 ${letter === "0-9" ? "w-10 text-xs" : "w-7 text-xs"} border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-20`
                      }
                      title={`${count} items`}
                    >
                      {letter}
                    </Button>
                  );
                })}
              </div>
          )}

          {/* Category Filter */}
          {enabledFilters.category && getCategoryOptions.length > 0 && (
              <Select value={filters.category} onValueChange={(value) => onFilterChange("category", value)}>
                <SelectTrigger className="border-white/20 bg-transparent text-white backdrop-blur-sm hover:bg-white/10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-transparent text-white backdrop-blur-sm">
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )}

          {/* Platform Filter */}
          {enabledFilters.platform && getPlatformOptions.length > 0 && (
              <Select value={filters.platform} onValueChange={(value) => onFilterChange("platform", value)}>
                <SelectTrigger className="border-white/20 bg-transparent text-white backdrop-blur-sm hover:bg-white/10">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-transparent text-white backdrop-blur-sm">
                  <SelectItem value="all">All Platforms</SelectItem>
                  {getPlatformOptions.map((platform) => (
                    <SelectItem key={platform} value={platform.toLowerCase().replace(/\s+/g, '-')}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )}

          {/* Quality Filter */}
          {enabledFilters.quality && getQualityOptions.length > 0 && (
              <Select value={filters.quality} onValueChange={(value) => onFilterChange("quality", value)}>
                <SelectTrigger className="border-white/20 bg-transparent text-white backdrop-blur-sm hover:bg-white/10">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-transparent text-white backdrop-blur-sm">
                  <SelectItem value="all">All Quality</SelectItem>
                  {getQualityOptions.map((quality) => (
                    <SelectItem key={quality} value={quality.toLowerCase()}>
                      {quality.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )}

          {/* Year Filter */}
          {enabledFilters.year && getYearOptions.length > 0 && (
              <Select value={filters.year} onValueChange={(value) => onFilterChange("year", value)}>
                <SelectTrigger className="border-white/20 bg-transparent text-white backdrop-blur-sm hover:bg-white/10">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-transparent text-white backdrop-blur-sm">
                  <SelectItem value="all">All Years</SelectItem>
                  {getYearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )}

          {/* Language Filter */}
          {enabledFilters.language && getLanguageOptions.length > 0 && (
              <Select value={filters.language} onValueChange={(value) => onFilterChange("language", value)}>
                <SelectTrigger className="border-white/20 bg-transparent text-white backdrop-blur-sm hover:bg-white/10">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-transparent text-white backdrop-blur-sm">
                  <SelectItem value="all">All Languages</SelectItem>
                  {getLanguageOptions.map((lang) => (
                    <SelectItem key={lang} value={lang.toLowerCase()}>
                      {getLanguageDisplay(lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )}
        </div>
      </div>
    </>
  );
}
