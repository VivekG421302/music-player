/**
 * src/components/UI/PlaylistCard.jsx — Playlist Card (for horizontal scroll)
 *
 * Props:
 *  playlist    — Playlist object
 *  onClick     — Click handler
 */

import React from "react";
import "./PlaylistCard.css";

export default function PlaylistCard({ playlist, onClick }) {
  const songCount = playlist.songIds?.length || 0;
  const cover = playlist.coverArt || playlist.songIds?.[0]?.coverArt || null;

  return (
    <div className="playlist-card card" onClick={onClick}>
      <div className="playlist-card-cover cover-art">
        {cover ? (
          <img src={cover} alt={playlist.name} />
        ) : (
          <span className="cover-art-placeholder">♫</span>
        )}
      </div>
      <div className="playlist-card-info">
        <span className="playlist-card-name">{playlist.name}</span>
        <span className="playlist-card-count">
          {songCount} song{songCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
