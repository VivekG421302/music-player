/**
 * src/components/Player/MiniPlayer.jsx — Persistent Bottom Player Bar
 *
 * Always visible (when a song is loaded). Clicking the center area
 * navigates to the full /player page.
 */

import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio, PLAY_MODES } from "../../context/AudioContext";
import "./MiniPlayer.css";

function formatTime(secs) {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    playMode,
    setPlayMode,
  } = useAudio();

  const handleSeek = useCallback(
    (e) => seekTo(parseFloat(e.target.value)),
    [seekTo]
  );

  const cyclePlayMode = () => {
    const modes = Object.values(PLAY_MODES);
    const next = modes[(modes.indexOf(playMode) + 1) % modes.length];
    setPlayMode(next);
  };

  const modeIcon = {
    [PLAY_MODES.SEQUENCE]: "→",
    [PLAY_MODES.SHUFFLE]:  "⇌",
    [PLAY_MODES.REVOLVE]:  "↻",
    [PLAY_MODES.REPEAT]:   "⟳",
  }[playMode];

  if (!currentSong) return null;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="mini-player">
      {/* Seek bar across full top edge */}
      <div className="mini-player-seek">
        <input
          type="range"
          className="mini-seek-bar"
          min={0}
          max={duration || 100}
          value={progress}
          step={0.5}
          onChange={handleSeek}
          style={{
            background: `linear-gradient(to right, var(--primary-color) ${progressPct}%, var(--bg-overlay) ${progressPct}%)`,
          }}
        />
      </div>

      <div className="mini-player-body">
        {/* Left: Song info */}
        <div
          className="mini-song-info"
          onClick={() => navigate("/player")}
          title="Open full player"
        >
          <div className="mini-cover cover-art">
            {currentSong.coverArt ? (
              <img src={currentSong.coverArt} alt={currentSong.title} />
            ) : (
              <span className="cover-art-placeholder">♪</span>
            )}
          </div>
          <div className="mini-meta">
            <span className="mini-title">{currentSong.title}</span>
            <span className="mini-artist">{currentSong.artist}</span>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="mini-controls">
          <button className="btn-icon" onClick={prevSong} title="Previous">
            ⏮
          </button>
          <button className="mini-play-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="btn-icon" onClick={nextSong} title="Next">
            ⏭
          </button>
        </div>

        {/* Right: Time + mode */}
        <div className="mini-right">
          <span className="mini-time">
            {formatTime(progress)} / {formatTime(duration)}
          </span>
          <button
            className={`btn-icon mini-mode-btn ${playMode !== PLAY_MODES.SEQUENCE ? "active" : ""}`}
            onClick={cyclePlayMode}
            title={`Mode: ${playMode}`}
          >
            {modeIcon}
          </button>
        </div>
      </div>
    </div>
  );
}
