"use client";

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import YouTubeAudioPlayer from "@/components/YouTubeAudioPlayer";
import { api } from "@/lib/fetcher";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Global YouTube player reference
let globalYouTubePlayer: any = null;

export interface AudioMediaItem {
  id: string;
  title: string;
  media_url: string;
  is_radio: boolean;
  is_published: boolean;
  artist?: string | null;
  description?: string | null;
  play_count?: number;
}

interface AudioContextType {
  currentMedia: AudioMediaItem | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  error: string | null;
  loading: boolean;
  hasStartedPlayback: boolean;

  play: () => Promise<void>;
  pause: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  loadMedia: (media: AudioMediaItem) => void;
  clearError: () => void;
  closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};

export const getMediaType = (url: string): "spotify" | "youtube" | "radio" | "audio" => {
  if (url.includes("spotify.com")) return "spotify";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("stream.") || url.includes("radio") || url.includes(".fm")) return "radio";
  return "audio";
};

const ARTWORK = [96, 128, 192, 256, 384, 512].map((s) => ({
  src: "/images/logo.png",
  sizes: `${s}x${s}`,
  type: "image/png",
}));

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMedia, setCurrentMedia] = useState<AudioMediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMediaRef = useRef<AudioMediaItem | null>(null);
  const retryCountRef = useRef(0);

  currentMediaRef.current = currentMedia;
  retryCountRef.current = retryCount;

  const handleAudioError = useCallback(() => {
    const media = currentMediaRef.current;
    if (retryCountRef.current < 3) {
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        if (audioRef.current && media) {
          if (getMediaType(media.media_url) === "youtube") {
            setError("URLs do YouTube não são suportadas. Configure um stream de rádio online válido.");
            setLoading(false);
            return;
          }
          audioRef.current.src = media.media_url;
          audioRef.current.load();
          audioRef.current.play().catch(console.error);
        }
      }, delay);
    } else {
      setError("Falha ao reproduzir mídia. Verifique sua conexão.");
      setLoading(false);
    }
  }, []);

  // Inicializar áudio global
  useEffect(() => {
    if (audioRef.current) return;
    const audio = new Audio();
    audio.preload = "none";
    audio.crossOrigin = "anonymous";
    audio.setAttribute("playsinline", "true");

    audio.addEventListener("play", () => {
      setIsPlaying(true);
      setError(null);
      setRetryCount(0);
      setHasStartedPlayback(true);
    });
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", () => setIsPlaying(false));
    audio.addEventListener("error", () => {
      setIsPlaying(false);
      handleAudioError();
    });
    audio.addEventListener("loadstart", () => {
      setLoading(true);
      setError(null);
    });
    audio.addEventListener("canplay", () => setLoading(false));

    audioRef.current = audio;

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [handleAudioError]);

  // Media Session API
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentMedia) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentMedia.title || "Rádio Gospel",
      artist: currentMedia.artist || "Mensageira de Deus",
      album: "Transmissão ao vivo",
      artwork: ARTWORK,
    });
  }, [currentMedia]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume / 100;
    if (globalYouTubePlayer?.setVolume) globalYouTubePlayer.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Background playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!audioRef.current) return;
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPlaying]);

  const bumpPlayCount = async (id: string) => {
    try {
      await api(`/api/media/${id}/play`, { method: "POST" });
    } catch {
      /* não crítico */
    }
  };

  const play = useCallback(async () => {
    if (!currentMedia) return;
    const mediaType = getMediaType(currentMedia.media_url);
    setHasStartedPlayback(true);

    if (mediaType === "youtube") {
      if (globalYouTubePlayer?.playVideo) {
        try {
          setError(null);
          setLoading(true);
          globalYouTubePlayer.playVideo();
          await bumpPlayCount(currentMedia.id);
        } catch (err) {
          console.error("[AudioContext] YouTube play error:", err);
          setLoading(false);
          setError("Erro ao reproduzir vídeo do YouTube");
        }
      } else {
        setError("Player do YouTube não está pronto");
        setLoading(false);
      }
      return;
    }

    if (!audioRef.current) return;

    if (mediaType === "spotify") {
      setError("Este tipo de mídia deve ser aberto em aplicativo externo");
      setLoading(false);
      return;
    }

    const isValidStreamUrl =
      currentMedia.media_url.match(/\.(mp3|aac|m3u8|pls|m3u)$/i) ||
      currentMedia.media_url.includes("stream") ||
      currentMedia.media_url.includes("radio") ||
      currentMedia.media_url.includes(".fm") ||
      currentMedia.is_radio;

    if (!isValidStreamUrl && mediaType !== "radio") {
      setError("URL de mídia inválida para reprodução");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      if (audioRef.current.src !== currentMedia.media_url) {
        audioRef.current.src = currentMedia.media_url;
        audioRef.current.load();
      }
      audioRef.current.volume = isMuted ? 0 : volume / 100;
      await audioRef.current.play();
      await bumpPlayCount(currentMedia.id);
    } catch (err) {
      console.error("[AudioContext] Play error:", err);
      setLoading(false);
      handleAudioError();
    }
  }, [currentMedia, isMuted, volume, handleAudioError]);

  const pause = useCallback(() => {
    const mediaType = currentMedia ? getMediaType(currentMedia.media_url) : "audio";
    if (mediaType === "youtube" && globalYouTubePlayer?.pauseVideo) {
      globalYouTubePlayer.pauseVideo();
    } else if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [currentMedia]);

  // Media session handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    navigator.mediaSession.setActionHandler("stop", () => {
      pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
    });
  }, [play, pause]);

  const setVolume = useCallback((v: number) => setVolumeState(v), []);
  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  const loadMedia = useCallback((media: AudioMediaItem) => {
    if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
    if (globalYouTubePlayer?.pauseVideo) globalYouTubePlayer.pauseVideo();

    if (getMediaType(media.media_url) === "spotify") {
      setCurrentMedia(null);
      setError(null);
      setRetryCount(0);
      setLoading(false);
      setHasStartedPlayback(false);
      return;
    }

    setCurrentMedia(media);
    setError(null);
    setRetryCount(0);
    setLoading(false);
    setHasStartedPlayback(false);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const closePlayer = useCallback(() => {
    const mediaType = currentMedia ? getMediaType(currentMedia.media_url) : "audio";
    if (mediaType === "youtube" && globalYouTubePlayer?.pauseVideo) {
      globalYouTubePlayer.pauseVideo();
    } else if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setHasStartedPlayback(false);
    setIsPlaying(false);
    setError(null);
    setLoading(false);
  }, [currentMedia]);

  const handleYouTubeReady = useCallback((player: any) => {
    setLoading(false);
    globalYouTubePlayer = player;
  }, []);
  const handleYouTubePlay = useCallback(() => {
    setIsPlaying(true);
    setError(null);
    setRetryCount(0);
    setLoading(false);
  }, []);
  const handleYouTubePause = useCallback(() => {
    setIsPlaying(false);
    setLoading(false);
  }, []);
  const handleYouTubeEnd = useCallback(() => {
    setIsPlaying(false);
    setLoading(false);
  }, []);
  const handleYouTubeError = useCallback(() => {
    setIsPlaying(false);
    setLoading(false);
    setError("Erro ao reproduzir vídeo do YouTube");
  }, []);

  const value: AudioContextType = {
    currentMedia,
    isPlaying,
    volume,
    isMuted,
    error,
    loading,
    hasStartedPlayback,
    play,
    pause,
    setVolume,
    toggleMute,
    loadMedia,
    clearError,
    closePlayer,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
      {currentMedia && getMediaType(currentMedia.media_url) === "youtube" && (
        <YouTubeAudioPlayer
          videoId={currentMedia.media_url}
          onReady={handleYouTubeReady}
          onPlay={handleYouTubePlay}
          onPause={handleYouTubePause}
          onEnd={handleYouTubeEnd}
          onError={handleYouTubeError}
          volume={isMuted ? 0 : volume}
        />
      )}
    </AudioContext.Provider>
  );
};
