/**
 * src/pages/Songs.jsx — Songs List Page
 *
 * Tabs (3-chip toggle):
 *  - All           : paginated, sorted by title
 *  - Recently Added: paginated, sorted by createdAt desc (default)
 *  - Recently Played: from AudioContext recents (localStorage)
 *
 * Includes a search input that filters via backend query.
 */

import React, { useState, useEffect } from "react";
import { useAudio } from "../context/AudioContext";
import SongRow from "../components/UI/SongRow";
import usePaginatedSongs from "../hooks/usePaginatedSongs";
import "./Songs.css";

const TABS = [
  { key: "recent",  label: "Recently Added" },
  { key: "all",     label: "All" },
  { key: "played",  label: "Recently Played" },
];

export default function Songs() {
  const { recents } = useAudio();
  const [activeTab, setActiveTab] = useState("recent");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Params for each tab
  const queryParams =
    activeTab === "all"
      ? { sort: "title", order: "asc", search: debouncedSearch }
      : { sort: "createdAt", order: "desc", search: debouncedSearch };

  const { songs, loading, sentinelRef, error } = usePaginatedSongs(
    activeTab === "played" ? {} : queryParams
  );

  // Displayed list
  const displayedSongs = activeTab === "played" ? recents : songs;

  return (
    <div className="page-container songs-page">
      <div className="songs-header">
        <h1>Songs</h1>

        {/* Search */}
        <div className="songs-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            className="form-input songs-search"
            placeholder="Search songs, artists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Chip Toggle */}
      <div className="chip-group songs-chips">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`chip ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Song count */}
      <p className="songs-count">
        {displayedSongs.length} song{displayedSongs.length !== 1 ? "s" : ""}
      </p>

      {/* List */}
      {error && <p className="error-text">⚠ {error}</p>}

      {displayedSongs.length === 0 && !loading && (
        <div className="empty-state">
          <span className="empty-state-icon">🎵</span>
          <p>
            {activeTab === "played"
              ? "Nothing played yet — hit play!"
              : "No songs found. Try uploading some music."}
          </p>
        </div>
      )}

      <div className="songs-list-container">
        {displayedSongs.map((song, i) => (
          <SongRow
            key={song._id}
            song={song}
            queue={displayedSongs}
            index={i}
            showAlbum
          />
        ))}

        {/* Infinite scroll sentinel (not for "played" tab) */}
        {activeTab !== "played" && (
          <div ref={sentinelRef} className="scroll-sentinel" />
        )}

        {loading && (
          <div className="loading-screen">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
