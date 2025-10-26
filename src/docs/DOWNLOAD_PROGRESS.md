# Download Progress Feature

## Overview

The download progress feature provides real-time visual feedback when downloading media files in the Electron version of Kedi TV, with full pause, resume, and cancel controls.

## Features

- **Real-time Progress**: Shows download percentage and data transferred
- **Visual Progress Bar**: Animated progress bar with smooth transitions
- **Pause/Resume**: Ability to pause and resume downloads
- **Cancel Download**: Stop downloads and delete partial files
- **Status Indicators**: Different icons and colors for downloading, paused, complete, canceled, and error states
- **File Size Display**: Shows downloaded size vs total size
- **Native Save Dialog**: Uses system file picker to choose download location

## Implementation

### Electron Backend (`electron/main.js`)

**Download State Management:**
- Tracks active downloads in a Map with downloadId
- Stores request, response, file stream, and pause/cancel state
- Manages buffering when paused

**IPC Handlers:**
- `file:download` - Initiates download with save dialog
- `file:download:pause` - Pauses an active download
- `file:download:resume` - Resumes a paused download
- `file:download:cancel` - Cancels download and cleans up files

**Progress Events:**
- `file:download:started` - Emits downloadId when download starts
- `file:download:progress` - Real-time progress updates every 100ms

**Features:**
- Handles HTTP redirects automatically
- Buffers data when paused to prevent data loss
- Cleans up partial files on cancel
- Tracks download state for pause/resume functionality

### Frontend Components

1. **DownloadProgressToast** (`src/components/DownloadProgressToast.tsx`)
   - React component that displays download progress
   - Shows icon based on status (downloading, paused, complete, canceled, error)
   - Displays progress bar during download
   - **Control Buttons:**
     - Pause button (during download)
     - Resume button (when paused)
     - Cancel button (available during download and pause)
   - Formats file sizes in human-readable format
   - Color-coded UI for each state

2. **fileDownload utility** (`src/utils/fileDownload.ts`)
   - Updated `downloadFile()` function returns control object
   - Control object contains: `pause()`, `resume()`, `cancel()`
   - Tracks downloadId from backend
   - Automatically uses Electron API when available
   - Falls back to browser download for web version
   - Handles cleanup of progress listeners

### Usage Example

```typescript
import { downloadFile, generateFilename } from "../utils/fileDownload";
import { toast } from "sonner";
import { DownloadProgressToast } from "./DownloadProgressToast";
import { FileDownloadProgress } from "../types/electron";

const handleDownload = () => {
  const filename = generateFilename(item.name, item.year, item.season, item.episode);
  let toastId: string | number | undefined;
  let downloadControls: { pause: () => void; resume: () => void; cancel: () => void } | null = null;

  const controls = downloadFile(item.url, filename, (progress: FileDownloadProgress) => {
    if (!toastId) {
      toastId = toast(
        <DownloadProgressToast 
          progress={progress}
          onPause={() => downloadControls?.pause()}
          onResume={() => downloadControls?.resume()}
          onCancel={() => {
            downloadControls?.cancel();
            if (toastId) toast.dismiss(toastId);
          }}
        />, 
        {
          duration: progress.status === 'downloading' || progress.status === 'paused' ? Infinity : 3000,
        }
      );
    } else {
      toast(
        <DownloadProgressToast 
          progress={progress}
          onPause={() => downloadControls?.pause()}
          onResume={() => downloadControls?.resume()}
          onCancel={() => {
            downloadControls?.cancel();
            if (toastId) toast.dismiss(toastId);
          }}
        />, 
        {
          id: toastId,
          duration: progress.status === 'downloading' || progress.status === 'paused' ? Infinity : 3000,
        }
      );
    }

    if (progress.status === 'complete' || progress.status === 'error' || progress.status === 'canceled') {
      setTimeout(() => {
        if (toastId) toast.dismiss(toastId);
      }, 3000);
    }
  });

  if (controls) {
    downloadControls = controls;
  }
};
```

## Progress States

### Downloading
- **Icon**: Pulsing download icon (blue)
- **Color**: Blue progress bar
- **Shows**: Progress bar, percentage, downloaded/total size
- **Controls**: Pause button, Cancel button

### Paused
- **Icon**: Pause icon (yellow)
- **Color**: Yellow progress bar
- **Shows**: Current progress frozen
- **Controls**: Resume button, Cancel button

### Complete
- **Icon**: Check circle (green)
- **Color**: Green
- **Shows**: Completion message
- **Auto-dismisses**: After 3 seconds

### Canceled
- **Icon**: X circle (gray)
- **Color**: Gray
- **Shows**: Cancellation message
- **Auto-dismisses**: After 3 seconds

### Error
- **Icon**: X circle (red)
- **Color**: Red
- **Shows**: Error message
- **Auto-dismisses**: After 3 seconds

## Control Functions

### Pause
```typescript
downloadControls.pause()
```
- Pauses the HTTP response stream
- Buffers incoming data while paused
- Updates UI to show paused state
- Shows Resume button

### Resume
```typescript
downloadControls.resume()
```
- Resumes the HTTP response stream
- Writes buffered data to file
- Updates UI to show downloading state
- Shows Pause button

### Cancel
```typescript
downloadControls.cancel()
```
- Destroys HTTP request and response
- Closes and deletes file stream
- Removes partial downloaded file
- Cleans up all listeners
- Updates UI to show canceled state

## Browser Fallback

When running in a browser (non-Electron environment), the download falls back to the standard browser download mechanism without progress tracking or pause/cancel controls.

## Testing

To test the download progress feature:

1. **Start the app in Electron mode:**
   ```bash
   npm run electron:dev
   ```

2. **Navigate to any content details page**

3. **Click the download button**

4. **Choose a save location in the file dialog**

5. **Test controls:**
   - Click "Pause" to pause the download
   - Click "Resume" to continue
   - Click "Cancel" to abort (file will be deleted)

6. **Observe the progress toast:**
   - Real-time percentage and size updates
   - Color changes for different states
   - Automatic dismissal on completion

## Technical Notes

- Progress updates are throttled to 100ms to prevent UI flooding
- Paused downloads buffer data to prevent loss during pause
- Canceled downloads automatically delete partial files
- Each download gets a unique ID for state tracking
- Cleanup functions properly remove all event listeners
- Type-safe with full TypeScript support

