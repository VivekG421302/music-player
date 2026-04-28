/**
 * src/pages/Playlists.jsx — Playlists Management Page
 *
 * Features:
 *  - List all playlists
 *  - Create new playlist (modal)
 *  - Delete playlist
 *  - Open a playlist to view/edit songs
 *  - Add existing songs via selection modal
 *  - Bulk upload new audio files
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAudio } from "../context/AudioContext";
import PlaylistCard from "../components/UI/PlaylistCard";
import SongRow from "../components/UI/SongRow";
import api from "../services/api";
import "./Playlists.css";

export default function Playlists() {
  const { playSong } = useAudio();

  const [playlists, setPlaylists]         = useState([]);
  const [allSongs, setAllSongs]           = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Modal states
  const [showCreate, setShowCreate]       = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [newName, setNewName]             = useState("");
  const [newDesc, setNewDesc]             = useState("");
  const [selectedSongIds, setSelectedSongIds] = useState(new Set());

  const fileInputRef = useRef(null);

  /* ── Load data ─────────────────────────────────────── */
  const loadPlaylists = useCallback(async () => {
    try {
      const data = await api.playlists.getAll();
      setPlaylists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllSongs = useCallback(async () => {
    try {
      const data = await api.songs.getAll({ limit: 200 });
      setAllSongs(data.songs);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadPlaylists();
    loadAllSongs();
  }, [loadPlaylists, loadAllSongs]);

  /* ── Create Playlist ────────────────────────────────── */
  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const pl = await api.playlists.create({ name: newName, description: newDesc });
      setPlaylists((prev) => [pl, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    } catch (err) {
      alert(err.message);
    }
  };

  /* ── Delete Playlist ────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this playlist?")) return;
    try {
      await api.playlists.delete(id);
      setPlaylists((prev) => prev.filter((p) => p._id !== id));
      if (activePlaylist?._id === id) setActivePlaylist(null);
    } catch (err) {
      alert(err.message);
    }
  };

  /* ── Add Selected Songs ─────────────────────────────── */
  const handleAddSongs = async () => {
    if (!activePlaylist || selectedSongIds.size === 0) return;
    try {
      const updated = await api.playlists.addSongs(
        activePlaylist._id,
        [...selectedSongIds]
      );
      setActivePlaylist(updated);
      setPlaylists((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      setShowSongPicker(false);
      setSelectedSongIds(new Set());
    } catch (err) {
      alert(err.message);
    }
  };

  /* ── Remove Song from Playlist ──────────────────────── */
  const handleRemoveSong = async (songId) => {
    if (!activePlaylist) return;
    try {
      const updated = await api.playlists.removeSongs(activePlaylist._id, [songId]);
      setActivePlaylist(updated);
      setPlaylists((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  /* ── Bulk Upload to Playlist ────────────────────────── */
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(0);
    try {
      const result = await api.upload.uploadFiles(files, setUploadProgress);
      // Add newly uploaded songs to the active playlist
      if (activePlaylist && result.songs?.length > 0) {
        const songIds = result.songs.map((s) => s._id);
        const updated = await api.playlists.addSongs(activePlaylist._id, songIds);
        setActivePlaylist(updated);
        setPlaylists((prev) =>
          prev.map((p) => (p._id === updated._id ? updated : p))
        );
      }
      await loadAllSongs();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="page-container playlists-page">
      {/* Header */}
      <div className="playlists-header">
        <h1>Playlists</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Playlist
        </button>
      </div>

      {loading && (
        <div className="loading-screen"><div className="spinner" /></div>
      )}

      {/* Playlist Grid */}
      {!activePlaylist && (
        <>
          {playlists.length === 0 && !loading && (
            <div className="empty-state">
              <span className="empty-state-icon">🎶</span>
              <h3>No playlists yet</h3>
              <p>Create your first playlist to organise your music.</p>
            </div>
          )}
          <div className="playlists-grid">
            {playlists.map((pl) => (
              <div key={pl._id} className="playlist-grid-item">
                <PlaylistCard playlist={pl} onClick={() => setActivePlaylist(pl)} />
                <button
                  className="pl-delete-btn"
                  onClick={(e) => { e.stopPropagation(); handleDelete(pl._id); }}
                  title="Delete playlist"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Playlist Detail View */}
      {activePlaylist && (
        <div className="playlist-detail">
          <button
            className="back-btn btn-ghost btn"
            onClick={() => setActivePlaylist(null)}
          >
            ← Back
          </button>

          <div className="playlist-detail-header">
            <div className="playlist-detail-cover cover-art">
              {activePlaylist.coverArt || activePlaylist.songIds?.[0]?.coverArt ? (
                <img
                  src={activePlaylist.coverArt || activePlaylist.songIds[0].coverArt}
                  alt={activePlaylist.name}
                />
              ) : (
                <span className="cover-art-placeholder">♫</span>
              )}
            </div>
            <div className="playlist-detail-meta">
              <h2>{activePlaylist.name}</h2>
              {activePlaylist.description && (
                <p>{activePlaylist.description}</p>
              )}
              <p className="pl-count">
                {activePlaylist.songIds?.length || 0} songs
              </p>
              <div className="playlist-detail-actions">
                {activePlaylist.songIds?.length > 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      playSong(activePlaylist.songIds[0], activePlaylist.songIds)
                    }
                  >
                    ▶ Play All
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSongPicker(true)}
                >
                  + Add Songs
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  ↑ Upload
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleUpload}
                />
              </div>

              {/* Upload progress */}
              {uploadProgress !== null && (
                <div className="upload-progress">
                  <div className="upload-bar">
                    <div
                      className="upload-bar-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Song List */}
          <div className="playlist-songs">
            {(!activePlaylist.songIds || activePlaylist.songIds.length === 0) && (
              <div className="empty-state">
                <span className="empty-state-icon">🎵</span>
                <p>This playlist is empty. Add some songs!</p>
              </div>
            )}
            {activePlaylist.songIds?.map((song, i) => (
              <SongRow
                key={song._id}
                song={song}
                queue={activePlaylist.songIds}
                index={i}
                onDelete={handleRemoveSong}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Create Playlist Modal ── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Playlist</h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="My Playlist"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Song Picker Modal ── */}
      {showSongPicker && (
        <div className="modal-overlay" onClick={() => setShowSongPicker(false)}>
          <div className="modal song-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Songs</h3>
              <button className="btn-icon" onClick={() => setShowSongPicker(false)}>✕</button>
            </div>
            <div className="song-picker-list">
              {allSongs.map((song) => {
                const alreadyAdded = activePlaylist?.songIds?.some(
                  (s) => s._id === song._id
                );
                const selected = selectedSongIds.has(song._id);
                return (
                  <label key={song._id} className={`song-picker-row ${alreadyAdded ? "disabled" : ""}`}>
                    <input
                      type="checkbox"
                      checked={selected || alreadyAdded}
                      disabled={alreadyAdded}
                      onChange={() => {
                        setSelectedSongIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(song._id)) next.delete(song._id);
                          else next.add(song._id);
                          return next;
                        });
                      }}
                    />
                    <div className="picker-cover cover-art">
                      {song.coverArt ? (
                        <img src={song.coverArt} alt={song.title} />
                      ) : (
                        <span className="cover-art-placeholder">♪</span>
                      )}
                    </div>
                    <div className="picker-info">
                      <span className="song-title">{song.title}</span>
                      <span className="song-artist">{song.artist}</span>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSongPicker(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddSongs}
                disabled={selectedSongIds.size === 0}
              >
                Add {selectedSongIds.size > 0 ? `(${selectedSongIds.size})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
