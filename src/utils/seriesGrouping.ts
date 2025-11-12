import { ContentItem } from "../types/content";

export interface GroupedSeries {
  representative: ContentItem; // The card to display
  allItems: ContentItem[]; // All episodes/seasons
  seasons: Map<string, ContentItem[]>; // Organized by season
}

/**
 * Group series by name, language, and type
 * Returns a map where key is the unique identifier and value is the grouped data
 */
export function groupSeriesByShow(items: ContentItem[]): Map<string, GroupedSeries> {
  const groups = new Map<string, GroupedSeries>();
  
  items.forEach(item => {
    // Only group Series type items
    if (item.type !== "Series") {
      // For non-series items, create a single-item group
      const key = `${item.type}-${item.id}`;
      groups.set(key, {
        representative: item,
        allItems: [item],
        seasons: new Map()
      });
      return;
    }
    
    // Create unique key based on name, language, and type
    const key = `${item.name}-${item.language || 'no-lang'}-${item.type}`;
    
    if (!groups.has(key)) {
      // Create new group
      groups.set(key, {
        representative: item,
        allItems: [item],
        seasons: new Map()
      });
    } else {
      // Add to existing group
      const group = groups.get(key)!;
      group.allItems.push(item);
      
      // Update representative if this item has a newer season/episode
      const current = group.representative;
      const currentSeason = parseInt(current.season || "0");
      const currentEpisode = parseInt(current.episode || "0");
      const newSeason = parseInt(item.season || "0");
      const newEpisode = parseInt(item.episode || "0");
      
      // Use the newest season/episode as representative
      if (newSeason > currentSeason || 
          (newSeason === currentSeason && newEpisode > currentEpisode)) {
        group.representative = item;
      }
    }
  });
  
  // Organize items by season for each group
  groups.forEach(group => {
    group.allItems.forEach(item => {
      const seasonKey = item.season || "unknown";
      if (!group.seasons.has(seasonKey)) {
        group.seasons.set(seasonKey, []);
      }
      group.seasons.get(seasonKey)!.push(item);
    });
    
    // Sort episodes within each season by episode number (descending - latest first)
    group.seasons.forEach((episodes, season) => {
      episodes.sort((a, b) => {
        const episodeA = parseInt(a.episode || "0");
        const episodeB = parseInt(b.episode || "0");
        return episodeB - episodeA; // Descending order
      });
    });
  });
  
  return groups;
}

/**
 * Get flattened array of representative items for display
 */
export function getRepresentativeItems(groups: Map<string, GroupedSeries>): ContentItem[] {
  return Array.from(groups.values()).map(group => group.representative);
}

/**
 * Get the full grouped data for a specific item
 */
export function getGroupForItem(
  item: ContentItem, 
  groups: Map<string, GroupedSeries>
): GroupedSeries | null {
  // For series, find by the group key
  if (item.type === "Series") {
    const key = `${item.name}-${item.language || 'no-lang'}-${item.type}`;
    return groups.get(key) || null;
  }
  
  // For non-series, find by individual key
  const key = `${item.type}-${item.id}`;
  return groups.get(key) || null;
}

/**
 * Get sorted seasons array (descending - newest first)
 */
export function getSortedSeasons(group: GroupedSeries): Array<{ season: string; episodes: ContentItem[] }> {
  const seasons = Array.from(group.seasons.entries())
    .map(([season, episodes]) => ({ season, episodes }));
  
  // Sort by season number (descending)
  seasons.sort((a, b) => {
    const seasonA = parseInt(a.season) || 0;
    const seasonB = parseInt(b.season) || 0;
    return seasonB - seasonA;
  });
  
  return seasons;
}
