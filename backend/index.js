/**
 * index.js — Express Server Entry Point
 * Personal Music Player Suite Backend
 *
 * Responsibilities:
 *  - Connect to MongoDB via Mongoose
 *  - Configure CORS for Vercel frontend
 *  - Mount API routes: /songs, /upload, /playlists, /albums
 *  - Serve static uploaded files
 *  - Health-check endpoint for Render
 */

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const songRoutes = require("./routes/songs");
const playlistRoutes = require("./routes/playlists");
const albumRoutes = require("./routes/albums");
const uploadRoutes = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────── CORS ─────────────────────────── */
// Allow the Vercel frontend origin + local dev.
// Set CORS_ORIGIN in Render env vars to your Vercel URL.
const allowedOrigins = [
  process.env.CORS_ORIGIN,          // e.g. https://your-app.vercel.app
  "http://localhost:5173",           // Vite dev server
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* ─────────────────────── Body Parsers ─────────────────────── */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ──────────────── Static Files (Uploaded Audio) ───────────── */
// Files land in ./uploads/ — swap this path for Telegram/S3 later
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ──────────────────────── API Routes ──────────────────────── */
app.use("/songs", songRoutes);
app.use("/upload", uploadRoutes);
app.use("/playlists", playlistRoutes);
app.use("/albums", albumRoutes);

/* ──────────────────────── Health Check ────────────────────── */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

/* ──────────────────── 404 & Error Handlers ────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

/* ──────────────────── MongoDB Connection ───────────────────── */
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/musicplayer";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("[DB] Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[DB] Connection error:", err.message);
    process.exit(1);
  });

  /* ──────────────────── Start Server & MongoDB ───────────────────── */
const MONGODB_URI = process.env.MONGODB_URI;

// 1. Start the server immediately so Render's health check passes
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Running on port ${PORT}`);
  
  // 2. Connect to MongoDB after the server is up
  if (!MONGODB_URI) {
    console.error("[DB] Error: MONGODB_URI is not defined in environment variables.");
  } else {
    mongoose
      .connect(MONGODB_URI)
      .then(() => console.log("[DB] Connected to MongoDB"))
      .catch((err) => {
        console.error("[DB] Connection error:", err.message);
        // Do not use process.exit(1) here on Render; let the server stay up
        // so you can see the logs and troubleshoot.
      });
  }
});