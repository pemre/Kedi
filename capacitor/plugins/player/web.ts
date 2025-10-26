import { WebPlugin } from '@capacitor/core';
import { PlayerPlugin } from './index';

export class PlayerWeb extends WebPlugin implements PlayerPlugin {
  private videoElement: HTMLVideoElement | null = null;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  async initialize(): Promise<{ success: boolean; error?: string }> {
    console.log('[PlayerWeb] Initialize - using HTML5 video');
    return { success: true };
  }

  async load(options: { url: string }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.videoElement) {
        console.error('[PlayerWeb] Video element not initialized');
        return { success: false, error: 'Video element not found' };
      }

      this.videoElement.src = options.url;
      this.videoElement.load();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async play(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.videoElement) {
        return { success: false, error: 'Video element not found' };
      }
      await this.videoElement.play();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async pause(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.videoElement) {
        return { success: false, error: 'Video element not found' };
      }
      this.videoElement.pause();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async stop(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.videoElement) {
        return { success: false, error: 'Video element not found' };
      }
      this.videoElement.pause();
      this.videoElement.currentTime = 0;
      this.videoElement.src = '';
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async seek(options: { timeMs: number }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.videoElement) {
        return { success: false, error: 'Video element not found' };
      }
      this.videoElement.currentTime = options.timeMs / 1000;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async setVolume(options: { level: number }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.videoElement) {
        return { success: false, error: 'Video element not found' };
      }
      this.videoElement.volume = options.level / 100;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCurrentPosition(): Promise<{ position: number }> {
    if (!this.videoElement) {
      return { position: 0 };
    }
    return { position: Math.floor(this.videoElement.currentTime * 1000) };
  }

  async getDuration(): Promise<{ duration: number }> {
    if (!this.videoElement) {
      return { duration: 0 };
    }
    return { duration: Math.floor(this.videoElement.duration * 1000) };
  }

  async getPlaybackState(): Promise<{
    isPlaying: boolean;
    isBuffering: boolean;
    hasEnded: boolean;
  }> {
    if (!this.videoElement) {
      return { isPlaying: false, isBuffering: false, hasEnded: false };
    }
    return {
      isPlaying: !this.videoElement.paused,
      isBuffering: this.videoElement.readyState < 3,
      hasEnded: this.videoElement.ended,
    };
  }

  async setFullscreen(options: { fullscreen: boolean }): Promise<{ success: boolean }> {
    try {
      if (!this.videoElement) {
        return { success: false };
      }
      if (options.fullscreen) {
        await this.videoElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  setVideoElement(element: HTMLVideoElement) {
    this.videoElement = element;
    this.attachEventListeners();
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
}

