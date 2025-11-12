import { ContentItem, ContentRowFilters } from "../types/content";

interface SimpleFilters {
  category: string;
  platform: string;
  quality: string;
  year: string;
  language: string;
}

interface LiveTVFilters {
  category: string;
  quality: string;
  language: string;
}

interface RadioFilters {
  category: string;
  language: string;
}

export function applySimpleFilters(items: ContentItem[], filters: SimpleFilters): ContentItem[] {
  return items.filter(item => {
    // Category filter - case-insensitive comparison
    if (filters.category !== "all") {
      const itemCategory = (item.category || "").toLowerCase();
      const filterCategory = filters.category.toLowerCase();
      if (itemCategory !== filterCategory) {
        return false;
      }
    }

    // Platform filter - normalize both sides (lowercase + replace spaces with hyphens)
    if (filters.platform !== "all") {
      const itemPlatform = (item.platform || "").toLowerCase().replace(/\s+/g, '-');
      const filterPlatform = filters.platform.toLowerCase().replace(/\s+/g, '-');
      if (itemPlatform !== filterPlatform) {
        return false;
      }
    }

    // Quality filter - case-insensitive comparison
    if (filters.quality !== "all") {
      const itemQuality = (item.quality || "").toLowerCase();
      const filterQuality = filters.quality.toLowerCase();
      if (itemQuality !== filterQuality) {
        return false;
      }
    }

    // Year filter
    if (filters.year !== "all") {
      if (filters.year.endsWith("s")) {
        // Decade filter (e.g., "2010s", "2000s")
        const decade = parseInt(filters.year);
        const itemYear = parseInt(item.year || "0");
        if (itemYear < decade || itemYear >= decade + 10) {
          return false;
        }
      } else {
        // Exact year
        if (item.year !== filters.year) {
          return false;
        }
      }
    }

    // Language filter - case-insensitive comparison
    if (filters.language !== "all") {
      const itemLanguage = (item.language || "").toLowerCase();
      const filterLanguage = filters.language.toLowerCase();
      if (itemLanguage !== filterLanguage) {
        return false;
      }
    }

    return true;
  });
}

export function filterContent(items: ContentItem[], filters: ContentRowFilters): ContentItem[] {
  return items.filter(item => {
    // Language filter (multi-select) - case-insensitive
    if (filters.language && filters.language.length > 0) {
      const itemLanguage = (item.language || "").toLowerCase();
      const hasMatch = filters.language.some(lang => lang.toLowerCase() === itemLanguage);
      if (!hasMatch) {
        return false;
      }
    }

    // Media filter
    if (filters.media && item.media !== filters.media) {
      return false;
    }

    // Type filter
    if (filters.type && item.type !== filters.type) {
      return false;
    }

    // Category filter (multi-select) - case-insensitive
    if (filters.category && filters.category.length > 0) {
      const itemCategory = (item.category || "").toLowerCase();
      const hasMatch = filters.category.some(cat => cat.toLowerCase() === itemCategory);
      if (!hasMatch) {
        return false;
      }
    }

    // Quality filter (multi-select) - case-insensitive
    if (filters.quality && filters.quality.length > 0) {
      const itemQuality = (item.quality || "").toLowerCase();
      const hasMatch = filters.quality.some(qual => qual.toLowerCase() === itemQuality);
      if (!hasMatch) {
        return false;
      }
    }

    // Platform filter (multi-select) - normalize both sides (lowercase + replace spaces with hyphens)
    if (filters.platform && filters.platform.length > 0) {
      const itemPlatform = (item.platform || "").toLowerCase().replace(/\s+/g, '-');
      const hasMatch = filters.platform.some(plat => plat.toLowerCase().replace(/\s+/g, '-') === itemPlatform);
      if (!hasMatch) {
        return false;
      }
    }

    // Name contains filter
    if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }

    // Year filter
    if (filters.year) {
      if (filters.year.after && item.year) {
        if (parseInt(item.year) < parseInt(filters.year.after)) {
          return false;
        }
      }
      if (filters.year.before && item.year) {
        if (parseInt(item.year) > parseInt(filters.year.before)) {
          return false;
        }
      }
    }

    // Season filter
    if (filters.season && item.season !== filters.season) {
      return false;
    }

    // Episode filter
    if (filters.episode && item.episode !== filters.episode) {
      return false;
    }

    return true;
  });
}

export function applyLiveTVFilters(items: ContentItem[], filters: LiveTVFilters): ContentItem[] {
  return items.filter(item => {
    // Category filter - case-insensitive comparison
    if (filters.category !== "all") {
      const itemCategory = (item.category || "").toLowerCase();
      const filterCategory = filters.category.toLowerCase();
      if (itemCategory !== filterCategory) {
        return false;
      }
    }

    // Quality filter - case-insensitive comparison
    if (filters.quality !== "all") {
      const itemQuality = (item.quality || "").toLowerCase();
      const filterQuality = filters.quality.toLowerCase();
      if (itemQuality !== filterQuality) {
        return false;
      }
    }

    // Language filter - case-insensitive comparison
    if (filters.language !== "all") {
      const itemLanguage = (item.language || "").toLowerCase();
      const filterLanguage = filters.language.toLowerCase();
      if (itemLanguage !== filterLanguage) {
        return false;
      }
    }

    return true;
  });
}

export function applyRadioFilters(items: ContentItem[], filters: RadioFilters): ContentItem[] {
  return items.filter(item => {
    // Category filter - case-insensitive comparison
    if (filters.category !== "all") {
      const itemCategory = (item.category || "").toLowerCase();
      const filterCategory = filters.category.toLowerCase();
      if (itemCategory !== filterCategory) {
        return false;
      }
    }

    // Language filter - case-insensitive comparison
    if (filters.language !== "all") {
      const itemLanguage = (item.language || "").toLowerCase();
      const filterLanguage = filters.language.toLowerCase();
      if (itemLanguage !== filterLanguage) {
        return false;
      }
    }

    return true;
  });
}
