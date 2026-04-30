/**
 * index.js — Express Server Entry Point
 * Personal Music Player Suite Backend
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
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
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

app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

/* ──────────────────── Start Server & MongoDB ───────────────────── */
// FIX: Using process.env directly to avoid duplicate 'const' declarations
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Running on port ${PORT}`);
  
  const dbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/musicplayer";

  mongoose
    .connect(dbUri)
    .then(() => {
      console.log("[DB] Connected to MongoDB");
    })
    .catch((err) => {
      console.error("[DB] Connection error:", err.message);
   
    });
});