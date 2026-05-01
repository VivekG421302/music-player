/**
 * index.js — Express Server Entry Point
 * Personal Music Player Suite Backend
 */

const path = require("path");
const envPath = path.join(__dirname, ".env");
const dotenvResult = require("dotenv").config({ path: envPath, override: true });

if (dotenvResult.error) {
  console.warn(`[ENV] Could not load ${envPath}: ${dotenvResult.error.message}`);
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const { logTelegramConfigStatus } = require("./config/telegram");

const songRoutes = require("./routes/songs");
const playlistRoutes = require("./routes/playlists");
const albumRoutes = require("./routes/albums");
const uploadRoutes = require("./routes/upload");
const telegramRoutes = require("./routes/telegram");

const app = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────── CORS ─────────────────────────── */
const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

const isAllowedDevOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1):517\d$/.test(origin);

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin) || isAllowedDevOrigin(origin)) {
//       callback(null, true);
//     } else {
//       callback(null, false);
//     }
//   },
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// };

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (like curl, mobile apps)
    if (!origin) return callback(null, true);

    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    const isVercel = /^https:\/\/.*\.vercel\.app$/.test(origin);
    const isAllowed = allowedOrigins.includes(origin);

    if (isLocalhost || isVercel || isAllowed) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ─────────────────────── Body Parsers ─────────────────────── */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ──────────────────────── API Routes ──────────────────────── */
function requireDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  next();
}

app.use("/songs", requireDatabase, songRoutes);
app.use("/upload", requireDatabase, uploadRoutes);
app.use("/playlists", requireDatabase, playlistRoutes);
app.use("/albums", requireDatabase, albumRoutes);
app.use("/api/telegram", requireDatabase, telegramRoutes);

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
connectDB()
  .then(() => {
    logTelegramConfigStatus();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[SERVER] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[DB] Startup connection failed:", err.message);
    process.exit(1);
  });
