package com.keditv.app.plugins

import android.net.Uri
import android.view.View
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView

@CapacitorPlugin(name = "Player")
class PlayerPlugin : Plugin() {
    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var isInitialized = false

    @PluginMethod
    fun initialize(call: PluginCall) {
        try {
            activity.runOnUiThread {
                if (player == null) {
                    player = ExoPlayer.Builder(context).build()

                    // Find or create PlayerView
                    playerView = activity.findViewById(
                        context.resources.getIdentifier(
                            "exoplayer_view",
                            "id",
                            context.packageName
                        )
                    )

                    playerView?.player = player

                    // Add player event listeners
                    player?.addListener(object : Player.Listener {
                        override fun onPlaybackStateChanged(playbackState: Int) {
                            val data = JSObject()
                            data.put("state", playbackState)
                            data.put("isPlaying", player?.isPlaying ?: false)
                            data.put("isBuffering", playbackState == Player.STATE_BUFFERING)
                            notifyListeners("playbackStateChanged", data)
                        }

                        override fun onPlayerError(error: PlaybackException) {
                            val data = JSObject()
                            data.put("error", error.message)
                            notifyListeners("playbackError", data)
                        }

                        override fun onIsPlayingChanged(isPlaying: Boolean) {
                            val data = JSObject()
                            data.put("isPlaying", isPlaying)
                            notifyListeners("playbackStateChanged", data)
                        }
                    })

                    isInitialized = true
                }

                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", e.message)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun load(call: PluginCall) {
        val url = call.getString("url")
        if (url == null) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", "URL is required")
            call.resolve(ret)
            return
        }

        try {
            activity.runOnUiThread {
                val mediaItem = MediaItem.fromUri(Uri.parse(url))
                player?.setMediaItem(mediaItem)
                player?.prepare()

                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", e.message)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun play(call: PluginCall) {
        try {
            activity.runOnUiThread {
                player?.play()
                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", e.message)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        try {
            activity.runOnUiThread {
                player?.pause()
                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", e.message)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        try {
            activity.runOnUiThread {
                player?.stop()
                player?.clearMediaItems()
                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", e.message)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun seek(call: PluginCall) {
        val timeMs = call.getLong("timeMs")
        if (timeMs == null) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", "timeMs is required")
            call.resolve(ret)
            return
        }

        try {
            activity.runOnUiThread {
                player?.seekTo(timeMs)
                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", e.message)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun setVolume(call: PluginCall) {
        val level = call.getInt("level")
        if (level == null) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", "level is required")
            call.resolve(ret)
            return
        }

        try {
            activity.runOnUiThread {
                player?.volume = level / 100f
                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("error", e.message)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun getCurrentPosition(call: PluginCall) {
        val ret = JSObject()
        ret.put("position", player?.currentPosition ?: 0)
        call.resolve(ret)
    }

    @PluginMethod
    fun getDuration(call: PluginCall) {
        val ret = JSObject()
        ret.put("duration", player?.duration ?: 0)
        call.resolve(ret)
    }

    @PluginMethod
    fun getPlaybackState(call: PluginCall) {
        val ret = JSObject()
        ret.put("isPlaying", player?.isPlaying ?: false)
        ret.put("isBuffering", player?.playbackState == Player.STATE_BUFFERING)
        ret.put("hasEnded", player?.playbackState == Player.STATE_ENDED)
        call.resolve(ret)
    }

    @PluginMethod
    fun setFullscreen(call: PluginCall) {
        val fullscreen = call.getBoolean("fullscreen", false)

        try {
            activity.runOnUiThread {
                if (fullscreen == true) {
                    // Hide system UI for fullscreen
                    activity.window.decorView.systemUiVisibility = (
                        View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    )
                } else {
                    // Show system UI
                    activity.window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
                }

                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            val ret = JSObject()
            ret.put("success", false)
            call.resolve(ret)
        }
    }

    override fun handleOnDestroy() {
        player?.release()
        player = null
        super.handleOnDestroy()
    }
}

