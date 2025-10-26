/**
 * Universal M3U Parser - Works in Browser, Electron, and Capacitor
 *
 * Parse metadata from M3U entries (specifically group-title, tvg-name, and tvg-logo attributes).
 * Transform M3U files into JSON structure with consistent field names and values.
 */

import { ContentItem } from "../types/content";

// Language code mapping
const languageCodeMap: Record<string, string> = {
  'TR': 'tur', 'TUR': 'tur', 'TURKCE': 'tur', 'TURKIYE': 'tur',
  'ALB': 'alb', 'AL': 'alb',
  'AZ': 'aze', 'AZE': 'aze',
  'DE': 'deu', 'DEU': 'deu', 'GER': 'deu',
  'NL': 'dut', 'DUT': 'dut', 'NED': 'dut',
  'EN': 'eng', 'ENG': 'eng', 'UK': 'eng', 'US': 'eng', 'USA': 'eng',
  'FR': 'fra', 'FRA': 'fra',
  'PT': 'por', 'POR': 'por'
};

function detectLanguage(groupTitle: string): string | null {
  const upperTitle = groupTitle.toUpperCase();

  // Check for language codes in brackets or pipes
  const langMatch = upperTitle.match(/[\[|]([A-Z]{2,3})[\]|]/);
  if (langMatch) {
    const code = langMatch[1];
    if (languageCodeMap[code]) {
      return languageCodeMap[code];
    }
  }

  // Check for TURKCE or TURKIYE
  if (upperTitle.includes('TURKCE') || upperTitle.includes('TURKIYE')) {
    return 'tur';
  }

  return null;
}

function detectMedia(groupTitle: string): string | null {
  const upperTitle = groupTitle.toUpperCase();

  // Live TV: contains brackets
  if (/\[[A-Z]{2,3}\]/.test(upperTitle)) {
    return 'Live';
  }

  // Radio: contains radio/radyo
  if (upperTitle.includes('RADIO') || upperTitle.includes('RADYO')) {
    return 'Live';
  }

  // On Demand: contains pipes
  if (/\|[A-Z]{2,3}\|/.test(upperTitle)) {
    return 'On Demand';
  }

  return null;
}

function detectType(groupTitle: string, tvgName: string): string | null {
  const upperTitle = groupTitle.toUpperCase();
  const upperName = tvgName.toUpperCase();

  // Check for series patterns in tvg-name first (S..E.. or S..E...)
  if (/S\d{2,}E\d{2,}/.test(upperName)) {
    return 'Series';
  }

  // Check group-title for series
  if (upperTitle.includes('DIZI') || upperTitle.includes('SERIES')) {
    return 'Series';
  }

  // Check group-title for movies
  if (upperTitle.includes('FILM') || upperTitle.includes('MOVIE') ||
      upperTitle.includes('CINEMA') || upperTitle.includes('BIOSCOOP')) {
    return 'Movie';
  }

  // Check for radio
  if (upperTitle.includes('RADIO') || upperTitle.includes('RADYO')) {
    return 'Radio';
  }

  // Default based on media detection
  if (/\[[A-Z]{2,3}\]/.test(upperTitle)) {
    return 'TV';
  }

  if (/\|[A-Z]{2,3}\|/.test(upperTitle)) {
    return 'Movie';
  }

  return null;
}

function detectSeasonEpisode(tvgName: string): { season: string | null; episode: string | null } {
  const match = tvgName.match(/S(\d{2,})E(\d{2,})/i);
  if (match) {
    return {
      season: String(parseInt(match[1], 10)),
      episode: String(parseInt(match[2], 10))
    };
  }
  return { season: null, episode: null };
}

function detectCategory(groupTitle: string): string | null {
  const upperTitle = groupTitle.toUpperCase();

  if (upperTitle.includes('SPOR')) return 'Sports';
  if (upperTitle.includes('SINEMA') || upperTitle.includes('FILM') ||
      upperTitle.includes('CINEMA') || upperTitle.includes('BIOSCOOP') ||
      upperTitle.includes('MOVIE')) return 'Movies';
  if (upperTitle.includes('COCUK') || upperTitle.includes('KIDS') ||
      upperTitle.includes('KINDER') || upperTitle.includes('ENFANT')) return 'Kids';
  if (upperTitle.includes('HABER') || upperTitle.includes('NEWS')) return 'News';
  if (upperTitle.includes('BELGESEL') || upperTitle.includes('DOCUMENTARE') ||
      upperTitle.includes('DOCUMANTAIRE')) return 'Documentary';
  if (upperTitle.includes('CLASSIC')) return 'Classic';
  if (upperTitle.includes('RELAXATION')) return 'Relaxation';
  if (upperTitle.includes('MUZIK') || upperTitle.includes('MUSIQUE') ||
      upperTitle.includes('MUZIEK')) return 'Music';
  if (upperTitle.includes('ADULT')) return 'Adult';
  if (upperTitle.includes('DIL EGITIMI') || upperTitle.includes('DİL EĞİTİMİ')) return 'Language Education';

  return null;
}

function detectQuality(groupTitle: string): string | null {
  const upperTitle = groupTitle.toUpperCase();

  if (upperTitle.includes('4K')) return '4K';
  if (upperTitle.includes('UHD')) return 'UHD';
  if (upperTitle.includes('FHD')) return 'FHD';

  return null;
}

function detectPlatform(groupTitle: string): string | null {
  const lowerTitle = groupTitle.toLowerCase();

  if (lowerTitle.includes('amazon')) return 'Amazon Prime';
  if (lowerTitle.includes('blu')) return 'BluTV';
  if (lowerTitle.includes('disney')) return 'Disney+';
  if (lowerTitle.includes('ex-xen') || lowerTitle.includes('exxen')) return 'Exxen';
  if (lowerTitle.includes('gain')) return 'GAİN';
  if (lowerTitle.includes('hbo')) return 'HBO Max';
  if (lowerTitle.includes('netflix') || lowerTitle.includes('netfliix') ||
      lowerTitle.includes('netfilix')) return 'Netflix';
  if (lowerTitle.includes('paramount-plus')) return 'Paramount Plus';
  if (lowerTitle.includes('tabii')) return 'Tabii';
  if (lowerTitle.includes('yesilcam')) return 'Yeşilçam';
  if (lowerTitle.includes('apple')) return 'Apple TV';

  return null;
}

function detectYear(groupTitle: string, tvgName: string): string | null {
  // First check tvg-name (takes priority)
  const nameMatch = tvgName.match(/\(((19|20)\d{2})\)/);
  if (nameMatch) {
    return nameMatch[1];
  }

  // Then check group-title
  const titleMatch = groupTitle.match(/(202[0-9])/);
  if (titleMatch) {
    return titleMatch[1];
  }

  return null;
}

function extractName(tvgName: string): string | null {
  let name = tvgName;

  // Remove season/episode info (S01E01, S01E001, etc.)
  name = name.replace(/S\d{2,}E\d{2,}/gi, '');

  // Remove year in parentheses
  name = name.replace(/\s*\((19|20)\d{2}\)\s*/g, '');

  // Remove language/quality codes in brackets or pipes
  name = name.replace(/\s*[\[|][A-Z0-9]+[\]|]\s*/g, '');

  // Remove country prefix (TR:, NL:, etc.)
  name = name.replace(/^[A-Z]{2,3}\s*:\s*/i, '');

  // Remove quality indicators
  name = name.replace(/\s*(4K|UHD|FHD|HD)\s*/gi, '');

  // Clean up extra whitespace
  name = name.trim().replace(/\s+/g, ' ');

  return name || null;
}

/**
 * Parse M3U content string and convert to ContentItem array
 * @param content - M3U file content as string
 * @returns Array of ContentItem objects
 */
export function parseM3U(content: string): ContentItem[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const entries: ContentItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      // Parse metadata
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);

      const groupTitle = groupTitleMatch ? groupTitleMatch[1] : '';
      const tvgName = tvgNameMatch ? tvgNameMatch[1] : '';
      const tvgLogo = tvgLogoMatch ? tvgLogoMatch[1] : null;

      // Get URL from next line
      const url = lines[i + 1] || '';

      // Extract all fields
      const language = detectLanguage(groupTitle);
      const media = detectMedia(groupTitle);
      const type = detectType(groupTitle, tvgName);
      const { season, episode } = detectSeasonEpisode(tvgName);
      const category = detectCategory(groupTitle);
      const quality = detectQuality(groupTitle);
      const platform = detectPlatform(groupTitle);
      const year = detectYear(groupTitle, tvgName);
      const name = extractName(tvgName);

      entries.push({
        id: (i / 2) + 1, // Generate sequential ID
        name,
        language,
        media,
        type,
        category,
        quality,
        platform,
        year,
        season,
        episode,
        logo: tvgLogo,
        url,
        source: 'IPTV'
      } as ContentItem);

      i++; // Skip the URL line
    }
  }

  return entries;
}

/**
 * Validate M3U content format
 * @param content - M3U file content as string
 * @returns true if valid M3U format
 */
export function isValidM3U(content: string): boolean {
  return content.trim().startsWith('#EXTM3U') || content.includes('#EXTINF:');
}

