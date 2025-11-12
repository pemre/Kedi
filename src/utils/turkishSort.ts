/**
 * Turkish-aware alphabetical sorting utility
 * 
 * Properly sorts Turkish characters in their correct alphabet order:
 * A, B, C, Ç, D, E, F, G, Ğ, H, I, İ, J, K, L, M, N, O, Ö, P, R, S, Ş, T, U, Ü, V, Y, Z
 */

import { ContentItem } from "../types/content";

/**
 * Turkish locale string for proper character comparison
 */
const TURKISH_LOCALE = "tr-TR";

/**
 * Compare two strings with Turkish locale awareness
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
export function turkishCompare(a: string, b: string): number {
  // Handle null/undefined values
  const aStr = a || '';
  const bStr = b || '';
  return aStr.localeCompare(bStr, TURKISH_LOCALE, { sensitivity: 'base' });
}

/**
 * Sort content items alphabetically by name with Turkish locale awareness
 */
export function sortByNameTurkish(items: ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => turkishCompare(a.name || '', b.name || ''));
}

/**
 * Sort strings alphabetically with Turkish locale awareness
 */
export function sortStringsTurkish(strings: string[]): string[] {
  return [...strings].sort((a, b) => turkishCompare(a, b));
}
