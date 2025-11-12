export interface TypeFilters {
  count: number;
  category?: string[];
  quality?: string[];
  platform?: string[];
  year?: string[];
  language?: string[];
}

export interface Filters {
  generated: string;
  totalEntries: number;
  types: {
    Movie?: TypeFilters;
    Series?: TypeFilters;
    TV?: TypeFilters;
    Radio?: TypeFilters;
  };
}
