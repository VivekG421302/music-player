/**
 * src/components/Layout/Sidebar.jsx — Main Navigation Sidebar
 */

import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const NAV_ITEMS = [
  { path: "/",          label: "Home",      icon: "⌂" },
  { path: "/songs",     label: "Songs",     icon: "♪" },
  { path: "/player",   label: "Player",    icon: "▶" },
  { path: "/playlists",label: "Playlists", icon: "☰" },
  { path: "/profile",  label: "Profile",   icon: "◎" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-mark">G</span>
        <span className="logo-text">Groove</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">{icon}</span>
            <span className="sidebar-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <p className="sidebar-version">v1.0.0</p>
      </div>
    </aside>
  );
}
