import { ContentRowConfig } from "../types/content";

const STORAGE_KEY = "iptv_content_rows";

export function getDefaultRows(): ContentRowConfig[] {
  return [
    {
      id: "row-1",
      title: "2025 Movies",
      filters: {
        type: "Movie",
        year: { after: "2024" }
      },
      order: 0,
      limit: 10
    },
    {
      id: "row-2",
      title: "2025 Turkish Movies",
      filters: {
        type: "Movie",
        language: ["tur"],
        year: { after: "2024" }
      },
      order: 1,
      limit: 10
    },
    {
      id: "row-3",
      title: "TV Shows",
      filters: {
        type: "Series"
      },
      order: 2,
      limit: 10
    },
    {
      id: "row-4",
      title: "Turkish TV Shows",
      filters: {
        type: "Series",
        language: ["tur"]
      },
      order: 3,
      limit: 10
    },
    {
      id: "row-5",
      title: "Turkish Live TVs",
      filters: {
        type: "TV",
        language: ["tur"]
      },
      order: 4,
      limit: 10
    }
  ];
}

export function loadRows(): ContentRowConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const rows = JSON.parse(stored);
      // Ensure all rows have a limit field (for backward compatibility)
      const rowsWithLimit = rows.map((row: ContentRowConfig) => ({
        ...row,
        limit: row.limit || 10
      }));
      return rowsWithLimit.sort((a: ContentRowConfig, b: ContentRowConfig) => a.order - b.order);
    }
  } catch (error) {
    console.error("Error loading rows from localStorage:", error);
  }
  
  // Return default rows if nothing stored
  const defaultRows = getDefaultRows();
  saveRows(defaultRows);
  return defaultRows;
}

export function saveRows(rows: ContentRowConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch (error) {
    console.error("Error saving rows to localStorage:", error);
  }
}

export function generateRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
