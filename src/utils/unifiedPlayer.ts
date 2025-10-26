import { getPlatform } from './platform';

export interface UnifiedPlayerAPI {
  initialize(): Promise<{ success: boolean; error?: string }>;
  load(url: string): Promise<{ success: boolean; error?: string }>;
  play(): Promise<{ success: boolean; error?: string }>;
  pause(): Promise<{ success: boolean; error?: string }>;
  stop(): Promise<{ success: boolean; error?: string }>;
  seek(timeMs: number): Promise<{ success: boolean; error?: string }>;
  setVolume(level: number): Promise<{ success: boolean; error?: string }>;
  getCurrentPosition(): Promise<number>;
  getDuration(): Promise<number>;
  getPlaybackState(): Promise<{ isPlaying: boolean; isBuffering: boolean; hasEnded: boolean }>;
  setFullscreen(fullscreen: boolean): Promise<{ success: boolean }>;
  addListener(event: string, callback: (data: any) => void): () => void;
  destroy(): Promise<void>;
}

/**
 * Electron MPV Player implementation
 */
class ElectronMPVPlayer implements UnifiedPlayerAPI {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  async initialize(): Promise<{ success: boolean; error?: string }> {
    if (!(window as any).electron?.mpv) {
      return { success: false, error: 'MPV not available' };
    }
    return (window as any).electron.mpv.init();
  }

  async load(url: string): Promise<{ success: boolean; error?: string }> {
    if (!(window as any).electron?.mpv) {
      return { success: false, error: 'MPV not available' };
    }
    return (window as any).electron.mpv.play(url);
  }

  async play(): Promise<{ success: boolean; error?: string }> {
    if (!(window as any).electron?.mpv) {
      return { success: false, error: 'MPV not available' };
    }
    return (window as any).electron.mpv.pause(false);
  }

  async pause(): Promise<{ success: boolean; error?: string }> {
    if (!(window as any).electron?.mpv) {
      return { success: false, error: 'MPV not available' };
    }
    return (window as any).electron.mpv.pause(true);
  }

  async stop(): Promise<{ success: boolean; error?: string }> {
    if (!(window as any).electron?.mpv) {
      return { success: false, error: 'MPV not available' };
    }
    return (window as any).electron.mpv.stop();
  }

  async seek(timeMs: number): Promise<{ success: boolean; error?: string }> {
    if (!(window as any).electron?.mpv) {
      return { success: false, error: 'MPV not available' };
    }
    return (window as any).electron.mpv.seek(timeMs / 1000, 'absolute');
  }

  async setVolume(level: number): Promise<{ success: boolean; error?: string }> {
    if (!(window as any).electron?.mpv) {
      return { success: false, error: 'MPV not available' };
    }
    return (window as any).electron.mpv.volume(level);
  }

  async getCurrentPosition(): Promise<number> {
    // MPV doesn't expose position directly, return 0 for now
    return 0;
  }

  async getDuration(): Promise<number> {
    // MPV doesn't expose duration directly, return 0 for now
    return 0;
  }

  async getPlaybackState(): Promise<{ isPlaying: boolean; isBuffering: boolean; hasEnded: boolean }> {
    return { isPlaying: false, isBuffering: false, hasEnded: false };
  }

  async setFullscreen(fullscreen: boolean): Promise<{ success: boolean }> {
    // MPV handles fullscreen internally
    return { success: true };
  }

  addListener(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  async destroy(): Promise<void> {
    if ((window as any).electron?.mpv) {
      await (window as any).electron.mpv.kill();
    }
  }
}

/**
 * Capacitor Player implementation (Android TV)
 */
class CapacitorPlayerImpl implements UnifiedPlayerAPI {
  private player: any = null;

  private async getPlayer() {
    if (!this.player) {
      try {
        const { Plugins } = await import('@capacitor/core');
        this.player = (Plugins as any).Player;
      } catch (e) {
        console.error('[CapacitorPlayer] Failed to load player plugin:', e);
      }
    }
    return this.player;
  }

  async initialize(): Promise<{ success: boolean; error?: string }> {
    const player = await this.getPlayer();
    if (!player) {
      return { success: false, error: 'Player plugin not available' };
    }
    return player.initialize();
  }

  async load(url: string): Promise<{ success: boolean; error?: string }> {
    const player = await this.getPlayer();
    if (!player) {
      return { success: false, error: 'Player plugin not available' };
    }
    return player.load({ url });
  }

  async play(): Promise<{ success: boolean; error?: string }> {
    const player = await this.getPlayer();
    if (!player) {
      return { success: false, error: 'Player plugin not available' };
    }
    return player.play();
  }

  async pause(): Promise<{ success: boolean; error?: string }> {
    const player = await this.getPlayer();
    if (!player) {
      return { success: false, error: 'Player plugin not available' };
    }
    return player.pause();
  }

  async stop(): Promise<{ success: boolean; error?: string }> {
    const player = await this.getPlayer();
    if (!player) {
      return { success: false, error: 'Player plugin not available' };
    }
    return player.stop();
  }

  async seek(timeMs: number): Promise<{ success: boolean; error?: string }> {
    const player = await this.getPlayer();
    if (!player) {
      return { success: false, error: 'Player plugin not available' };
    }
    return player.seek({ timeMs });
  }

  async setVolume(level: number): Promise<{ success: boolean; error?: string }> {
    const player = await this.getPlayer();
    if (!player) {
      return { success: false, error: 'Player plugin not available' };
    }
    return player.setVolume({ level });
  }

  async getCurrentPosition(): Promise<number> {
    const player = await this.getPlayer();
    if (!player) {
      return 0;
    }
    const result = await player.getCurrentPosition();
    return result.position;
  }

  async getDuration(): Promise<number> {
    const player = await this.getPlayer();
    if (!player) {
      return 0;
    }
    const result = await player.getDuration();
    return result.duration;
  }

  async getPlaybackState(): Promise<{ isPlaying: boolean; isBuffering: boolean; hasEnded: boolean }> {
    const player = await this.getPlayer();
    if (!player) {
      return { isPlaying: false, isBuffering: false, hasEnded: false };
    }
    return player.getPlaybackState();
  }

  async setFullscreen(fullscreen: boolean): Promise<{ success: boolean }> {
    const player = await this.getPlayer();
    if (!player) {
      return { success: false };
    }
    return player.setFullscreen({ fullscreen });
  }

  addListener(event: string, callback: (data: any) => void): () => void {
    let removeListener: (() => void) | null = null;

    this.getPlayer().then(player => {
      if (player) {
        player.addListener(event as any, callback).then((listener: any) => {
          removeListener = () => listener.remove();
        });
      }
    });

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }

  async destroy(): Promise<void> {
    const player = await this.getPlayer();
    if (player) {
      await player.stop();
    }
  }
}

/**
 * HTML5 Video Player implementation (fallback for web)
 */
class HTML5VideoPlayer implements UnifiedPlayerAPI {
  private videoElement: HTMLVideoElement | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  setVideoElement(element: HTMLVideoElement) {
    this.videoElement = element;
    this.attachEventListeners();
  }

  async initialize(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async load(url: string): Promise<{ success: boolean; error?: string }> {
    if (!this.videoElement) {
      return { success: false, error: 'Video element not initialized' };
    }
    this.videoElement.src = url;
    this.videoElement.load();
    return { success: true };
  }

  async play(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.videoElement) {
        return { success: false, error: 'Video element not initialized' };
      }
      await this.videoElement.play();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async pause(): Promise<{ success: boolean; error?: string }> {
    if (!this.videoElement) {
      return { success: false, error: 'Video element not initialized' };
    }
    this.videoElement.pause();
    return { success: true };
  }

  async stop(): Promise<{ success: boolean; error?: string }> {
    if (!this.videoElement) {
      return { success: false, error: 'Video element not initialized' };
    }
    this.videoElement.pause();
    this.videoElement.currentTime = 0;
    this.videoElement.src = '';
    return { success: true };
  }

  async seek(timeMs: number): Promise<{ success: boolean; error?: string }> {
    if (!this.videoElement) {
      return { success: false, error: 'Video element not initialized' };
    }
    this.videoElement.currentTime = timeMs / 1000;
    return { success: true };
  }

  async setVolume(level: number): Promise<{ success: boolean; error?: string }> {
    if (!this.videoElement) {
      return { success: false, error: 'Video element not initialized' };
    }
    this.videoElement.volume = level / 100;
    return { success: true };
  }

  async getCurrentPosition(): Promise<number> {
    if (!this.videoElement) {
      return 0;
    }
    return Math.floor(this.videoElement.currentTime * 1000);
  }

  async getDuration(): Promise<number> {
    if (!this.videoElement) {
      return 0;
    }
    return Math.floor(this.videoElement.duration * 1000);
  }

  async getPlaybackState(): Promise<{ isPlaying: boolean; isBuffering: boolean; hasEnded: boolean }> {
    if (!this.videoElement) {
      return { isPlaying: false, isBuffering: false, hasEnded: false };
    }
    return {
      isPlaying: !this.videoElement.paused,
      isBuffering: this.videoElement.readyState < 3,
      hasEnded: this.videoElement.ended,
    };
  }

  async setFullscreen(fullscreen: boolean): Promise<{ success: boolean }> {
    try {
      if (!this.videoElement) {
        return { success: false };
      }
      if (fullscreen) {
        await this.videoElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  addListener(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  async destroy(): Promise<void> {
    await this.stop();
  }

  private attachEventListeners() {
    if (!this.videoElement) return;

    this.videoElement.addEventListener('play', () => {
      this.notifyListeners('playbackStateChanged', { isPlaying: true });
    });

    this.videoElement.addEventListener('pause', () => {
      this.notifyListeners('playbackStateChanged', { isPlaying: false });
    });

    this.videoElement.addEventListener('ended', () => {
      this.notifyListeners('playbackEnded', {});
    });

    this.videoElement.addEventListener('error', (e) => {
      this.notifyListeners('playbackError', { error: e });
    });

    this.videoElement.addEventListener('timeupdate', () => {
      this.notifyListeners('positionChanged', {
        position: Math.floor(this.videoElement!.currentTime * 1000)
      });
    });
  }

  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

/**
 * Create a unified player based on the current platform
 */
export function createUnifiedPlayer(): UnifiedPlayerAPI {
  const platform = getPlatform();

  switch (platform) {
    case 'electron':
      return new ElectronMPVPlayer();
    case 'android-tv':
      return new CapacitorPlayerImpl();
    case 'web':
    default:
      return new HTML5VideoPlayer();
  }
}

export { HTML5VideoPlayer };

