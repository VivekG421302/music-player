/**
 * src/pages/Home.jsx — Home Page
 *
 * Sections:
 *  1. Playlists — horizontal scroll strip
 *  2. All Songs — infinite-scroll grid
 *  3. Recently Played — last 20 songs from AudioContext
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio } from "../context/AudioContext";
import SongRow from "../components/UI/SongRow";
import PlaylistCard from "../components/UI/PlaylistCard";
import usePaginatedSongs from "../hooks/usePaginatedSongs";
import api from "../services/api";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { recents, playSong } = useAudio();
  const [playlists, setPlaylists] = useState([]);

  // All songs (paginated)
  const { songs, loading, sentinelRef } = usePaginatedSongs({ sort: "createdAt" });

  useEffect(() => {
    api.playlists
      .getAll()
      .then(setPlaylists)
      .catch(() => {});
  }, []);

  return (
    <div className="page-container home-page">
      {/* ── Greeting ── */}
      <div className="home-greeting">
        <h1>Good <span className="accent-text">{getTimeOfDay()}</span> 👋</h1>
        <p>What are we listening to today?</p>
      </div>

      {/* ── Playlists ── */}
      {playlists.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2>Playlists</h2>
            <button onClick={() => navigate("/playlists")}>See all</button>
          </div>
          <div className="h-scroll">
            {playlists.map((pl) => (
              <PlaylistCard
                key={pl._id}
                playlist={pl}
                onClick={() => navigate("/playlists")}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Recently Played ── */}
      {recents.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2>Recently Played</h2>
          </div>
          <div className="songs-list">
            {recents.slice(0, 10).map((song, i) => (
              <SongRow
                key={song._id}
                song={song}
                queue={recents}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── All Songs ── */}
      <section className="home-section">
        <div className="section-header">
          <h2>All Songs</h2>
          <button onClick={() => navigate("/songs")}>Browse all</button>
        </div>

        {songs.length === 0 && !loading && (
          <div className="empty-state">
            <span className="empty-state-icon">🎵</span>
            <h3>No songs yet</h3>
            <p>Upload your music or create a playlist to get started.</p>
            <div className="empty-state-actions">
              <button className="btn btn-primary" onClick={() => navigate("/playlists")}>
                Upload Song
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/playlists")}>
                Create Playlist
              </button>
            </div>
          </div>
        )}

        <div className="songs-list">
          {songs.map((song, i) => (
            <SongRow key={song._id} song={song} queue={songs} index={i} />
          ))}
        </div>

        {/* Sentinel for IntersectionObserver pagination */}
        <div ref={sentinelRef} className="scroll-sentinel" />

        {loading && (
          <div className="loading-screen">
            <div className="spinner" />
          </div>
        )}
      </section>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
