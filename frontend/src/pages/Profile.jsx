/**
 * src/pages/Profile.jsx — Profile & Settings Page
 *
 * Sections:
 *  - Theme Engine: custom accent color picker
 *  - Storage stats: total songs, playlists, estimated size
 *  - About section
 */

import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import "./Profile.css";

// Preset accent colors
const COLOR_PRESETS = [
  { label: "Violet",  value: "#a78bfa" },
  { label: "Cyan",    value: "#22d3ee" },
  { label: "Rose",    value: "#fb7185" },
  { label: "Amber",   value: "#fbbf24" },
  { label: "Emerald", value: "#34d399" },
  { label: "Fuchsia", value: "#e879f9" },
  { label: "Indigo",  value: "#818cf8" },
  { label: "Orange",  value: "#fb923c" },
];

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

export default function Profile() {
  const { accentColor, setAccent } = useTheme();
  const [stats, setStats] = useState({ songs: 0, playlists: 0, totalSize: 0 });
  const [customColor, setCustomColor] = useState(accentColor);

  useEffect(() => {
    async function loadStats() {
      try {
        const [songsData, playlistsData] = await Promise.all([
          api.songs.getAll({ limit: 1 }),
          api.playlists.getAll(),
        ]);

        // Rough size estimate: fetch a page of songs and sum fileSize
        const allSongs = await api.songs.getAll({ limit: 200 });
        const totalSize = allSongs.songs.reduce(
          (sum, s) => sum + (s.fileSize || 0),
          0
        );

        setStats({
          songs: songsData.pagination.total,
          playlists: playlistsData.length,
          totalSize,
        });
      } catch (_) {}
    }
    loadStats();
  }, []);

  const handlePreset = (hex) => {
    setCustomColor(hex);
    setAccent(hex);
  };

  const handleCustomChange = (e) => {
    setCustomColor(e.target.value);
    setAccent(e.target.value);
  };

  return (
    <div className="page-container profile-page">
      <h1>Profile & Settings</h1>

      {/* ── Theme Engine ── */}
      <section className="settings-section">
        <div className="settings-section-title">
          <span className="settings-icon">🎨</span>
          <h2>Accent Colour</h2>
        </div>
        <p className="settings-desc">
          Choose your accent colour — it updates the entire UI instantly.
        </p>

        <div className="color-presets">
          {COLOR_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              className={`color-preset ${accentColor === value ? "active" : ""}`}
              style={{ background: value }}
              onClick={() => handlePreset(value)}
              title={label}
            />
          ))}
        </div>

        <div className="custom-color-row">
          <label className="form-label">Custom colour</label>
          <div className="custom-color-input">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomChange}
              className="color-picker-native"
            />
            <input
              type="text"
              className="form-input color-hex-input"
              value={customColor}
              onChange={(e) => {
                if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                  setCustomColor(e.target.value);
                  if (e.target.value.length === 7) setAccent(e.target.value);
                }
              }}
              maxLength={7}
              placeholder="#a78bfa"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="accent-preview">
          <div
            className="accent-preview-swatch"
            style={{ background: accentColor }}
          />
          <span style={{ color: accentColor }}>Current: {accentColor}</span>
        </div>
      </section>

      {/* ── Storage Stats ── */}
      <section className="settings-section">
        <div className="settings-section-title">
          <span className="settings-icon">📊</span>
          <h2>Library Stats</h2>
        </div>

        <div className="stats-grid">
          <div className="stat-card card">
            <span className="stat-number" style={{ color: accentColor }}>
              {stats.songs}
            </span>
            <span className="stat-label">Songs</span>
          </div>
          <div className="stat-card card">
            <span className="stat-number" style={{ color: accentColor }}>
              {stats.playlists}
            </span>
            <span className="stat-label">Playlists</span>
          </div>
          <div className="stat-card card">
            <span className="stat-number" style={{ color: accentColor }}>
              {formatBytes(stats.totalSize)}
            </span>
            <span className="stat-label">Storage Used</span>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="settings-section">
        <div className="settings-section-title">
          <span className="settings-icon">ℹ</span>
          <h2>About Groove</h2>
        </div>
        <div className="about-card card">
          <div className="about-logo">
            <span className="about-logo-mark">G</span>
            <div>
              <strong>Groove</strong>
              <p>Personal Music Player Suite</p>
            </div>
          </div>
          <div className="about-details">
            <div className="about-row">
              <span>Version</span>
              <span>1.0.0</span>
            </div>
            <div className="about-row">
              <span>Frontend</span>
              <span>React + Vite</span>
            </div>
            <div className="about-row">
              <span>Backend</span>
              <span>Node.js + Express</span>
            </div>
            <div className="about-row">
              <span>Database</span>
              <span>MongoDB / Mongoose</span>
            </div>
            <div className="about-row">
              <span>Deployed on</span>
              <span>Vercel + Render</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
