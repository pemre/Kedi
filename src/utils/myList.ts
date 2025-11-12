import { ContentItem } from "../types/content";
import { sortByNameTurkish } from "./turkishSort";

const MY_LIST_KEY = "iptv_my_list";

export function getMyList(): ContentItem[] {
  try {
    const stored = localStorage.getItem(MY_LIST_KEY);
    const list = stored ? JSON.parse(stored) : [];
    // Return sorted list
    return sortByNameTurkish(list);
  } catch (error) {
    console.error("Error loading my list:", error);
    return [];
  }
}

export function saveMyList(items: ContentItem[]): void {
  try {
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving my list:", error);
  }
}

export function addToMyList(item: ContentItem): ContentItem[] {
  const currentList = getMyList();
  
  // Check if item already exists (by URL)
  const exists = currentList.some(listItem => listItem.url === item.url);
  
  if (!exists) {
    const updatedList = [...currentList, item];
    saveMyList(updatedList);
    return updatedList;
  }
  
  return currentList;
}

export function removeFromMyList(itemUrl: string): ContentItem[] {
  const currentList = getMyList();
  const updatedList = currentList.filter(item => item.url !== itemUrl);
  saveMyList(updatedList);
  return updatedList;
}

export function isInMyList(itemUrl: string): boolean {
  const currentList = getMyList();
  return currentList.some(item => item.url === itemUrl);
}
