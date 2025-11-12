/**
 * File download utilities
 */

/**
 * Get file size from URL using HEAD request
 * Returns size in bytes, or null if not available
 */
export async function getFileSize(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      // mode: 'cors',
    });

    console.log('getFileSize headers', response.headers);
    console.log('getFileSize url', url);

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    return null;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return null;
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Download file using browser's native download or Electron with progress
 * Returns control functions for pause/resume/cancel
 */
export function downloadFile(
  url: string,
  filename: string,
  onProgress?: (progress: any) => void
): { pause: () => void; resume: () => void; cancel: () => void } | void {
  // Check if we're in Electron
  if ((window as any).electron?.file?.download) {
    // Use Electron's download API with progress tracking
    const electron = (window as any).electron;
    let downloadId: string | null = null;

    // Set up progress listener
    let cleanupProgress: (() => void) | null = null;
    let cleanupStarted: (() => void) | null = null;

    if (onProgress && electron.file.onDownloadProgress) {
      cleanupProgress = electron.file.onDownloadProgress(onProgress);
    }

    // Listen for downloadId
    if (electron.file.onDownloadStarted) {
      cleanupStarted = electron.file.onDownloadStarted((data: { downloadId: string }) => {
        downloadId = data.downloadId;
      });
    }

    // Start download
    electron.file.download(url, filename).then((result: any) => {
      if (cleanupProgress) cleanupProgress();
      if (cleanupStarted) cleanupStarted();

      if (!result.success && !result.canceled) {
        console.error('Download failed:', result.error);
      }
    }).catch((error: any) => {
      if (cleanupProgress) cleanupProgress();
      if (cleanupStarted) cleanupStarted();
      console.error('Download error:', error);
    });

    // Return control functions
    return {
      pause: () => {
        if (downloadId && electron.file.pause) {
          electron.file.pause(downloadId);
        }
      },
      resume: () => {
        if (downloadId && electron.file.resume) {
          electron.file.resume(downloadId);
        }
      },
      cancel: () => {
        if (downloadId && electron.file.cancel) {
          electron.file.cancel(downloadId);
          if (cleanupProgress) cleanupProgress();
          if (cleanupStarted) cleanupStarted();
        }
      }
    };
  } else {
    // Fallback to browser download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Generate filename from content item
 */
export function generateFilename(name: string, year?: string | null, season?: string | null, episode?: string | null): string {
  let filename = name.replace(/[^a-z0-9]/gi, '_');

  if (season && episode) {
    filename += `_S${season.padStart(2, '0')}E${episode.padStart(2, '0')}`;
  } else if (year) {
    filename += `_${year}`;
  }

  // Add extension - we don't know the actual extension, so use .mp4 as default
  filename += '.mp4';

  return filename;
}
