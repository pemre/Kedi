import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ContentRowConfig, ContentItem } from "../types/content";
import { getAllContent } from "../utils/dataLoader";

interface RowConfigPanelProps {
  config: ContentRowConfig;
  onSave: (config: ContentRowConfig) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function RowConfigPanel({ config, onSave, onDelete, onClose }: RowConfigPanelProps) {
  const [title, setTitle] = useState(config.title);
  const [filters, setFilters] = useState(config.filters);
  const [limit, setLimit] = useState(config.limit || 10);
  const [allContent, setAllContent] = useState<ContentItem[]>([]);

  // Load content data on mount
  useEffect(() => {
    getAllContent().then(setAllContent);
  }, []);

  // Extract unique values from content for dropdowns
  const uniqueLanguages = Array.from(new Set(allContent.map(item => item.language).filter(Boolean))) as string[];
  const uniqueCategories = Array.from(new Set(allContent.map(item => item.category).filter(Boolean))) as string[];
  const uniqueQualities = Array.from(new Set(allContent.map(item => item.quality).filter(Boolean))) as string[];
  const uniquePlatforms = Array.from(new Set(allContent.map(item => item.platform).filter(Boolean))) as string[];
  const uniqueYears = Array.from(new Set(allContent.map(item => item.year).filter(Boolean))).sort().reverse() as string[];

  const handleSave = () => {
    onSave({
      ...config,
      title,
      filters,
      limit,
    });
    onClose();
  };

  const toggleArrayValue = (key: keyof typeof filters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    
    setFilters({ ...filters, [key]: newArray.length > 0 ? newArray : undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-zinc-900 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl">Configure Content Row</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Title and Limit */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label htmlFor="title">Row Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 bg-zinc-800 border-zinc-700"
              placeholder="e.g., 2025 Movies"
            />
          </div>
          <div>
            <Label htmlFor="limit">Items Limit</Label>
            <Input
              id="limit"
              type="number"
              min="1"
              max="100"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
              className="mt-2 bg-zinc-800 border-zinc-700"
              placeholder="10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-6">
          <h3 className="text-lg text-white/90">Filters</h3>

          {/* Name Contains */}
          <div>
            <Label htmlFor="name">Name Contains</Label>
            <Input
              id="name"
              value={filters.name || ""}
              onChange={(e) => setFilters({ ...filters, name: e.target.value || undefined })}
              className="mt-2 bg-zinc-800 border-zinc-700"
              placeholder="Search by name..."
            />
          </div>

          {/* Media Type */}
          <div>
            <Label>Media Type</Label>
            <Select
              value={filters.media || "all"}
              onValueChange={(value) => setFilters({ ...filters, media: value === "all" ? undefined : value as "Live" | "On Demand" })}
            >
              <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select media type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="On Demand">On Demand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Type */}
          <div>
            <Label>Content Type</Label>
            <Select
              value={filters.type || "all"}
              onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? undefined : value as "TV" | "Series" | "Movie" | "Radio" })}
            >
              <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Movie">Movie</SelectItem>
                <SelectItem value="Series">Series</SelectItem>
                <SelectItem value="TV">TV</SelectItem>
                <SelectItem value="Radio">Radio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Languages (Multi-select) */}
          <div>
            <Label>Languages</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {uniqueLanguages.map(lang => (
                <Button
                  key={lang}
                  variant={filters.language?.includes(lang) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayValue("language", lang)}
                  className={filters.language?.includes(lang) ? "bg-[#E50914] hover:bg-[#E50914]/90" : ""}
                >
                  {lang.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Categories (Multi-select) */}
          <div>
            <Label>Categories</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {uniqueCategories.map(cat => (
                <Button
                  key={cat}
                  variant={filters.category?.includes(cat) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayValue("category", cat)}
                  className={filters.category?.includes(cat) ? "bg-[#E50914] hover:bg-[#E50914]/90" : ""}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Quality (Multi-select) */}
          <div>
            <Label>Quality</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {uniqueQualities.map(quality => (
                <Button
                  key={quality}
                  variant={filters.quality?.includes(quality) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayValue("quality", quality)}
                  className={filters.quality?.includes(quality) ? "bg-[#E50914] hover:bg-[#E50914]/90" : ""}
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>

          {/* Platform (Multi-select) */}
          <div>
            <Label>Platform</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {uniquePlatforms.map(platform => (
                <Button
                  key={platform}
                  variant={filters.platform?.includes(platform) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayValue("platform", platform)}
                  className={filters.platform?.includes(platform) ? "bg-[#E50914] hover:bg-[#E50914]/90" : ""}
                >
                  {platform}
                </Button>
              ))}
            </div>
          </div>

          {/* Year Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Year After</Label>
              <Select
                value={filters.year?.after || "all"}
                onValueChange={(value) => {
                  const newYear = value === "all" ? undefined : { ...filters.year, after: value };
                  setFilters({ ...filters, year: newYear });
                }}
              >
                <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year Before</Label>
              <Select
                value={filters.year?.before || "all"}
                onValueChange={(value) => {
                  const newYear = value === "all" ? undefined : { ...filters.year, before: value };
                  setFilters({ ...filters, year: newYear });
                }}
              >
                <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Season & Episode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                value={filters.season || ""}
                onChange={(e) => setFilters({ ...filters, season: e.target.value || undefined })}
                className="mt-2 bg-zinc-800 border-zinc-700"
                placeholder="e.g., 1"
              />
            </div>
            <div>
              <Label htmlFor="episode">Episode</Label>
              <Input
                id="episode"
                value={filters.episode || ""}
                onChange={(e) => setFilters({ ...filters, episode: e.target.value || undefined })}
                className="mt-2 bg-zinc-800 border-zinc-700"
                placeholder="e.g., 1"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            variant="destructive"
            onClick={onDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Row
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#E50914] hover:bg-[#E50914]/90">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
