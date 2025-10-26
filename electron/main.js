const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const { createMpv } = require('./mpv');

let mainWindow;
let mpvPromise = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// MPV IPC Handlers
ipcMain.handle('mpv:init', async () => {
  try {
    if (!mpvPromise) {
      mpvPromise = createMpv(() => {
        // Notify renderer that mpv has exited
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('mpv:exited');
        }

        // Focus the Electron window when mpv exits
        // Add a small delay on macOS to ensure smooth transition
        // Note: 100ms was not enough, so using 200ms
        const focusDelay = process.platform === 'darwin' ? 200 : 0;
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.moveTop();
            // On macOS, also bring to front
            if (process.platform === 'darwin') {
                app.focus({ steal: true });
            }
          }
        }, focusDelay);
        mpvPromise = null;
      });
    }
    await mpvPromise;
    return { success: true };
  } catch (error) {
    console.error('mpv:init error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mpv:play', async (_e, url) => {
  try {
    const mpv = await (mpvPromise || createMpv(() => {
      // Notify renderer that mpv has exited
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mpv:exited');
      }

      // Focus the Electron window when mpv exits
      // Add a small delay on macOS to ensure smooth transition
      const focusDelay = process.platform === 'darwin' ? 100 : 0;
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.moveTop();
          // On macOS, also bring to front
          if (process.platform === 'darwin') {
            app.focus({ steal: true });
          }
        }
      }, focusDelay);
      mpvPromise = null;
    }));
    await mpv.load(url);
    return { success: true };
  } catch (error) {
    console.error('mpv:play error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mpv:pause', async (_e, v) => {
  try {
    const mpv = await mpvPromise;
    if (!mpv) return { success: false, error: 'mpv not initialized' };
    await mpv.pause(v);
    return { success: true };
  } catch (error) {
    console.error('mpv:pause error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mpv:seek', async (_e, seconds, mode) => {
  try {
    const mpv = await mpvPromise;
    if (!mpv) return { success: false, error: 'mpv not initialized' };
    await mpv.seek(seconds, mode);
    return { success: true };
  } catch (error) {
    console.error('mpv:seek error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mpv:volume', async (_e, v) => {
  try {
    const mpv = await mpvPromise;
    if (!mpv) return { success: false, error: 'mpv not initialized' };
    await mpv.volume(v);
    return { success: true };
  } catch (error) {
    console.error('mpv:volume error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mpv:stop', async () => {
  try {
    const mpv = await mpvPromise;
    if (!mpv) return { success: false, error: 'mpv not initialized' };
    await mpv.stop();
    return { success: true };
  } catch (error) {
    console.error('mpv:stop error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mpv:kill', async () => {
  try {
    const mpv = await mpvPromise;
    if (mpv) {
      mpv.kill();
      mpvPromise = null;
    }
    return { success: true };
  } catch (error) {
    console.error('mpv:kill error:', error);
    return { success: false, error: error.message };
  }
});

// IPTV Cache Management
function getIPTVCachePath(extension = 'json') {
  // In development: use project root
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '..', `iptv-cache.${extension}`);
  }

  // In production: use app data directory
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, `iptv-cache.${extension}`);
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadFile(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function convertM3UToJSON(m3uFilePath, jsonFilePath) {
  return new Promise((resolve, reject) => {
    const converterScript = path.join(__dirname, 'helpers', 'm3u-to-json.cjs');

    const process = spawn('node', [converterScript, m3uFilePath, jsonFilePath]);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        reject(new Error(`Conversion failed with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

ipcMain.handle('iptv:downloadAndConvert', async (event, url) => {
  const tempM3UPath = path.join(app.getPath('temp'), 'temp-iptv.m3u');
  const cacheM3UPath = getIPTVCachePath('m3u');
  const cacheJSONPath = getIPTVCachePath('json');

  try {
    // Step 1: Download M3U file
    event.sender.send('iptv:progress', 'Downloading M3U file...');
    const m3uContent = await downloadFile(url);

    // Save to temp file
    await fs.writeFile(tempM3UPath, m3uContent, 'utf-8');

    // Step 2: Save M3U to cache (for debugging)
    event.sender.send('iptv:progress', 'Saving M3U cache...');
    await fs.writeFile(cacheM3UPath, m3uContent, 'utf-8');

    // Step 3: Convert M3U to JSON
    event.sender.send('iptv:progress', 'Converting M3U to JSON...');
    await convertM3UToJSON(tempM3UPath, cacheJSONPath);

    // Step 4: Read the converted JSON to get item count
    event.sender.send('iptv:progress', 'Reading converted data...');
    const jsonContent = await fs.readFile(cacheJSONPath, 'utf-8');
    const data = JSON.parse(jsonContent);

    // Step 5: Get file stats for both files
    const jsonStats = await fs.stat(cacheJSONPath);
    const m3uStats = await fs.stat(cacheM3UPath);

    // Clean up temp file
    await fs.unlink(tempM3UPath).catch(() => {});

    event.sender.send('iptv:progress', `Complete! Processed ${data.length} items`);

    return {
      success: true,
      itemCount: data.length,
      jsonCacheSize: jsonStats.size,
      m3uCacheSize: m3uStats.size,
      jsonCachePath: cacheJSONPath,
      m3uCachePath: cacheM3UPath
    };
  } catch (error) {
    console.error('iptv:downloadAndConvert error:', error);

    // Clean up temp file on error
    await fs.unlink(tempM3UPath).catch(() => {});

    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('iptv:loadCache', async () => {
  const cacheJSONPath = getIPTVCachePath('json');

  try {
    const content = await fs.readFile(cacheJSONPath, 'utf-8');
    const data = JSON.parse(content);
    const jsonStats = await fs.stat(cacheJSONPath);

    return {
      success: true,
      data: data,
      cacheSize: jsonStats.size,
      cachePath: cacheJSONPath
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: 'Cache file not found'
      };
    }

    console.error('iptv:loadCache error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('iptv:clearCache', async () => {
  const cacheJSONPath = getIPTVCachePath('json');
  const cacheM3UPath = getIPTVCachePath('m3u');

  try {
    await fs.unlink(cacheJSONPath).catch(() => {});
    await fs.unlink(cacheM3UPath).catch(() => {});
    return { success: true };
  } catch (error) {

    console.error('iptv:clearCache error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('iptv:getCacheInfo', async () => {
  const cacheJSONPath = getIPTVCachePath('json');
  const cacheM3UPath = getIPTVCachePath('m3u');

  try {
    const jsonStats = await fs.stat(cacheJSONPath);
    const m3uStats = await fs.stat(cacheM3UPath);
    const content = await fs.readFile(cacheJSONPath, 'utf-8');
    const data = JSON.parse(content);

    return {
      success: true,
      exists: true,
      itemCount: data.length,
      jsonCacheSize: jsonStats.size,
      m3uCacheSize: m3uStats.size,
      jsonCachePath: cacheJSONPath,
      m3uCachePath: cacheM3UPath,
      lastModified: jsonStats.mtime.toISOString()
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: true,
        exists: false,
        jsonCachePath: cacheJSONPath,
        m3uCachePath: cacheM3UPath
      };
    }

    return {
      success: false,
      error: error.message
    };
  }
});

// Download state management
const activeDownloads = new Map();

// File download with progress tracking, pause, and cancel
ipcMain.handle('file:download', async (event, url, filename) => {
  const { dialog } = require('electron');
  const downloadId = Date.now().toString();

  try {
    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      buttonLabel: 'Save',
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const savePath = result.filePath;
    const protocol = url.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
      const downloadState = {
        paused: false,
        canceled: false,
        request: null,
        response: null,
        fileStream: null,
        buffer: [],
        downloadId
      };

      activeDownloads.set(downloadId, downloadState);

      const request = protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          event.sender.send('file:download:progress', {
            downloadId,
            status: 'downloading',
            message: 'Following redirect...'
          });

          const redirectUrl = response.headers.location;
          const redirectProtocol = redirectUrl.startsWith('https') ? https : http;

          const redirectRequest = redirectProtocol.get(redirectUrl, (redirectResponse) => {
            downloadState.request = redirectRequest;
            handleDownloadResponse(redirectResponse, savePath, event, resolve, reject, downloadState);
          }).on('error', (error) => {
            activeDownloads.delete(downloadId);
            event.sender.send('file:download:progress', {
              downloadId,
              status: 'error',
              message: error.message
            });
            reject(error);
          });

          downloadState.request = redirectRequest;
          return;
        }

        downloadState.request = request;
        handleDownloadResponse(response, savePath, event, resolve, reject, downloadState);
      }).on('error', (error) => {
        activeDownloads.delete(downloadId);
        event.sender.send('file:download:progress', {
          downloadId,
          status: 'error',
          message: error.message
        });
        reject(error);
      });

      downloadState.request = request;

      // Return downloadId immediately
      event.sender.send('file:download:started', { downloadId });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Pause download
ipcMain.handle('file:download:pause', async (event, downloadId) => {
  const downloadState = activeDownloads.get(downloadId);
  if (!downloadState) {
    return { success: false, error: 'Download not found' };
  }

  downloadState.paused = true;
  if (downloadState.response) {
    downloadState.response.pause();
  }

  event.sender.send('file:download:progress', {
    downloadId,
    status: 'paused',
    message: 'Download paused'
  });

  return { success: true };
});

// Resume download
ipcMain.handle('file:download:resume', async (event, downloadId) => {
  const downloadState = activeDownloads.get(downloadId);
  if (!downloadState) {
    return { success: false, error: 'Download not found' };
  }

  downloadState.paused = false;
  if (downloadState.response) {
    downloadState.response.resume();
  }

  event.sender.send('file:download:progress', {
    downloadId,
    status: 'downloading',
    message: 'Download resumed'
  });

  return { success: true };
});

// Cancel download
ipcMain.handle('file:download:cancel', async (event, downloadId) => {
  const downloadState = activeDownloads.get(downloadId);
  if (!downloadState) {
    return { success: false, error: 'Download not found' };
  }

  downloadState.canceled = true;

  if (downloadState.response) {
    downloadState.response.destroy();
  }
  if (downloadState.request) {
    downloadState.request.destroy();
  }
  if (downloadState.fileStream) {
    downloadState.fileStream.destroy();
  }

  activeDownloads.delete(downloadId);

  event.sender.send('file:download:progress', {
    downloadId,
    status: 'canceled',
    message: 'Download canceled'
  });

  return { success: true };
});

function handleDownloadResponse(response, savePath, event, resolve, reject, downloadState) {
  if (response.statusCode !== 200) {
    const error = `HTTP ${response.statusCode}: ${response.statusMessage}`;
    activeDownloads.delete(downloadState.downloadId);
    event.sender.send('file:download:progress', {
      downloadId: downloadState.downloadId,
      status: 'error',
      message: error
    });
    reject(new Error(error));
    return;
  }

  downloadState.response = response;
  const totalSize = parseInt(response.headers['content-length'] || '0', 10);
  let downloadedSize = 0;
  let lastProgressUpdate = 0;

  event.sender.send('file:download:progress', {
    downloadId: downloadState.downloadId,
    status: 'downloading',
    totalSize,
    downloadedSize: 0,
    percentage: 0,
    message: 'Starting download...'
  });

  const fileStream = require('fs').createWriteStream(savePath);
  downloadState.fileStream = fileStream;

  response.on('data', (chunk) => {
    if (downloadState.canceled) {
      return;
    }

    if (downloadState.paused) {
      // Buffer data while paused
      downloadState.buffer.push(chunk);
      return;
    }

    // Write buffered data if resuming
    if (downloadState.buffer.length > 0) {
      downloadState.buffer.forEach(bufferedChunk => {
        downloadedSize += bufferedChunk.length;
        fileStream.write(bufferedChunk);
      });
      downloadState.buffer = [];
    }

    downloadedSize += chunk.length;
    fileStream.write(chunk);

    // Throttle progress updates to every 100ms
    const now = Date.now();
    if (now - lastProgressUpdate > 100) {
      const percentage = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
      event.sender.send('file:download:progress', {
        downloadId: downloadState.downloadId,
        status: 'downloading',
        totalSize,
        downloadedSize,
        percentage,
        message: 'Downloading...'
      });
      lastProgressUpdate = now;
    }
  });

  response.on('end', () => {
    if (downloadState.canceled) {
      fileStream.destroy();
      require('fs').unlink(savePath, () => {});
      activeDownloads.delete(downloadState.downloadId);
      return;
    }

    fileStream.end(() => {
      activeDownloads.delete(downloadState.downloadId);
      event.sender.send('file:download:progress', {
        downloadId: downloadState.downloadId,
        status: 'complete',
        totalSize,
        downloadedSize,
        percentage: 100,
        message: 'Download complete!'
      });

      resolve({
        success: true,
        filePath: savePath,
        size: downloadedSize
      });
    });
  });

  fileStream.on('error', (error) => {
    activeDownloads.delete(downloadState.downloadId);
    event.sender.send('file:download:progress', {
      downloadId: downloadState.downloadId,
      status: 'error',
      message: error.message
    });
    reject(error);
  });
}

