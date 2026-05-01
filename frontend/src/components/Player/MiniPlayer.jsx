/**
 * src/components/Player/MiniPlayer.jsx — Persistent Bottom Player Bar
 *
 * Always visible (when a song is loaded). Clicking the center area
 * navigates to the full /player page.
 */

import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio, PLAY_MODES } from "../../context/AudioContext";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic
} from "lucide-react";

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

  const renderModeIcon = () => {
    switch (playMode) {
      case PLAY_MODES.SHUFFLE:
        return <Shuffle size={16} />;
      case PLAY_MODES.REPEAT:
        return <Repeat1 size={16} />;
      case PLAY_MODES.REVOLVE:
        return <Repeat size={16} />;
      default:
        return <ListMusic size={16} />;
    }
  };

  if (!currentSong) return null;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="mini-player">
      {/* Seek bar */}
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
        {/* Left */}
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

        {/* Center */}
        <div className="mini-controls">
          <button className="btn-icon" onClick={prevSong} title="Previous">
            <SkipBack size={18} />
          </button>

          <button
            className="mini-play-btn"
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button className="btn-icon" onClick={nextSong} title="Next">
            <SkipForward size={18} />
          </button>
        </div>

        {/* Right */}
        <div className="mini-right">
          <span className="mini-time">
            {formatTime(progress)} / {formatTime(duration)}
          </span>

          <button
            className={`btn-icon mini-mode-btn ${
              playMode !== PLAY_MODES.SEQUENCE ? "active" : ""
            }`}
            onClick={cyclePlayMode}
            title={`Mode: ${playMode}`}
          >
            {renderModeIcon()}
          </button>
        </div>
      </div>
    </div>
  );
}