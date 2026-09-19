"use client";

import React, { useEffect, useRef, useCallback } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface YouTubeAudioPlayerProps {
  videoId: string;
  onReady?: (player: any) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  volume?: number;
  autoplay?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({
  videoId,
  onReady,
  onPlay,
  onPause,
  onEnd,
  onError,
  volume = 75,
  autoplay = false,
}) => {
  const youtubePlayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAPIReadyRef = useRef(false);

  const extractVideoId = useCallback((url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : url;
  }, []);

  const actualVideoId = extractVideoId(videoId);

  const initializePlayer = useCallback(() => {
    if (!window.YT || !containerRef.current || !actualVideoId) return;

    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
    }

    youtubePlayerRef.current = new window.YT.Player(containerRef.current, {
      height: "0",
      width: "0",
      videoId: actualVideoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(volume);
          onReady?.(event.target);
        },
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) onPlay?.();
          else if (state === window.YT.PlayerState.PAUSED) onPause?.();
          else if (state === window.YT.PlayerState.ENDED) onEnd?.();
        },
        onError: (event: any) => {
          console.error("[YouTubeAudioPlayer] Error:", event.data);
          onError?.(event.data);
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualVideoId, autoplay]);

  // Load YouTube API lazily
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.defer = true;
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        isAPIReadyRef.current = true;
        initializePlayer();
      };
    } else {
      isAPIReadyRef.current = true;
      initializePlayer();
    }
  }, [actualVideoId, initializePlayer]);

  useEffect(() => {
    if (youtubePlayerRef.current?.setVolume) {
      youtubePlayerRef.current.setVolume(volume);
    }
  }, [volume]);

  return (
    <div
      ref={containerRef}
      style={{ width: 0, height: 0, overflow: "hidden", position: "absolute", left: "-9999px" }}
    />
  );
};

export default YouTubeAudioPlayer;
