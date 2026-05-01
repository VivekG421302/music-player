import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Music,
  PlayCircle,
  ListMusic,
  User
} from "lucide-react";
import "./Sidebar.css";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/songs", label: "Songs", icon: Music },
  { path: "/player", label: "Player", icon: PlayCircle },
  { path: "/playlists", label: "Playlists", icon: ListMusic },
  { path: "/profile", label: "Profile", icon: User },
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
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">
              <Icon size={20} strokeWidth={1.8} />
            </span>
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