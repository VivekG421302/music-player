/**
 * src/App.jsx — Application Root
 *
 * Wraps everything in context providers and sets up React Router routes.
 * The MiniPlayer is rendered outside <Routes> so it persists across navigation.
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AudioProvider } from "./context/AudioContext";
import { ThemeProvider } from "./context/ThemeContext";

import Sidebar from "./components/Layout/Sidebar";
import MiniPlayer from "./components/Player/MiniPlayer";

import Home from "./pages/Home";
import Songs from "./pages/Songs";
import Player from "./pages/Player";
import Playlists from "./pages/Playlists";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/songs" element={<Songs />} />
              <Route path="/player" element={<Player />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/profile" element={<Profile />} />
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          {/* MiniPlayer sits fixed at the bottom, outside the scrollable main */}
          <MiniPlayer />
        </div>
      </AudioProvider>
    </ThemeProvider>
  );
}
