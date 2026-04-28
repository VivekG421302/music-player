/**
 * src/context/ThemeContext.jsx — Theme Engine
 *
 * Manages the user's custom accent color (--primary-color CSS variable).
 * Persisted in localStorage under key 'groove_accent'.
 *
 * Exposes:
 *  accentColor  — current hex color string
 *  setAccent(hex) — updates CSS variable + localStorage
 */

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext(null);

const ACCENT_KEY = "groove_accent";
const DEFAULT_ACCENT = "#a78bfa"; // violet

export function ThemeProvider({ children }) {
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT
  );

  // Apply to CSS variable whenever accent changes
  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", accentColor);

    // Derive a dimmed version for hover/glow effects
    document.documentElement.style.setProperty(
      "--primary-glow",
      `${accentColor}40` // 25% opacity
    );
  }, [accentColor]);

  const setAccent = (hex) => {
    setAccentColor(hex);
    localStorage.setItem(ACCENT_KEY, hex);
  };

  return (
    <ThemeCtx.Provider value={{ accentColor, setAccent }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
