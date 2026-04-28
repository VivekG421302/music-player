/**
 * src/components/UI/SongRow.jsx — Reusable Song List Row
 *
 * Props:
 *  song        — Song object
 *  queue       — Full queue array for context playback
 *  index       — Optional display number
 *  onDelete    — Optional delete callback
 *  showAlbum   — Show album name (default false)
 */

import React, { useState } from "react";
import { useAudio } from "../../context/AudioContext";

function formatTime(secs) {
  if (!secs || isNaN(secs)) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongRow({ song, queue, index, onDelete, showAlbum = false }) {
  const { playSong, currentSong, isPlaying, togglePlay } = useAudio();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = currentSong?._id === song._id;

  const handleClick = () => {
    if (isActive) {
      togglePlay();
    } else {
      playSong(song, queue || [song]);
    }
  };

  return (
    <div className={`song-row ${isActive ? "active" : ""}`} onClick={handleClick}>
      {/* Index / Play indicator */}
      <div className="song-row-index">
        {isActive && isPlaying ? (
          <span className="playing-bars">
            <span /><span /><span />
          </span>
        ) : (
          <span className="row-number">{index !== undefined ? index + 1 : "♪"}</span>
        )}
      </div>

      {/* Cover + info */}
      <div className="song-row-cover cover-art">
        {song.coverArt ? (
          <img src={song.coverArt} alt={song.title} />
        ) : (
          <span className="cover-art-placeholder">♪</span>
        )}
      </div>

      <div className="song-row-info">
        <div className="song-title">{song.title}</div>
        <div className="song-artist">
          {song.artist}
          {showAlbum && song.album && (
            <span className="song-album"> · {song.album}</span>
          )}
        </div>
      </div>

      {/* Duration + menu */}
      <div className="song-row-actions" onClick={(e) => e.stopPropagation()}>
        <span className="song-duration">{formatTime(song.duration)}</span>
        {onDelete && (
          <button
            className="btn-icon song-delete-btn"
            onClick={() => onDelete(song._id)}
            title="Remove"
          >
            ✕
          </button>
        )}
      </div>

      {/* Animated equaliser bars (CSS only) */}
      <style>{`
        .playing-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 14px;
        }
        .playing-bars span {
          display: block;
          width: 3px;
          background: var(--primary-color);
          border-radius: 2px;
          animation: eq-bar 600ms ease-in-out infinite alternate;
        }
        .playing-bars span:nth-child(1) { height: 6px; animation-delay: 0ms; }
        .playing-bars span:nth-child(2) { height: 14px; animation-delay: 150ms; }
        .playing-bars span:nth-child(3) { height: 9px; animation-delay: 80ms; }
        @keyframes eq-bar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
        .row-number {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .song-row-index {
          width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .song-row-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .song-delete-btn {
          opacity: 0;
          transition: opacity var(--transition-fast);
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .song-row:hover .song-delete-btn {
          opacity: 1;
        }
        .song-album {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
