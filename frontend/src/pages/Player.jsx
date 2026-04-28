/**
 * src/pages/Player.jsx — Full Spotify-style Player Page
 *
 * Features:
 *  - Rotating vinyl record with cover art
 *  - Progress slider with time display
 *  - Play/Pause, Next, Prev controls
 *  - Mode buttons: Shuffle, Sequence, Revolve, Repeat
 *  - Queue panel: previous + upcoming songs
 */

import React, { useCallback } from "react";
import { useAudio, PLAY_MODES } from "../context/AudioContext";
import SongRow from "../components/UI/SongRow";
import "./Player.css";

function formatTime(secs) {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Player() {
  const {
    currentSong,
    queue,
    queueIndex,
    isPlaying,
    progress,
    duration,
    playMode,
    setPlayMode,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    playSong,
    volume,
    changeVolume,
  } = useAudio();

  const handleSeek = useCallback(
    (e) => seekTo(parseFloat(e.target.value)),
    [seekTo]
  );

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  if (!currentSong) {
    return (
      <div className="page-container player-page">
        <div className="player-empty empty-state">
          <span className="empty-state-icon" style={{ fontSize: "5rem" }}>🎵</span>
          <h2>Nothing playing</h2>
          <p>Pick a song from Home or Songs to start listening</p>
        </div>
      </div>
    );
  }

  // Partition queue into previous and upcoming relative to current index
  const prevQueue = queue.slice(0, queueIndex);
  const upcomingQueue = queue.slice(queueIndex + 1);

  return (
    <div className="page-container player-page">
      <div className="player-layout">

        {/* ── Left: Vinyl + Controls ── */}
        <div className="player-main">
          {/* Vinyl Record */}
          <div className={`vinyl-wrapper ${isPlaying ? "spinning" : ""}`}>
            <div className="vinyl-disc">
              <div className="vinyl-grooves" />
              <div className="vinyl-label">
                {currentSong.coverArt ? (
                  <img
                    src={currentSong.coverArt}
                    alt={currentSong.title}
                    className="vinyl-cover"
                  />
                ) : (
                  <span className="vinyl-placeholder">♪</span>
                )}
              </div>
              <div className="vinyl-center" />
            </div>
            {/* Tonearm */}
            <div className={`tonearm ${isPlaying ? "playing" : ""}`}>
              <div className="tonearm-body" />
              <div className="tonearm-head" />
            </div>
          </div>

          {/* Song info */}
          <div className="player-song-info">
            <h2 className="player-title">{currentSong.title}</h2>
            <p className="player-artist">{currentSong.artist}</p>
            {currentSong.album && (
              <p className="player-album">{currentSong.album}</p>
            )}
          </div>

          {/* Progress */}
          <div className="player-progress">
            <span className="player-time">{formatTime(progress)}</span>
            <input
              type="range"
              className="progress-bar"
              min={0}
              max={duration || 100}
              value={progress}
              step={0.5}
              onChange={handleSeek}
              style={{
                background: `linear-gradient(to right, var(--primary-color) ${progressPct}%, var(--bg-overlay) ${progressPct}%)`,
              }}
            />
            <span className="player-time">{formatTime(duration)}</span>
          </div>

          {/* Main Controls */}
          <div className="player-controls">
            <button
              className={`mode-btn ${playMode === PLAY_MODES.SHUFFLE ? "active" : ""}`}
              onClick={() => setPlayMode(PLAY_MODES.SHUFFLE)}
              title="Shuffle"
            >
              ⇌
            </button>

            <button className="ctrl-btn" onClick={prevSong} title="Previous">
              ⏮
            </button>

            <button
              className="play-pause-btn"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            <button className="ctrl-btn" onClick={nextSong} title="Next">
              ⏭
            </button>

            <button
              className={`mode-btn ${playMode === PLAY_MODES.REPEAT ? "active" : ""}`}
              onClick={() => setPlayMode(PLAY_MODES.REPEAT)}
              title="Repeat one"
            >
              ⟳
            </button>
          </div>

          {/* Sub mode row: Sequence & Revolve */}
          <div className="player-sub-controls">
            <button
              className={`mode-chip ${playMode === PLAY_MODES.SEQUENCE ? "active" : ""}`}
              onClick={() => setPlayMode(PLAY_MODES.SEQUENCE)}
            >
              → Sequence
            </button>
            <button
              className={`mode-chip ${playMode === PLAY_MODES.REVOLVE ? "active" : ""}`}
              onClick={() => setPlayMode(PLAY_MODES.REVOLVE)}
            >
              ↻ Revolve
            </button>
          </div>

          {/* Volume */}
          <div className="player-volume">
            <span className="vol-icon">🔈</span>
            <input
              type="range"
              className="progress-bar"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, var(--primary-color) ${volume * 100}%, var(--bg-overlay) ${volume * 100}%)`,
              }}
            />
            <span className="vol-icon">🔊</span>
          </div>
        </div>

        {/* ── Right: Queue ── */}
        <div className="player-queue">
          <h3 className="queue-title">Queue</h3>

          {prevQueue.length > 0 && (
            <div className="queue-section">
              <p className="queue-section-label">Previously played</p>
              {prevQueue.map((song, i) => (
                <div key={song._id} className="queue-item dimmed">
                  <SongRow
                    song={song}
                    queue={queue}
                    index={i}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="queue-section">
            <p className="queue-section-label">Now playing</p>
            <SongRow song={currentSong} queue={queue} index={queueIndex} />
          </div>

          {upcomingQueue.length > 0 && (
            <div className="queue-section">
              <p className="queue-section-label">Up next</p>
              {upcomingQueue.map((song, i) => (
                <SongRow
                  key={song._id}
                  song={song}
                  queue={queue}
                  index={queueIndex + 1 + i}
                />
              ))}
            </div>
          )}

          {queue.length === 0 && (
            <p className="queue-empty">Your queue is empty</p>
          )}
        </div>
      </div>
    </div>
  );
}
