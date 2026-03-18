"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Chapter {
  title: string;
  timestamp: number; // seconds
}

interface VideoPlayerProps {
  src: string;
  subtitleUrl?: string | null;
  subtitleLabel?: string;
  chapters?: Chapter[];
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  src,
  subtitleUrl,
  subtitleLabel = "Sous-titres",
  chapters = [],
  onProgress,
  onEnded,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(!!subtitleUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isPiP, setIsPiP] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [quality, setQuality] = useState<string | null>(null);
  const miniPlayerRef = useRef<HTMLDivElement>(null);
  const miniProgressRef = useRef<HTMLDivElement>(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    } else {
      resetHideTimer();
    }
  }, [playing, resetHideTimer]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
    onProgress?.(v.currentTime, v.duration);
  }, [onProgress]);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    // Determine video quality from height
    const h = v.videoHeight;
    if (h >= 2160) setQuality("4K");
    else if (h >= 1080) setQuality("1080p");
    else if (h >= 720) setQuality("720p");
    else if (h >= 480) setQuality("480p");
    else if (h >= 360) setQuality("360p");
    else if (h > 0) setQuality(`${h}p`);
    else setQuality(null);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    onEnded?.();
  }, [onEnded]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  }, []);

  const changeSpeed = useCallback((s: number) => {
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
    try {
      localStorage.setItem("fh-video-speed", s.toString());
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  }, [muted]);

  const changeVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setVolume(val);
    setMuted(val === 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // Restore saved playback speed from localStorage
  useEffect(() => {
    try {
      const savedSpeed = localStorage.getItem("fh-video-speed");
      if (savedSpeed) {
        const parsed = parseFloat(savedSpeed);
        if (SPEEDS.includes(parsed)) {
          setSpeed(parsed);
          if (videoRef.current) videoRef.current.playbackRate = parsed;
        }
      }
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  // Detect PiP support (client-side only)
  useEffect(() => {
    setPipSupported(!!document.pictureInPictureEnabled);
  }, []);

  // PiP event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);
    v.addEventListener("enterpictureinpicture", onEnterPiP);
    v.addEventListener("leavepictureinpicture", onLeavePiP);
    return () => {
      v.removeEventListener("enterpictureinpicture", onEnterPiP);
      v.removeEventListener("leavepictureinpicture", onLeavePiP);
    };
  }, []);

  // IntersectionObserver for mini-player
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show mini-player when video is out of view and currently playing
        if (!entry.isIntersecting && playing) {
          setShowMiniPlayer(true);
        } else {
          setShowMiniPlayer(false);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [playing]);

  const seekToChapter = useCallback((timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setShowChapters(false);
    }
  }, []);

  const toggleSubtitles = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.textTracks[0]) return;
    const newState = !subtitlesOn;
    v.textTracks[0].mode = newState ? "showing" : "hidden";
    setSubtitlesOn(newState);
  }, [subtitlesOn]);

  const togglePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await v.requestPictureInPicture();
      }
    } catch {
      // PiP may not be supported or may fail
    }
  }, []);

  const miniSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = miniProgressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  }, []);

  const closeMiniPlayer = useCallback(() => {
    setShowMiniPlayer(false);
    // Scroll back to the video
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10); break;
        case "ArrowRight": e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 10); break;
        case "ArrowUp": e.preventDefault(); v.volume = Math.min(1, v.volume + 0.1); setVolume(v.volume); break;
        case "ArrowDown": e.preventDefault(); v.volume = Math.max(0, v.volume - 0.1); setVolume(v.volume); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case "c": if (subtitleUrl) { e.preventDefault(); toggleSubtitles(); } break;
        case "p": e.preventDefault(); togglePiP(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay, toggleFullscreen, toggleMute, toggleSubtitles, subtitleUrl, togglePiP]);

  // Current chapter
  const currentChapter = chapters.length > 0
    ? chapters.reduce((prev, ch) => (currentTime >= ch.timestamp ? ch : prev), chapters[0])
    : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black group select-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetHideTimer}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-controls]")) return;
        togglePlay();
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        autoPlay={autoPlay}
        playsInline
        crossOrigin="anonymous"
      >
        {subtitleUrl && (
          <track
            kind="subtitles"
            src={subtitleUrl}
            label={subtitleLabel}
            default={subtitlesOn}
          />
        )}
      </video>

      {/* Play/Pause overlay icon */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Video quality badge */}
      {quality && (
        <div className="absolute top-3 right-3 pointer-events-none z-10">
          <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {quality}
          </span>
        </div>
      )}

      {/* Controls overlay */}
      <div
        data-controls
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1 mx-3 mt-2 cursor-pointer group/bar hover:h-2 transition-all"
          onClick={seek}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full" />
          <div
            className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
            style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-purple-500 rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          {/* Chapter markers */}
          {chapters.map((ch) => (
            <div
              key={ch.timestamp}
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
              style={{ left: `${duration > 0 ? (ch.timestamp / duration) * 100 : 0}%` }}
              title={ch.title}
            />
          ))}
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-2 px-3 py-2 text-white text-sm">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="hover:text-purple-400 transition-colors" title={playing ? "Pause (k)" : "Play (k)"}>
            {playing ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/vol">
            <button onClick={toggleMute} className="hover:text-purple-400 transition-colors" title="Mute (m)">
              {muted || volume === 0 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
              ) : volume < 0.5 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.5 12A4.5 4.5 0 0016 8.97v6.06A4.48 4.48 0 0018.5 12zM5 9v6h4l5 5V4L9 9H5z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.97v6.06A4.48 4.48 0 0016.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
              )}
            </button>
            <input
              type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
              onChange={changeVolume}
              className="w-0 group-hover/vol:w-20 transition-all accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Time */}
          <span className="text-xs tabular-nums ml-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Current chapter label */}
          {currentChapter && (
            <span className="text-xs text-purple-300 ml-1 hidden sm:inline truncate max-w-[200px]">
              {currentChapter.title}
            </span>
          )}

          <div className="flex-1" />

          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowChapters(false); }}
              className={`px-2 py-0.5 text-xs rounded hover:bg-white/10 transition-colors ${speed !== 1 ? "text-purple-400" : ""}`}
              title="Vitesse de lecture"
            >
              {speed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-slate-900/95 border border-white/10 rounded-lg py-1 min-w-[80px] z-10">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 ${
                      speed === s ? "text-purple-400 font-medium" : "text-white"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subtitles toggle */}
          {subtitleUrl && (
            <button
              onClick={toggleSubtitles}
              className={`hover:text-purple-400 transition-colors ${subtitlesOn ? "text-purple-400" : ""}`}
              title="Sous-titres (c)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z" />
              </svg>
            </button>
          )}

          {/* Chapters */}
          {chapters.length > 0 && (
            <div className="relative">
              <button
                onClick={() => { setShowChapters(!showChapters); setShowSpeedMenu(false); }}
                className={`hover:text-purple-400 transition-colors ${showChapters ? "text-purple-400" : ""}`}
                title="Chapitres"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
              </button>
              {showChapters && (
                <div className="absolute bottom-full right-0 mb-2 bg-slate-900/95 border border-white/10 rounded-lg py-1 max-h-60 overflow-y-auto w-64 z-10">
                  {chapters.map((ch, i) => (
                    <button
                      key={i}
                      onClick={() => seekToChapter(ch.timestamp)}
                      className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 ${
                        currentChapter === ch ? "text-purple-400 bg-white/5" : "text-white"
                      }`}
                    >
                      <span className="text-purple-400 tabular-nums mr-2">{formatTime(ch.timestamp)}</span>
                      {ch.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Picture-in-Picture */}
          {pipSupported && (
            <button
              onClick={togglePiP}
              className={`hover:text-purple-400 transition-colors ${isPiP ? "text-purple-400" : ""}`}
              title="Picture-in-Picture (p)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
              </svg>
            </button>
          )}

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="hover:text-purple-400 transition-colors" title="Plein écran (f)">
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
            )}
          </button>
        </div>
      </div>
      {/* Mini-player (sticky at bottom-right when scrolling away from video) */}
      {showMiniPlayer && (
        <div
          ref={miniPlayerRef}
          className="fixed bottom-4 right-4 w-80 rounded-xl shadow-2xl z-50 overflow-hidden bg-black border border-white/10"
          style={{ aspectRatio: "16/9" }}
          data-controls
        >
          {/* Mini-player overlay with controls */}
          <div className="absolute inset-0 flex flex-col justify-end">
            {/* Video mirror: show a thumbnail-like view */}
            <div className="absolute inset-0 bg-black flex items-center justify-center text-white/40 text-xs">
              <span className="text-white/60 text-[10px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Mini controls */}
            <div className="relative z-10 bg-gradient-to-t from-black/90 to-transparent px-3 py-2 flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-purple-400 transition-colors"
                title={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              {/* Mini progress bar */}
              <div
                ref={miniProgressRef}
                className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative"
                onClick={miniSeek}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-purple-500 rounded-full"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              {/* Close mini-player */}
              <button
                onClick={closeMiniPlayer}
                className="text-white hover:text-red-400 transition-colors"
                title="Fermer le mini-lecteur"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
