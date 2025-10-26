# IPTV M3U to JSON Conversion Feature

## Overview
This feature enables the Electron app to download M3U playlist files from IPTV sources, convert them to JSON format, and cache them locally for efficient access.

## How It Works

### 1. User Flow
1. User navigates to Settings page
2. Enables "IPTV Source" toggle
3. Enters an M3U URL (e.g., `http://example.com/playlist.m3u`)
4. Clicks "Sync Now"
5. App downloads the M3U file, converts it to JSON, and caches it locally
6. Cache information is displayed (item count, file size, location)

### 2. Technical Flow
```
User enters M3U URL
    ↓
Settings Page → syncIPTVData()
    ↓
IPC: iptv:downloadAndConvert
    ↓
Electron Main Process:
    1. Download M3U file from URL
    2. Save to temp location
    3. Run m3u-to-json.cjs converter
    4. Save JSON to cache location
    5. Return success + metadata
    ↓
Update Settings (last sync time)
    ↓
Display cache info to user
```

### 3. Cache Storage Locations

**Development:**
- JSON: `/Users/user/Desktop/keditv/iptv-cache.json`
- M3U: `/Users/user/Desktop/keditv/iptv-cache.m3u` (for debugging)
- Easy to inspect and debug during development

**Production:**
- macOS: 
  - `~/Library/Application Support/kedi-tv/iptv-cache.json`
  - `~/Library/Application Support/kedi-tv/iptv-cache.m3u`
- Windows: 
  - `%APPDATA%/kedi-tv/iptv-cache.json`
  - `%APPDATA%/kedi-tv/iptv-cache.m3u`
- Linux: 
  - `~/.config/kedi-tv/iptv-cache.json`
  - `~/.config/kedi-tv/iptv-cache.m3u`

## API Reference

### Electron IPC Handlers

#### `iptv:downloadAndConvert`
Downloads M3U file and converts to JSON.
```javascript
window.electron.iptv.downloadAndConvert(url)
```
**Parameters:**
- `url` (string): M3U file URL

**Returns:**
```typescript
{
  success: boolean;
  itemCount?: number;
  cacheSize?: number;
  cachePath?: string;
  error?: string;
}
```

#### `iptv:loadCache`
Loads cached JSON data.
```javascript
window.electron.iptv.loadCache()
```
**Returns:**
```typescript
{
  success: boolean;
  data?: ContentItem[];
  cacheSize?: number;
  cachePath?: string;
  error?: string;
}
```

#### `iptv:getCacheInfo`
Gets information about the cache without loading data.
```javascript
window.electron.iptv.getCacheInfo()
```
**Returns:**
```typescript
{
  success: boolean;
  exists?: boolean;
  itemCount?: number;
  cacheSize?: number;
  cachePath?: string;
  lastModified?: string;
  error?: string;
}
```

#### `iptv:clearCache`
Deletes the cache file.
```javascript
window.electron.iptv.clearCache()
```
**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `iptv:onProgress`
Listen for progress updates during download/conversion.
```javascript
const cleanup = window.electron.iptv.onProgress((message) => {
  console.log(message);
});

// Later, clean up the listener
cleanup();
```

## Files Modified

### Electron Layer
1. **`electron/main.js`**
   - Added HTTP/HTTPS download functionality
   - Added M3U to JSON conversion using child process
   - Added IPC handlers for cache management
   - Added cache path resolver (dev vs production)

2. **`electron/preload.js`**
   - Exposed IPTV IPC methods to renderer process
   - Added progress event listener

### React/TypeScript Layer
3. **`src/types/electron.d.ts`** (NEW)
   - TypeScript declarations for Electron API
   - Proper typing for all IPC methods

4. **`src/utils/iptvSync.ts`**
   - Completely rewritten for Electron-only mode
   - Uses IPC calls instead of fetch + localStorage
   - Added async cache loading functions
   - Added cache info retrieval

5. **`src/utils/dataLoader.ts`**
   - Updated to use async `loadIPTVDataAsync()`
   - Maintains backward compatibility with Plex integration

6. **`src/pages/SettingsPage.tsx`**
   - Added cache info display section
   - Shows item count, file size, and cache location
   - Added progress listener for sync operations
   - Auto-refreshes cache info after sync

## Benefits

### ✅ No localStorage Limitations
- M3U files can be any size (10MB, 50MB, 100MB+)
- No 5-10MB browser storage limits

### ✅ Better Performance
- File system is faster than localStorage for large data
- Efficient JSON parsing
- Memory-efficient loading

### ✅ Persistent Caching
- Cache survives app restarts
- No data loss on browser clear
- Proper file system management

### ✅ Reuses Existing Logic
- Leverages `electron/helpers/m3u-to-json.cjs`
- No need to rewrite M3U parser
- Consistent data format

### ✅ Progress Tracking
- Real-time feedback during download
- Shows conversion progress
- Clear error messages

## Auto-Sync Feature

The feature supports automatic synchronization:
- Configure sync interval (1-30 days)
- Set preferred sync time (24h format)
- Automatically downloads and converts M3U files
- Updates cache in the background

## Error Handling

The implementation handles various error scenarios:
- **Network errors**: Failed downloads, timeouts
- **Invalid M3U format**: Conversion failures
- **Disk space issues**: Insufficient storage
- **Permission errors**: Cannot write to cache location
- **Conversion errors**: M3U parser failures

All errors are reported to the user via toast notifications.

## Testing

To test the feature:
1. Start the Electron app in development mode
2. Go to Settings → IPTV Source
3. Enable IPTV and enter a test M3U URL
4. Click "Sync Now"
5. Check `/Users/user/Desktop/keditv/iptv-cache.json` for the cached file
6. Verify cache info is displayed correctly

## Future Enhancements

Potential improvements:
- [ ] Download progress percentage
- [ ] Bandwidth throttling for large files
- [ ] Incremental updates (delta syncing)
- [ ] Multiple M3U source support
- [ ] Cache compression
- [ ] Background sync with notifications

