import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  ArrowLeft,
  Settings
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { ContentItem } from "../types/content";
import { saveWatchProgress, getLastWatchedTime } from "../utils/watchHistory";

// Type definitions for Electron mpv API
declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      platform: string;
      mpv: {
        init(): Promise<{ success: boolean; error?: string }>;
        play(url: string): Promise<{ success: boolean; error?: string }>;
        pause(v: boolean): Promise<{ success: boolean; error?: string }>;
        seek(s: number, mode?: 'relative' | 'absolute'): Promise<{ success: boolean; error?: string }>;
        volume(v: number): Promise<{ success: boolean; error?: string }>;
        stop(): Promise<{ success: boolean; error?: string }>;
        kill(): Promise<{ success: boolean; error?: string }>;
        onExit(callback: () => void): () => void;
      };
    };
  }
}

interface VideoPlayerProps {
  item: ContentItem | null;
  onClose: () => void;
}

export function VideoPlayer({ item, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useMpv, setUseMpv] = useState(false);
  const [mpvError, setMpvError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const mpvInitializedRef = useRef(false);
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (item) {
      setIsLoading(true);
      setHasError(false);
      errorCountRef.current = 0;

      // Check if this is an MKV file and mpv is available
      const isMkvFile = item.url.toLowerCase().endsWith('.mkv');
      const hasMpv = window.electron?.mpv;

      // For MKV files in Electron, prefer mpv for better codec support
      if (isMkvFile && hasMpv) {
        console.log('[VideoPlayer] MKV file detected, using mpv for better compatibility');
        setUseMpv(true); // Set this before calling fallbackToMpv
        fallbackToMpv();
        return;
      }

      // Only set up video element if not using mpv
      setUseMpv(false);

      if (videoRef.current) {
        // Ensure video is not muted and has proper volume
        videoRef.current.muted = false;
        videoRef.current.volume = volume / 100;

        // Auto-play when video loads
        videoRef.current.load();

        // Resume from last watched position if available
        const lastTime = getLastWatchedTime(item);
        if (lastTime && lastTime > 0) {
          setCurrentTime(lastTime);
        }
      }
    }

    // Cleanup mpv on unmount or item change
    return () => {
      if (window.electron?.mpv && mpvInitializedRef.current) {
        window.electron.mpv.kill().catch(console.error);
        mpvInitializedRef.current = false;
      }
    };
  }, [item]);

  // Listen for mpv exit events
  useEffect(() => {
    if (!window.electron?.mpv) return;

    const cleanup = window.electron.mpv.onExit(() => {
      console.log('[VideoPlayer] mpv exited, closing video player');
      // Close the video player when mpv exits
      onClose();
    });

    return cleanup;
  }, [onClose]);

  // Initialize mpv if in Electron and needed
  const initMpv = async () => {
    if (!window.electron?.mpv || mpvInitializedRef.current) return;

    try {
      const result = await window.electron.mpv.init();
      if (result.success) {
        mpvInitializedRef.current = true;
        setMpvError(null);
      } else {
        setMpvError(result.error || 'Failed to initialize mpv');
      }
    } catch (error) {
      setMpvError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Fallback to mpv when native video fails
  const fallbackToMpv = async () => {
    if (!window.electron?.mpv || !item) return;

    console.log('[VideoPlayer] Falling back to mpv player');
    setIsLoading(true);
    setHasError(false);

    await initMpv();

    if (!mpvInitializedRef.current) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      const result = await window.electron.mpv.play(item.url);
      if (result.success) {
        setUseMpv(true);
        setIsPlaying(true);
        setIsLoading(false);
        setHasError(false);

        // Set volume
        await window.electron.mpv.volume(volume);
      } else {
        setMpvError(result.error || 'Failed to play in mpv');
        setHasError(true);
        setIsLoading(false);
      }
    } catch (error) {
      setMpvError(error instanceof Error ? error.message : 'Unknown error');
      setHasError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!item) return;
      
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        case "Escape":
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case "ArrowLeft":
          skipBackward();
          break;
        case "ArrowRight":
          skipForward();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [item, isFullscreen, isPlaying]);

  const togglePlayPause = async () => {
    if (useMpv && window.electron?.mpv) {
      try {
        await window.electron.mpv.pause(!isPlaying);
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('mpv pause error:', error);
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);

    if (useMpv && window.electron?.mpv) {
      try {
        await window.electron.mpv.volume(newVolume);
      } catch (error) {
        console.error('mpv volume error:', error);
      }
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Save watch progress periodically and when closing
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (item && videoRef.current && duration > 0) {
        saveWatchProgress(item, videoRef.current.currentTime, duration);
      }
    }, 5000); // Save every 5 seconds

    return () => clearInterval(saveInterval);
  }, [item, duration]);

  // Save progress when component unmounts or user closes
  useEffect(() => {
    return () => {
      if (item && videoRef.current && duration > 0) {
        saveWatchProgress(item, videoRef.current.currentTime, duration);
      }
    };
  }, [item, duration]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && item) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      setHasError(false);
      
      const video = videoRef.current;

      // Ensure video is not muted (important for MKV files)
      video.muted = false;
      video.volume = volume / 100;

      // Log video properties for debugging
      console.log('[VideoPlayer] Video metadata loaded:');
      console.log('  - Duration:', video.duration);
      console.log('  - Has audio:', video.mozHasAudio || video.webkitAudioDecodedByteCount > 0 || video.audioTracks?.length > 0 || 'unknown');
      console.log('  - Muted:', video.muted);
      console.log('  - Volume:', video.volume);
      console.log('  - Ready state:', video.readyState);

      // Log audio track information for debugging
      if (video.audioTracks && video.audioTracks.length > 0) {
        console.log(`[VideoPlayer] Found ${video.audioTracks.length} audio track(s)`);
        // Ensure at least one audio track is enabled
        let hasEnabledTrack = false;
        for (let i = 0; i < video.audioTracks.length; i++) {
          if (video.audioTracks[i].enabled) {
            hasEnabledTrack = true;
            console.log(`[VideoPlayer] Audio track ${i} is enabled:`, video.audioTracks[i].label || 'Unknown');
          }
        }
        // If no track is enabled, enable the first one
        if (!hasEnabledTrack && video.audioTracks.length > 0) {
          console.log('[VideoPlayer] No audio track enabled, enabling first track');
          video.audioTracks[0].enabled = true;
        }
      } else {
        console.log('[VideoPlayer] No audio tracks detected or audioTracks API not supported');
        console.log('[VideoPlayer] This is normal for some browsers/formats - audio should still work');
      }

      // Additional check for browsers that don't expose audioTracks
      // Try to detect audio through other means
      if (video.webkitAudioDecodedByteCount !== undefined) {
        console.log('[VideoPlayer] Audio decoded bytes (webkit):', video.webkitAudioDecodedByteCount);
      }
      if ((video as any).mozHasAudio !== undefined) {
        console.log('[VideoPlayer] Has audio (mozilla):', (video as any).mozHasAudio);
      }

      // Resume from last watched position
      const lastTime = getLastWatchedTime(item);
      if (lastTime && lastTime > 0) {
        video.currentTime = lastTime;
      }
      
      // Auto-play after loading
      video.play().then(() => {
        setIsPlaying(true);
        // Check audio after playback starts
        setTimeout(() => {
          if (video.webkitAudioDecodedByteCount !== undefined && video.webkitAudioDecodedByteCount === 0) {
            console.warn('[VideoPlayer] WARNING: No audio bytes decoded after playback started!');
            console.warn('[VideoPlayer] This may indicate an audio codec compatibility issue');
            console.warn('[VideoPlayer] Browser may not support the audio codec in this MKV file');
          }
        }, 1000);
      }).catch((err) => {
        // Auto-play was prevented, user needs to click play
        console.log('[VideoPlayer] Auto-play prevented:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleError = () => {
    errorCountRef.current += 1;

    // Try mpv fallback if available and this is the first error
    if (window.electron?.mpv && errorCountRef.current === 1 && !useMpv) {
      console.log('[VideoPlayer] Native video failed, attempting mpv fallback...');
      fallbackToMpv();
    } else {
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const handleCanPlay = () => {
    // When video can play, ensure audio is properly set up
    if (videoRef.current) {
      console.log('[VideoPlayer] Video can play, verifying audio setup');
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume / 100;
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipBackward = async () => {
    if (useMpv && window.electron?.mpv) {
      try {
        await window.electron.mpv.seek(-10, 'relative');
      } catch (error) {
        console.error('mpv seek error:', error);
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = async () => {
    if (useMpv && window.electron?.mpv) {
      try {
        await window.electron.mpv.seek(10, 'relative');
      } catch (error) {
        console.error('mpv seek error:', error);
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleVideoClick = () => {
    togglePlayPause();
  };

  if (!item) return null;

  const episodeInfo = item.season && item.episode 
    ? `S${item.season}:E${item.episode}` 
    : null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Video Element - only render when not using mpv */}
        {!useMpv && (
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onError={handleError}
            onClick={handleVideoClick}
            playsInline
            {...(item.source === 'Plex' && { crossOrigin: 'anonymous' })}
            preload="metadata"
          >
            {/* Use source element with explicit MIME type for better compatibility */}
            <source
              src={item.url}
              type={item.url.toLowerCase().endsWith('.mkv') ? 'video/x-matroska' : 'video/mp4'}
            />
            {/* Fallback: try without MIME type specification */}
            <source src={item.url} />
          </video>
        )}

        {/* mpv indicator - shown when using mpv */}
        {useMpv && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-white/50">
                <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-white/70">Playing in mpv</p>
              <p className="text-white/50 text-sm">Use mpv window for playback controls</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !hasError && !useMpv && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-[var(--netflix-red)]" />
          </div>
        )}

        {/* mpv Loading */}
        {isLoading && !hasError && useMpv && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto animate-spin rounded-full border-4 border-white/20 border-t-[var(--netflix-red)]" />
              <p className="text-white/70">Launching mpv player...</p>
              <p className="text-white/50 text-sm">MKV file detected - using mpv for better codec support</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-md space-y-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--netflix-red)]/20">
                <svg className="h-10 w-10 text-[var(--netflix-red)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl">Unable to Play Video</h3>
              <p className="text-sm text-white/70">
                This video source is currently unavailable or not supported. This may be due to:
              </p>
              <ul className="space-y-1 text-xs text-white/60">
                <li>• The stream server is offline or unreachable</li>
                <li>• The video format is not supported by your browser</li>
                <li>• Network connectivity issues</li>
                <li>• CORS or authentication restrictions</li>
                {item.url.toLowerCase().endsWith('.mkv') && (
                  <>
                    <li className="text-yellow-400">• MKV files may have audio codec compatibility issues</li>
                    <li className="text-yellow-400">• Browsers only support AAC, MP3, Opus, and Vorbis audio</li>
                    <li className="text-yellow-400">• AC3, DTS, EAC3 audio codecs are not supported in browsers</li>
                  </>
                )}
                {mpvError && <li className="text-yellow-400">• mpv fallback failed: {mpvError}</li>}
              </ul>
              {!window.electron?.mpv && item.url.toLowerCase().endsWith('.mkv') && (
                <p className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
                  <strong>Tip:</strong> Running in Electron with mpv installed enables playback of MKV files with any audio codec.
                </p>
              )}
              {!window.electron?.mpv && !item.url.toLowerCase().endsWith('.mkv') && (
                <p className="text-xs text-white/50">
                  Tip: Running in Electron with mpv installed enables playback of more stream types.
                </p>
              )}
              <p className="text-xs text-white/50">
                In a production app, you would connect to your actual IPTV service provider's streams.
              </p>
            </div>
          </div>
        )}

        {/* Top Gradient & Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
          transition={{ duration: 0.3 }}
          className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-8 py-6 pt-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl">{item.name}</h2>
              {episodeInfo && (
                <p className="text-sm text-white/70">{episodeInfo}</p>
              )}
            </div>
            {useMpv && (
              <div className="rounded bg-green-600/80 px-3 py-1 text-xs font-medium">
                mpv player
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom Controls - only show when not using mpv */}
        {!useMpv && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-8 pb-6 pt-12"
          >
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleProgressChange}
              className="cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-xs text-white/70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="h-10 w-10 text-white hover:bg-white/10 hover:text-white"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 fill-white" />
                )}
              </Button>

              {/* Skip Backward */}
              <Button
                variant="ghost"
                size="icon"
                onClick={skipBackward}
                className="h-10 w-10 text-white hover:bg-white/10 hover:text-white"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              {/* Skip Forward */}
              <Button
                variant="ghost"
                size="icon"
                onClick={skipForward}
                className="h-10 w-10 text-white hover:bg-white/10 hover:text-white"
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-10 w-10 text-white hover:bg-white/10 hover:text-white"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <div className="w-24">
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Settings (placeholder) */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-10 w-10 text-white hover:bg-white/10 hover:text-white"
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
        )}

        {/* Center Play Button (when paused and not loading and not using mpv) */}
        {!isPlaying && !isLoading && !useMpv && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={togglePlayPause}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-black/50 p-6 backdrop-blur-sm transition-transform hover:scale-110"
          >
            <Play className="h-12 w-12 fill-white text-white" />
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
