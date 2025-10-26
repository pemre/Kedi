import { registerPlugin } from '@capacitor/core';

export interface PlayerPlugin {
  /**
   * Initialize the ExoPlayer instance
   */
  initialize(): Promise<{ success: boolean; error?: string }>;

  /**
   * Load a media URL (HLS, MP4, TS, etc.)
   */
  load(options: { url: string }): Promise<{ success: boolean; error?: string }>;

  /**
   * Start or resume playback
   */
  play(): Promise<{ success: boolean; error?: string }>;

  /**
   * Pause playback
   */
  pause(): Promise<{ success: boolean; error?: string }>;

  /**
   * Stop playback and release resources
   */
  stop(): Promise<{ success: boolean; error?: string }>;

  /**
   * Seek to a specific position
   * @param options.timeMs - Position in milliseconds
   */
  seek(options: { timeMs: number }): Promise<{ success: boolean; error?: string }>;

  /**
   * Set volume level
   * @param options.level - Volume level (0-100)
   */
  setVolume(options: { level: number }): Promise<{ success: boolean; error?: string }>;

  /**
   * Get current playback position
   */
  getCurrentPosition(): Promise<{ position: number }>;

  /**
   * Get media duration
   */
  getDuration(): Promise<{ duration: number }>;

  /**
   * Get playback state
   */
  getPlaybackState(): Promise<{
    isPlaying: boolean;
    isBuffering: boolean;
    hasEnded: boolean;
  }>;

  /**
   * Set fullscreen mode
   */
  setFullscreen(options: { fullscreen: boolean }): Promise<{ success: boolean }>;

  /**
   * Add listener for player events
   */
  addListener(
    eventName: 'playbackStateChanged' | 'playbackError' | 'playbackEnded' | 'positionChanged',
    listenerFunc: (data: any) => void
  ): Promise<any>;
}

const Player = registerPlugin<PlayerPlugin>('Player', {
  web: () => import('./web').then(m => new m.PlayerWeb()),
});

export { Player };

