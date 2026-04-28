/**
 * src/context/AudioContext.jsx — Global Audio State
 *
 * Provides uninterrupted audio playback across all page navigations.
 * Uses a single <audio> element that persists at the app root level.
 *
 * Exposes:
 *  currentSong, queue, isPlaying, progress, duration,
 *  playMode (sequence | shuffle | revolve | repeat),
 *  playSong(song, queue), togglePlay, seekTo(pct),
 *  nextSong, prevSong, setPlayMode, addToQueue, removeFromQueue
 *
 * Caching: When a song is first loaded, its blob URL is cached in
 * sessionStorage (key: `cache_${songId}`) to prevent re-download lag.
 */

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";

const AudioCtx = createContext(null);

/* ─────────── Play Modes ─────────────────────────────────────
   sequence  — play queue in order, stop at end
   shuffle   — random next song from queue
   revolve   — loop all songs in queue
   repeat    — loop current song
──────────────────────────────────────────────────────────── */
export const PLAY_MODES = {
  SEQUENCE: "sequence",
  SHUFFLE: "shuffle",
  REVOLVE: "revolve",
  REPEAT: "repeat",
};

/* ─────────────────── RECENTLY PLAYED ───────────────────────
   Stored in localStorage; max 20 entries.
──────────────────────────────────────────────────────────── */
const RECENTS_KEY = "groove_recents";
const MAX_RECENTS = 20;

function loadRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveRecent(song) {
  const recents = loadRecents().filter((s) => s._id !== song._id);
  recents.unshift(song);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

/* ─────────────────── BLOB CACHE ────────────────────────────
   Caches audio blobs in sessionStorage to avoid re-downloading.
   Falls back to direct URL if the blob is too large.
──────────────────────────────────────────────────────────── */
const blobCache = {}; // { [songId]: objectURL }

async function getCachedUrl(song, baseUrl) {
  if (blobCache[song._id]) return blobCache[song._id];

  const fullUrl = `${baseUrl}${song.fileUrl}`;

  try {
    const response = await fetch(fullUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    blobCache[song._id] = objectUrl;
    return objectUrl;
  } catch (_) {
    // If fetching the blob fails, use the direct URL
    return fullUrl;
  }
}

/* ─────────────────── PROVIDER ──────────────────────────────*/
export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // seconds
  const [duration, setDuration] = useState(0);   // seconds
  const [playMode, setPlayMode] = useState(PLAY_MODES.REVOLVE);
  const [recents, setRecents] = useState(loadRecents);
  const [volume, setVolume] = useState(1);

  const audio = audioRef.current;

  /* ──────── Wire up audio event listeners once ──────────── */
  useEffect(() => {
    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => handleEnded();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playMode, queue, queueIndex]);

  /* ──────── Handle song end based on play mode ──────────── */
  function handleEnded() {
    switch (playMode) {
      case PLAY_MODES.REPEAT:
        audio.currentTime = 0;
        audio.play();
        break;
      case PLAY_MODES.SHUFFLE:
        playRandomFromQueue();
        break;
      case PLAY_MODES.REVOLVE: {
        const nextIdx = (queueIndex + 1) % queue.length;
        loadSongAtIndex(nextIdx);
        break;
      }
      case PLAY_MODES.SEQUENCE: {
        if (queueIndex < queue.length - 1) {
          loadSongAtIndex(queueIndex + 1);
        } else {
          setIsPlaying(false);
        }
        break;
      }
      default:
        break;
    }
  }

  /* ──────── Load and play a song by queue index ─────────── */
  const loadSongAtIndex = useCallback(
    async (index) => {
      const song = queue[index];
      if (!song) return;

      setQueueIndex(index);
      setCurrentSong(song);
      setProgress(0);

      const url = await getCachedUrl(song, BASE_URL);
      audio.src = url;
      audio.play().catch((e) => console.warn("[Audio] Play failed:", e));

      // Record play
      saveRecent(song);
      setRecents(loadRecents());
      api.songs.recordPlay(song._id).catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queue, BASE_URL]
  );

  function playRandomFromQueue() {
    if (queue.length === 0) return;
    const idx = Math.floor(Math.random() * queue.length);
    loadSongAtIndex(idx);
  }

  /* ──────── Public API ───────────────────────────────────── */

  /**
   * playSong: Start playing a specific song, optionally setting a new queue.
   * @param {object} song — Song object
   * @param {object[]} newQueue — Optional queue (defaults to [song])
   */
  const playSong = useCallback(
    async (song, newQueue) => {
      const q = newQueue || [song];
      setQueue(q);
      const idx = q.findIndex((s) => s._id === song._id);
      const safeIdx = idx === -1 ? 0 : idx;
      setQueueIndex(safeIdx);
      setCurrentSong(song);
      setProgress(0);

      const url = await getCachedUrl(song, BASE_URL);
      audio.src = url;
      audio.play().catch((e) => console.warn("[Audio] Play failed:", e));

      saveRecent(song);
      setRecents(loadRecents());
      api.songs.recordPlay(song._id).catch(() => {});
    },
    [BASE_URL]
  );

  const togglePlay = useCallback(() => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const seekTo = useCallback((seconds) => {
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const nextSong = useCallback(() => {
    if (playMode === PLAY_MODES.SHUFFLE) {
      playRandomFromQueue();
    } else {
      const nextIdx = (queueIndex + 1) % queue.length;
      loadSongAtIndex(nextIdx);
    }
  }, [playMode, queueIndex, queue, loadSongAtIndex]);

  const prevSong = useCallback(() => {
    if (progress > 3) {
      // If more than 3s in, restart current song
      seekTo(0);
    } else {
      const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
      loadSongAtIndex(prevIdx);
    }
  }, [progress, queueIndex, queue, loadSongAtIndex, seekTo]);

  const addToQueue = useCallback((song) => {
    setQueue((prev) => [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const changeVolume = useCallback((vol) => {
    audio.volume = vol;
    setVolume(vol);
  }, []);

  const value = {
    currentSong,
    queue,
    queueIndex,
    isPlaying,
    progress,
    duration,
    playMode,
    recents,
    volume,
    playSong,
    togglePlay,
    seekTo,
    nextSong,
    prevSong,
    setPlayMode,
    addToQueue,
    removeFromQueue,
    changeVolume,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

/* ──────── Custom hook for consumers ───────────────────────── */
export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used inside AudioProvider");
  return ctx;
}
