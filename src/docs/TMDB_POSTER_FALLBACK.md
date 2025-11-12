# TMDB Poster Fallback System - Simplified Approach

Complete documentation for the TMDB-first poster fallback system in the IPTV application.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Setup Instructions](#setup-instructions)
4. [How It Works](#how-it-works)
5. [Intelligent Caching System](#intelligent-caching-system)
6. [Usage Examples](#usage-examples)
7. [Configuration](#configuration)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

---

## Overview

The TMDB Poster Fallback System prioritizes high-quality TMDB posters over potentially incorrect provider images. This simplified approach ensures users always see the best available poster with intelligent caching.

### Key Benefits

- ✅ **TMDB-first approach** - Always tries TMDB before provider images
- ✅ **Simplified logic** - Clear priority: Cache → TMDB → Logo → Placeholder
- ✅ **15-day caching** - Long cache duration minimizes API calls
- ✅ **Universal caching** - Caches all results (TMDB/logo/placeholder)
- ✅ **Multi-language support** - Prioritizes Turkish → English → Any language
- ✅ **Zero re-queries** - Once resolved, never queries again for 15 days
- ✅ **Graceful degradation** - Shows elegant placeholder if all sources fail

---

## Features

### TMDB-First Priority

The system always tries TMDB API first, before the provider's poster URL. This ensures:
- Higher quality posters
- Consistent artwork across all content
- Correct posters when provider images are wrong

### Simplified Priority Order

1. **Cache** - Check 15-day cache first
2. **TMDB** - Fetch from TMDB API
3. **Logo** - Try original provider URL
4. **Placeholder** - Show "No Poster" message

### Multi-Language Support

Language priority order:
1. **Turkish (`tr`)** - First choice
2. **English (`en`)** - Second choice
3. **Any language** - Highest-rated poster if no match

Configurable in `/utils/posterFallback.ts`

### Universal Result Caching

Every poster resolution is cached for **15 days**, including:
- ✅ TMDB poster URLs
- ✅ Working provider logos
- ✅ "No Poster" placeholder status

This eliminates redundant queries and API calls completely.

### Intelligent Poster Selection

- Filters by preferred language
- Ranks by vote average
- Selects optimal size (w500 by default)
- Ensures high visual quality

---

## Setup Instructions

### Step 1: Get TMDB Bearer Token

1. Visit [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Create a free account (or log in)
3. Navigate to **Settings** → **API**
4. Click **Request an API Key** (choose "Developer")
5. Fill out the application form with your app details
6. Once approved, you'll receive:
   - **API Key (v3 auth)** - Short alphanumeric string ❌ *Don't use this*
   - **API Read Access Token (v4 auth)** - Long JWT token ✅ *Use this one*

The Bearer token is a JWT that starts with `eyJ...`

### Step 2: Configure Token

Open `/utils/posterFallback.ts` and replace the placeholder:

```typescript
// ❌ Before
const TMDB_BEARER_TOKEN = "YOUR_TMDB_BEARER_TOKEN";

// ✅ After
const TMDB_BEARER_TOKEN = "zyJhbGciOiJIUzI1QiJ9.eyJcdWQiOiIw..."; // Your actual token
```

### Step 3: Verify Setup

Open browser console and run:

```javascript
fetch('https://api.themoviedb.org/3/configuration', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'accept': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => console.log('✅ TMDB Working!', d))
  .catch(e => console.error('❌ Failed:', e));
```

**Expected Result:** JSON response with image configuration

### Step 4: That's It!

The system is now active and will automatically:
- ✅ Try TMDB first for every poster
- ✅ Cache all results for 15 days
- ✅ Fall back to provider logo if TMDB fails
- ✅ Display placeholder if both fail
- ✅ Never re-query cached results

---

## How It Works

### Visual Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│              PosterImage Component Mounts                   │
│              with src + title + type                        │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ 1. Show       │
                  │    Spinner    │
                  └───────┬───────┘
                          │
                          ▼
              ┌──────────────────────────┐
              │ 2. Check Result Cache    │
              │    (15 days TTL)         │
              └────────────┬─────────────┘
                           │
                  ┌────────┴─────────┐
                  │                  │
              FOUND              NOT FOUND
                  │                  │
                  │                  ▼
                  │       ┌──────────────────────┐
                  │       │ 3. TMDB Configured?  │
                  │       └──────────┬───────────┘
                  │                  │
                  │         ┌────────┴─────────┐
                  │         │                  │
                  │        YES                 NO
                  │         │                  │
                  │         ▼                  │
                  │  ┌──────────────────┐     │
                  │  │ 4. Check TMDB    │     │
                  │  │    API Cache     │     │
                  │  └────────┬─────────┘     │
                  │           │               │
                  │  ┌────────┴─────────┐    │
                  │  │                  │    │
                  │ CACHED          NOT CACHED
                  │  │                  │    │
                  │  │                  ▼    │
                  │  │         ┌─────────────────────┐
                  │  │         │ 5. API Call #1:     │
                  │  │         │    Get TMDB Config  │
                  │  │         └──────────┬──────────┘
                  │  │                    │
                  │  │                    ▼
                  │  │         ┌─────────────────────┐
                  │  │         │ 6. API Call #2:     │
                  │  │         │    Search Title     │
                  │  │         │    (TR then EN)     │
                  │  │         └──────────┬──────────┘
                  │  │                    │
                  │  └────────────────────┘
                  │           │
                  │           ▼
                  │    ┌─────────────┐
                  │    │  Found TMDB │
                  │    │  ID?        │
                  │    └──────┬──────┘
                  │           │
                  │  ┌────────┴─────────┐
                  │  │                  │
                  │ YES                 NO
                  │  │                  │
                  │  ▼                  │
                  │ ┌──────────────────┐│
                  │ │ 7. API Call #3:  ││
                  │ │    Get posters   ││
                  │ │    for TMDB ID   ││
                  │ └────────┬─────────┘│
                  │          │          │
                  │          ▼          │
                  │ ┌──────────────────┐│
                  │ │ 8. Select best   ││
                  │ │    poster        ││
                  │ │    (TR→EN→Any)   ││
                  │ └────────┬─────────┘│
                  │          │          │
                  │          ▼          │
                  │ ┌──────────────────┐│
                  │ │ 9. Cache image   ││
                  │ │    in Cache      ││
                  │ │    Storage       ││
                  │ └────────┬─────────┘│
                  │          │          │
                  │          ▼          │
                  │ ┌──────────────────┐│
                  │ │ 10. TMDB URL     ││
                  │ │     Found!       ││
                  │ └────────┬─────────┘│
                  │          │          │
                  └──────────┼──────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ 11. Cache result     │
                  │     (source: tmdb)   │
                  │     15 days          │
                  └──────────┬───────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ 12. Display     │
                    │     TMDB poster │
                    └─────────────────┘


              ┌─────────────────────────────────────┐
              │   If TMDB fails (NO at step 3/10)   │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
                      ┌──────────────────┐
                      │ 13. Try original │
                      │     logo URL     │
                      └────────┬─────────┘
                               │
                      ┌────────┴─────────┐
                      │                  │
                  SUCCESS              FAILED
                      │                  │
                      ▼                  ▼
            ┌─────────────────┐  ┌─────────────────┐
            │ 14. Cache result│  │ 15. Cache result│
            │     (source:    │  │     (source:    │
            │      logo)      │  │   placeholder)  │
            │     15 days     │  │     15 days     │
            └────────┬────────┘  └────────┬────────┘
                     │                    │
                     ▼                    ▼
            ┌─────────────────┐  ┌─────────────────┐
            │ 16. Display     │  │ 17. Display     │
            │     logo image  │  │     "No Poster" │
            │                 │  │     placeholder │
            └─────────────────┘  └─────────────────┘
```

### Process Breakdown

1. **Show Spinner** - Display loading state immediately
2. **Check Cache** - Look for cached result (TMDB/logo/placeholder)
3. **Cache Hit** - Use cached result instantly (skip all queries)
4. **Cache Miss** - Begin resolution process
5. **Try TMDB First** - Always attempt TMDB before provider logo
   - Search Turkish database first (`tr-TR`)
   - Fall back to English search (`en-US`)
   - Fetch available posters
   - Select best poster by language and rating
   - Cache image in Cache Storage
6. **Try Logo** - If TMDB fails, try original provider URL
7. **Placeholder** - If both fail, cache placeholder status
8. **Cache Result** - Save resolution for 15 days
9. **Display** - Show poster/logo/placeholder

### Key Differences from Old System

**Old Approach:**
- Tried provider logo first
- Only used TMDB on failure
- Different cache durations (1 day, 7 days)
- Re-queried working provider logos

**New Simplified Approach:**
- Always tries TMDB first
- Provider logo is fallback
- Unified 15-day cache for everything
- Never re-queries any cached result

---

## Intelligent Caching System

The system uses two caching layers:

### Layer 1: Result Cache (localStorage)

**Purpose**: Caches the final resolution (TMDB URL, logo URL, or placeholder status)

**Storage**: `localStorage` with key prefix `poster-result-`

**TTL**: 15 days

**Cache Key Format**: `poster-result-{base64(originalUrl+title)}-{type}`

**Data Structure**:
```typescript
{
  t: 1234567890,  // Timestamp
  result: {
    url: "https://image.tmdb.org/t/p/w500/abc123.jpg",
    source: "tmdb" | "logo" | "placeholder",
    meta: { /* Optional metadata */ }
  }
}
```

**Benefits**:
- Instant poster resolution on subsequent visits
- No API calls for 15 days
- Caches successful TMDB, working logos, AND placeholder status
- Prevents re-querying known failures

**Example**:
```javascript
// First visit
Show spinner → Try TMDB → Success → Cache result

// Any visit within 15 days
Check cache → Found! → Display instantly (no API calls, no retries)
```

### Layer 2: Image Cache (Cache Storage API)

**Purpose**: Caches actual poster image files

**Storage**: Browser Cache Storage API

**Cache Name**: `poster-cache-v1`

**TTL**: Indefinite (managed by browser)

**Benefits**:
- Fastest possible image loading
- Works offline after first load
- No size limitations unlike localStorage
- Automatic browser cleanup when storage is low

### Cache Interaction Diagram

```
Request Poster
     ↓
┌─────────────────────────────┐
│ Layer 1: Result Cache       │
│ (Have we resolved this?)    │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
   YES            NO
    │             │
    ├→ Return     └→ Try TMDB
    │  cached         ↓
    │  result     ┌──────────┐
    │            FOUND    NOT FOUND
    │             │          │
    │             ├→ Cache   └→ Try Logo
    │             │  result      ↓
    │             │         ┌──────────┐
    │             │        FOUND    NOT FOUND
    │             │         │          │
    │             │         ├→ Cache   └→ Placeholder
    │             │         │  result      ↓
    │             │         │          ┌───────────┐
    │             └─────────┼──────────┤ Cache     │
    │                       │          │ result    │
    └───────────────────────┘          └─────┬─────┘
                                             │
                                       ┌─────▼──────────────┐
                                       │ Layer 2: Image     │
                                       │ Cache (if URL)     │
                                       └─────┬──────────────┘
                                             │
                                       ┌─────▼─────┐
                                       │ Display   │
                                       └───────────┘
```

### Cache Management

**View Caches (DevTools Console)**:

```javascript
// View result cache
Object.keys(localStorage)
  .filter(key => key.startsWith('poster-result-'))
  .forEach(key => console.log(key, localStorage.getItem(key)));

// View TMDB API cache
Object.keys(localStorage)
  .filter(key => key.startsWith('tmdb-cache-'))
  .forEach(key => console.log(key, localStorage.getItem(key)));

// View image cache
caches.open('poster-cache-v1').then(cache => {
  cache.keys().then(keys => console.log('Cached images:', keys));
});
```

**Clear Caches**:

```javascript
// Clear result cache
Object.keys(localStorage)
  .filter(key => key.startsWith('poster-result-'))
  .forEach(key => localStorage.removeItem(key));

// Clear API cache
Object.keys(localStorage)
  .filter(key => key.startsWith('tmdb-cache-'))
  .forEach(key => localStorage.removeItem(key));

// Clear image cache
caches.delete('poster-cache-v1');
```

**Inspect in DevTools**:
1. **Application** → **Local Storage** → View `poster-result-*` and `tmdb-cache-*` keys
2. **Application** → **Cache Storage** → View `poster-cache-v1`
3. **Network** → Filter `themoviedb.org` → Should see 0 calls after first load

---

## Usage Examples

### Basic Usage

The poster fallback is **completely automatic**. Just use the `PosterImage` component:

```tsx
import { PosterImage } from "./components/PosterImage";

// ✅ Automatic TMDB-first fallback
<PosterImage
  src={item.logo}
  alt={item.name}
  title={item.name}
  type={item.type === "Series" ? "tv" : "movie"}
  className="h-full w-full object-cover"
/>
```

### Before vs After

**❌ Old Approach**:
```tsx
<img src={item.logo} alt={item.name} />
// Result: Shows provider image (might be wrong), broken on failure
```

**✅ New Approach (TMDB-First)**:
```tsx
<PosterImage
  src={item.logo}
  title={item.name}
  type="movie"
  className="..."
/>
// Result: Shows TMDB poster first, falls back to logo if needed
```

### Components Using PosterImage

**MovieCard** (`/components/MovieCard.tsx`):
```tsx
<PosterImage
  src={item.logo}
  alt={item.name}
  title={item.name}
  type={item.type === "Series" ? "tv" : "movie"}
  className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-110"
/>
```

**ContinueWatchingCard** (`/components/ContinueWatchingCard.tsx`):
```tsx
<PosterImage
  src={content.logo}
  alt={content.name}
  title={content.name}
  type={content.type === "Series" ? "tv" : "movie"}
  className="h-full w-full object-cover"
/>
```

**HeroSection** (`/components/HeroSection.tsx`):
```tsx
<PosterImage
  src={imageUrl}
  alt={title}
  title={title}
  type={item?.type === "Series" ? "tv" : "movie"}
  className="h-full w-full object-cover"
/>
```

### Real-World Example

**Scenario**: Provider has wrong poster for "21 Jump Street"

```
Console Output:
--------------
[User browses movies]

🎬 Trying TMDB for "21 Jump Street" (movie)
✅ Found TMDB ID: 64688
🖼️ TMDB poster: https://image.tmdb.org/t/p/w500/aEz15O11uRSLu4TUbu9OWRYs2j2.jpg (en)
💾 Cached poster result (tmdb) for "21 Jump Street" (15 days)

[User refreshes page or returns later]

✨ Using cached result (tmdb) for "21 Jump Street"
[Poster loads instantly from cache, no API calls]
```

### Loading States Visual Examples

**1. Loading State** (Fetching):
```tsx
<div className="animate-pulse bg-gradient-to-br from-zinc-800 to-zinc-900">
  <svg className="animate-spin">...</svg>
</div>
```
Animated gradient background with spinning loader.

**2. Success State** (TMDB or Logo):
```tsx
<img src="https://image.tmdb.org/t/p/w500/xyz.jpg" className="..." />
```
Displays TMDB poster or working logo.

**3. Placeholder State** (All sources failed):
```tsx
<div className="bg-gradient-to-br from-zinc-800 to-zinc-900">
  <svg>{/* Image icon */}</svg>
  <p>No Poster</p>
</div>
```
Elegant placeholder with icon and text. Cached for 15 days to avoid retries.

---

## Configuration

### Change Language Priority

Edit `/utils/posterFallback.ts`:

```typescript
// Current: Turkish → English → Any
const LANG_PRIORITY = ["tr", "en", ""];

// Example: English only
const LANG_PRIORITY = ["en", ""];

// Example: German → English → Turkish → Any
const LANG_PRIORITY = ["de", "en", "tr", ""];

// Example: Spanish → Any
const LANG_PRIORITY = ["es", ""];
```

### Change Poster Size

Edit the `tryTmdb` function in `/utils/posterFallback.ts`:

```typescript
// Current: w500 (500px wide)
const size = (cfg?.images?.poster_sizes || []).includes("w500") 
  ? "w500" 
  : (cfg?.images?.poster_sizes?.[0] || "w500");

// Example: w780 (higher quality, larger file)
const size = "w780";

// Example: original (highest quality, slowest)
const size = "original";

// Example: w342 (lower quality, faster)
const size = "w342";
```

**Available sizes**: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`

**Recommendation**: `w500` provides excellent quality-to-size ratio

### Adjust Cache Duration

Edit cache TTL constants in `/utils/posterFallback.ts`:

```typescript
// Current: 15 days for result cache
const FIFTEEN_DAYS = 15 * ONE_DAY;

// Examples:

// Cache for 30 days
const FIFTEEN_DAYS = 30 * ONE_DAY;

// Cache for 7 days
const FIFTEEN_DAYS = 7 * ONE_DAY;

// Cache forever (not recommended, no way to refresh)
const FIFTEEN_DAYS = Infinity;

// Short cache for testing (1 hour)
const FIFTEEN_DAYS = 60 * 60 * 1000;
```

**Note**: API response cache (searches, config) has separate TTL of 1-7 days

### Disable TMDB (Use Logo-Only)

Replace the Bearer token with the placeholder:

```typescript
const TMDB_BEARER_TOKEN = "YOUR_TMDB_BEARER_TOKEN";
```

The system will skip TMDB and go straight to trying the logo URL.

---

## Testing Guide

### Quick Verification

**Step 1: Verify Token Configuration**

```typescript
// In /utils/posterFallback.ts
const TMDB_BEARER_TOKEN = "zyJhbGciOiJI5gsI1NiJ9...";
```

**Step 2: Test TMDB API**

Open DevTools Console:

```javascript
fetch('https://api.themoviedb.org/3/configuration', {
  headers: {
    'Authorization': 'Bearer YOUR_TMDB_BEARER_TOKEN',
    'accept': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => console.log('✅ TMDB API Working!', d))
  .catch(e => console.error('❌ TMDB API Failed:', e));
```

**Expected Result**:
```json
{
  "images": {
    "secure_base_url": "https://image.tmdb.org/t/p/",
    "poster_sizes": ["w92", "w154", "w185", "w342", "w500", "w780", "original"]
  }
}
```

### Testing in the App

**Method 1: Monitor Console Logs**

1. Open DevTools → Console
2. Navigate to Movies or Series section
3. Watch for emoji indicators:
   - 🎬 = Trying TMDB
   - ✅ = Found TMDB ID
   - 🖼️ = Selected poster URL
   - 💾 = Cached result
   - ✨ = Using cached result
   - 📷 = Trying original logo
   - ❌ = Error occurred

**Expected Console Output (First Load)**:
```
🎬 Trying TMDB for "The Matrix" (movie)
✅ Found TMDB ID: 603
🖼️ TMDB poster: https://image.tmdb.org/t/p/w500/abc123.jpg (en)
💾 Cached poster result (tmdb) for "The Matrix" (15 days)
```

**Expected Console Output (Subsequent Loads)**:
```
✨ Using cached result (tmdb) for "The Matrix"
```

**Method 2: Manually Test Fallback Chain**

1. Open `/data/content.json` or `/data/mockContent.ts`
2. Change a movie's `logo` URL to an invalid one
3. Load the page and watch:
   - First: Tries TMDB (should succeed)
   - If TMDB fails: Tries logo URL (should fail)
   - Finally: Shows placeholder

**Method 3: Inspect Network Activity**

1. Open DevTools → Network
2. Filter: `themoviedb.org`
3. **First load**: Should see 3 API calls (config, search, images)
4. **Second load**: Should see **0 API calls** (all cached)

**Method 4: Inspect Cache Storage**

1. DevTools → Application → Cache Storage
2. Open `poster-cache-v1`
3. Verify TMDB poster images are cached

4. DevTools → Application → Local Storage
5. Filter for `poster-result-` keys
6. Verify final resolutions are cached

### Expected Console Messages

**✅ Success (TMDB)**:
```
🎬 Trying TMDB for "Movie Name" (movie)
✅ Found TMDB ID: 12345
🖼️ TMDB poster: https://image.tmdb.org/t/p/w500/xyz.jpg (en)
💾 Cached poster result (tmdb) for "Movie Name" (15 days)
```

**✅ Success (Logo Fallback)**:
```
🎬 Trying TMDB for "Obscure Movie" (movie)
❌ TMDB: Title not found
📷 Trying original logo URL
✅ Logo URL works
💾 Cached poster result (logo) for "Obscure Movie" (15 days)
```

**⚠️ Placeholder**:
```
🎬 Trying TMDB for "Unknown Movie" (movie)
❌ TMDB: Title not found
📷 Trying original logo URL
❌ Logo URL failed
💾 Cached poster result (placeholder) for "Unknown Movie" (15 days)
```

**✨ Cached Result**:
```
✨ Using cached result (tmdb) for "Movie Name"
```

**⚠️ Not Configured**:
```
⚠️ TMDB not configured, skipping
```

### Testing Checklist

- [ ] Bearer token configured (starts with `eyJ`)
- [ ] Configuration API call succeeds
- [ ] Search API call succeeds
- [ ] Console shows TMDB attempts for all posters
- [ ] TMDB posters load successfully
- [ ] Loading spinner displays during fetch
- [ ] Logo fallback works when TMDB fails
- [ ] Placeholder shows when both fail
- [ ] Results cache works (15 days)
- [ ] Second load has no API calls
- [ ] Image cache works (instant image load)
- [ ] Placeholder status is cached (no retries)

### Visual Success Indicators

**✅ Working Correctly**:
- All movie cards show posters (TMDB or logo)
- Hover effects work on all cards
- Console shows TMDB priority for all content
- Second page load is instant (no API calls)
- No repeated failures (placeholder cached)

**❌ Issues Detected**:
- Broken image icons (□) visible
- 401 errors in console
- "TMDB API error" messages
- Logo tried before TMDB
- API calls on every page load (cache not working)
- Repeated TMDB queries for same content

---

## Troubleshooting

### Common Issues & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| **401 Unauthorized** | Wrong or missing Bearer token | Verify token in `/utils/posterFallback.ts` starts with `eyJ` |
| **TMDB not tried first** | Old code cached | Clear browser cache and localStorage |
| **Repeated API calls** | Result cache not working | Check localStorage quota, clear old caches |
| **Placeholder not cached** | Old implementation | Update to latest posterFallback.ts |
| **Logo tried before TMDB** | Wrong component version | Update PosterImage.tsx to latest |

### Debug Commands

```javascript
// Check if token is configured
console.log(TMDB_BEARER_TOKEN !== "YOUR_TMDB_BEARER_TOKEN");

// View all cached results
Object.keys(localStorage)
  .filter(k => k.startsWith('poster-result-'))
  .map(k => ({ key: k, value: JSON.parse(localStorage.getItem(k)) }));

// Clear all poster caches
Object.keys(localStorage)
  .filter(k => k.startsWith('poster-result-') || k.startsWith('tmdb-cache-'))
  .forEach(k => localStorage.removeItem(k));
caches.delete('poster-cache-v1');
```

---

## API Reference

### `getPosterUrl(originalUrl, title, type)`

Main function to resolve poster URL with TMDB-first priority.

**Parameters:**
- `originalUrl: string` - Provider's poster URL
- `title: string` - Movie or series title
- `type: "tv" | "movie"` - Content type

**Returns:** `Promise<PosterResult>`

```typescript
interface PosterResult {
  url: string;                          // Empty if placeholder
  source: "tmdb" | "logo" | "placeholder";
  meta?: {
    tmdbId?: number;
    language?: string;
    size?: string;
  };
}
```

**Example:**
```typescript
const result = await getPosterUrl(
  "https://provider.com/poster.jpg",
  "Inception",
  "movie"
);

console.log(result);
// {
//   url: "https://image.tmdb.org/t/p/w500/xyz.jpg",
//   source: "tmdb",
//   meta: { tmdbId: 27205, language: "en", size: "w500" }
// }
```

### `isTmdbConfigured()`

Check if TMDB Bearer token is configured.

**Returns:** `boolean`

**Example:**
```typescript
if (isTmdbConfigured()) {
  console.log("TMDB is ready to use");
} else {
  console.log("TMDB token not configured");
}
```

---

## Performance Benefits

**Old System:**
- Logo load attempt: ~500ms
- TMDB fallback on failure: ~1.5s
- Total: ~2s for broken logos

**New System (First Load):**
- TMDB fetch: ~1s
- Cache result: instant
- Total: ~1s

**New System (Cached):**
- Check cache: <1ms
- Display result: instant
- Total: <1ms

**API Call Reduction:**
- Old: 3 calls per broken logo, retried on every page load
- New: 3 calls once, then 0 calls for 15 days

**Network Savings:**
- 100 movies with broken logos
- Old: 300 API calls per page load
- New: 300 API calls once, then 0 for 15 days
- **Savings: 99.9%+ reduction in API usage**

---

## License & Attribution

This system uses the TMDB API. When displaying TMDB posters, please include attribution:

"This product uses the TMDB API but is not endorsed or certified by TMDB."

TMDB logo: https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short.svg

---

**Last Updated**: October 2025  
**Version**: 2.0 (Simplified TMDB-First Approach)
