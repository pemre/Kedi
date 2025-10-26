const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add any APIs you want to expose to your React app here
  platform: process.platform,
  isElectron: true,
  mpv: {
    init: () => ipcRenderer.invoke('mpv:init'),
    play: (url) => ipcRenderer.invoke('mpv:play', url),
    pause: (v) => ipcRenderer.invoke('mpv:pause', v),
    seek: (s, mode) => ipcRenderer.invoke('mpv:seek', s, mode),
    volume: (v) => ipcRenderer.invoke('mpv:volume', v),
    stop: () => ipcRenderer.invoke('mpv:stop'),
    kill: () => ipcRenderer.invoke('mpv:kill'),
    onExit: (callback) => {
      ipcRenderer.on('mpv:exited', callback);
      // Return a cleanup function
      return () => ipcRenderer.removeListener('mpv:exited', callback);
    },
  },
  iptv: {
    downloadAndConvert: (url) => ipcRenderer.invoke('iptv:downloadAndConvert', url),
    loadCache: () => ipcRenderer.invoke('iptv:loadCache'),
    clearCache: () => ipcRenderer.invoke('iptv:clearCache'),
    getCacheInfo: () => ipcRenderer.invoke('iptv:getCacheInfo'),
    onProgress: (callback) => {
      ipcRenderer.on('iptv:progress', (_event, message) => callback(message));
      // Return a cleanup function
      return () => ipcRenderer.removeAllListeners('iptv:progress');
    },
  },
  file: {
    download: (url, filename) => ipcRenderer.invoke('file:download', url, filename),
    pause: (downloadId) => ipcRenderer.invoke('file:download:pause', downloadId),
    resume: (downloadId) => ipcRenderer.invoke('file:download:resume', downloadId),
    cancel: (downloadId) => ipcRenderer.invoke('file:download:cancel', downloadId),
    onDownloadProgress: (callback) => {
      ipcRenderer.on('file:download:progress', (_event, progress) => callback(progress));
      // Return a cleanup function
      return () => ipcRenderer.removeAllListeners('file:download:progress');
    },
    onDownloadStarted: (callback) => {
      ipcRenderer.on('file:download:started', (_event, data) => callback(data));
      // Return a cleanup function
      return () => ipcRenderer.removeAllListeners('file:download:started');
    },
  },
});

