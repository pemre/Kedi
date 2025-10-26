/**
 * Parse metadata from M3U entries (specifically group-title, tvg-name, and tvg-logo attributes).
 * Transform M3U files into JSON structure with consistent field names and values.
 * Classify content into structured fields:
 *
 * {
 *    "id": number,
 *    "language": "alb" | "aze" | ... | null,
 *    "media": "Live" | "On Demand" | null,
 *    "type": "TV" | "Radio" | "Movie" | "Series" | null,
 *    "category": "Sports" | "Movies" | "Kids" | ... | null,
 *    "quality": "4K" | "UHD" | "FHD" | null,
 *    "platform": "Apple TV" | "BluTV" | ... | null,
 *    "year": "19xx" | "20xx" | null,
 *    "season": "1" | "2" | "3" | ... | null,
 *    "episode": "1" | "2" | "3" | ... | null,
 *    "logo": "URL" | null,
 *    "url": "URL"
 * }
 */

// --- Detect 'language': 'alb' | 'aze' | 'deu' | 'dut' | 'eng' | 'fra' | 'por' | 'tur'
// IF "group-title" CONTAINS ('[..]' || '[...]' || '|..|' || '|...|') THEN set language based on two or three letter code. Examples: [TR], |DE|, [NL], |AZ|, [PT], [ALB], [UK]
// IF "group-title" CONTAINS ('TURKCE' || 'TURKIYE') THEN language = 'tur'


// --- Detect 'media': 'Live' | 'On Demand' | null
// IF "group-title" CONTAINS ('[..]' || '[...]')  THEN media = 'Live'      AND type = 'TV'
// IF "group-title" CONTAINS ('radio' || 'radyo') THEN media = 'Live'      AND type = 'Radio'
// IF "group-title" CONTAINS ('|..|' || '|...|')  THEN media = 'On Demand' AND type = 'Movie'


// --- Override 'type': 'TV' | 'Radio' | 'Movie' | 'Series' | null
// IF "group-title" CONTAINS ('dizi' || 'series')                          THEN type = 'Series'
// IF "group-title" CONTAINS ('film' || 'movie' || 'cinema' || 'bioscoop') THEN type = 'Movie'


// --- Override 'type'
// --- Override 'season': '1' | '2' | '3' | ... | null
// --- Override 'episode': '1' | '2' | '3' | ... | null
// IF "tvg-name" CONTAINS ('S..E..' or 'S..E...' or 'S...E...')
//    THEN type = 'Series'
//    AND season based on two or more digit code. Examples: S01, S02, S10
//    AND episode based on two or more digit code. Examples: E01, E05, E12, E100, E250


// --- Detect 'category': 'Sports' | 'Movies' | 'Kids' | 'News' | 'Classic' | 'Relaxation' | 'Documentary' | 'Music' | 'Adult' | 'Language Education' | null
// IF "group-title" CONTAINS ('spor')                                                  THEN category = 'Sports'
// IF "group-title" CONTAINS ('sinema' || 'film' || 'cinema' || 'bioscoop' || 'movie') THEN category = 'Movies'
// IF "group-title" CONTAINS ('COCUK' || 'KIDS' || 'KİNDER' || 'ENFANT')               THEN category = 'Kids'
// IF "group-title" CONTAINS ('HABER' || 'NEWS')                                       THEN category = 'News'
// IF "group-title" CONTAINS ('BELGESEL' || 'DOCUMENTARE' || 'DOCUMANTAIRE')           THEN category = 'Documentary'
// IF "group-title" CONTAINS ('CLASSiC')                                               THEN category = 'Classic'
// IF "group-title" CONTAINS ('RELAXATION')                                            THEN category = 'Relaxation'
// IF "group-title" CONTAINS ('MUZiK' || 'MUSIQUE' || 'MUZIEK')                        THEN category = 'Music'
// IF "group-title" CONTAINS ('ADULT')                                                 THEN category = 'Adult'
// IF "group-title" CONTAINS ('DİL EĞİTİMİ')                                           THEN category = 'Language Education'


// --- Detect 'quality': '4K' | 'UHD' | 'FHD' | null
// IF "group-title" CONTAINS ('4K') > quality: '4K'
// IF "group-title" CONTAINS ('UHD') > quality: 'UHD'
// IF "group-title" CONTAINS ('FHD') THEN quality = 'FHD'


// --- Detect 'platform': 'Apple TV' | 'BluTV' | 'Disney+' | 'Exxen' | 'GAİN' | 'HBO Max' | 'Netflix' | 'Paramount Plus' | 'Tabii' | 'Amazon Prime' | null
// IF "group-title" CONTAINS ('amazon')                              THEN platform = 'Amazon Prime'
// IF "group-title" CONTAINS ('blu')                                 THEN platform = 'BluTV'
// IF "group-title" CONTAINS ('disney')                              THEN platform = 'Disney+'
// IF "group-title" CONTAINS ('ex-xen' || 'exxen')                   THEN platform = 'Exxen'
// IF "group-title" CONTAINS ('gain')                                THEN platform = 'GAİN'
// IF "group-title" CONTAINS ('hbo')                                 THEN platform = 'HBO Max'
// IF "group-title" CONTAINS ('netflix' || 'netfliix' || 'netfilix') THEN platform = 'Netflix'
// IF "group-title" CONTAINS ('paramount-plus')                      THEN platform = 'Paramount Plus'
// IF "group-title" CONTAINS ('tabii')                               THEN platform = 'Tabii'
// IF "group-title" CONTAINS ('yesilcam')                            THEN platform = 'Yeşilçam'
// IF "group-title" CONTAINS ('apple')                               THEN platform = 'Apple TV'


// --- Detect 'year': '19xx' | '20xx' | null
// IF "group-title" CONTAINS ('202.') THEN set year based on four digit code. Examples: 2020, 2021, 2022, 2023, 2024, 2025


// --- Override 'year': '19xx' | '20xx' | null
// IF "tvg-name" CONTAINS ('(19..)' || '(20..)') THEN set year based on four digit code. Examples: 1900-1999, 2000-2030


// --- Set 'logo': 'URL' | null
// IF "tvg-logo" CONTAINS (URL) THEN logo = URL


// --- Set 'url': 'URL'
// All entries have a URL in the second line after the metadata line.
// SET url = URL from second line.

// --- Extract 'name': 'string' | null
// IF "tvg-name" CONTAINS (string) THEN name = string
//    WITHOUT season/episode/year info. Example: "Breaking Bad", "La Casa de Papel", "The Mandalorian", "Game of Thrones"
//    WITHOUT country name or quality.
//      Example: "NL: EUROSPORT 1 FHD" > name = "EUROSPORT 1"
//      Example: "TR: TEMPO TV" > name = "TEMPO TV"
//      Example: "TR:Max Vizyon 3" > name = "Max Vizyon 3"
//      Example:
//   WITHOUT year info. Example: "Outbreak (2024)" > name = "Outbreak"
//   WITHOUT country/language/quality/year info.
//      Example: "Cleopatra's Final Secret |NL| (2025)" > name = "Cleopatra's Final Secret"
//      Example: "The Wrong Paris |4K| (2025)" > name = "The Wrong Paris"


const fs = require('fs');

// Parse command-line arguments
const args = process.argv.slice(2);
const inputFile = args[0] || 'iptv.m3u';
const outputFile = args[1] || inputFile.replace(/\.m3u$/, '.json');

console.log(`Input file: ${inputFile}`);
console.log(`Output file: ${outputFile}`);

// Language code mapping
const languageCodeMap = {
  'TR': 'tur', 'TUR': 'tur', 'TURKCE': 'tur', 'TURKIYE': 'tur',
  'ALB': 'alb', 'AL': 'alb',
  'AZ': 'aze', 'AZE': 'aze',
  'DE': 'deu', 'DEU': 'deu', 'GER': 'deu',
  'NL': 'dut', 'DUT': 'dut', 'NED': 'dut',
  'EN': 'eng', 'ENG': 'eng', 'UK': 'eng', 'US': 'eng', 'USA': 'eng',
  'FR': 'fra', 'FRA': 'fra',
  'PT': 'por', 'POR': 'por'
};

function detectLanguage(groupTitle) {
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

function detectMedia(groupTitle) {
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

function detectType(groupTitle, tvgName) {
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

function detectSeasonEpisode(tvgName) {
  const match = tvgName.match(/S(\d{2,})E(\d{2,})/i);
  if (match) {
    return {
      season: String(parseInt(match[1], 10)),
      episode: String(parseInt(match[2], 10))
    };
  }
  return { season: null, episode: null };
}

function detectCategory(groupTitle) {
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

function detectQuality(groupTitle) {
  const upperTitle = groupTitle.toUpperCase();

  if (upperTitle.includes('4K')) return '4K';
  if (upperTitle.includes('UHD')) return 'UHD';
  if (upperTitle.includes('FHD')) return 'FHD';

  return null;
}

function detectPlatform(groupTitle) {
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

function detectYear(groupTitle, tvgName) {
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

function extractName(tvgName) {
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

function parseM3U(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const entries = [];

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
        id: i + 1,
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
      });

      i++; // Skip the URL line
    }
  }

  return entries;
}

// Main execution
try {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file '${inputFile}' not found.`);
    process.exit(1);
  }

  console.log('Reading M3U file...');
  const content = fs.readFileSync(inputFile, 'utf-8');

  console.log('Parsing entries...');
  const entries = parseM3U(content);

  console.log(`Parsed ${entries.length} entries.`);
  console.log('Writing JSON file...');

  fs.writeFileSync(outputFile, JSON.stringify(entries, null, 2), 'utf-8');

  console.log(`✓ Successfully converted to ${outputFile}`);
  console.log(`Total entries: ${entries.length}`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

