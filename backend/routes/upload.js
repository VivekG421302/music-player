/**
 * routes/upload.js — File Upload Route
 *
 * POST /upload
 *  - Accepts multiple audio files via multipart/form-data (field: "files")
 *  - Extracts metadata (title, artist, duration, coverArt) via music-metadata
 *  - Creates Song documents in MongoDB
 *  - Triggers Auto-Album Creation: groups songs by artist string
 *
 * Storage: ./uploads/ directory (swap for Telegram/S3 by replacing diskStorage)
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const mm = require("music-metadata");

const Song = require("../models/Song");
const Album = require("../models/Album");

const router = express.Router();

/* ─────────────────── Multer Storage Config ────────────────── */
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    // Unique filename: uuid + original extension
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/x-m4a"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
});

/* ──────────────────── Auto-Album Logic ────────────────────── */
/**
 * Finds or creates an Album document for a given artist.
 * Normalizes the artist string to lowercase for deduplication.
 * Adds the new songId to the album's songIds array.
 *
 * @param {string} artist — Raw artist name from metadata
 * @param {string} songId — MongoDB ObjectId of the uploaded song
 * @param {string|null} coverArt — Cover art to set if album is new
 */
async function assignToAlbum(artist, songId, coverArt) {
  const artistKey = artist.toLowerCase().trim();
  const albumName = `${artist}`;

  let album = await Album.findOne({ artistKey });

  if (!album) {
    // Create a new album for this artist
    album = new Album({
      name: albumName,
      artist,
      artistKey,
      songIds: [songId],
      coverArt: coverArt || null,
    });
  } else {
    // Add song to existing album; set cover if not already present
    if (!album.coverArt && coverArt) album.coverArt = coverArt;
    album.songIds.push(songId);
  }

  await album.save();
  return album;
}

/* ──────────────────── Extract Cover Art ───────────────────── */
/**
 * Converts the first picture in ID3 tags to a base64 data URL.
 * Returns null if no picture is present.
 */
function extractCoverArt(metadata) {
  const picture = metadata.common?.picture?.[0];
  if (!picture) return null;
  const base64 = Buffer.from(picture.data).toString("base64");
  return `data:${picture.format};base64,${base64}`;
}

/* ─────────────────────── POST /upload ─────────────────────── */
router.post("/", upload.array("files", 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No audio files uploaded" });
  }

  const results = [];
  const errors = [];

  for (const file of req.files) {
    try {
      // Parse ID3 / metadata tags from the saved file
      const metadata = await mm.parseFile(file.path);
      const { title, artist, album: albumTag, duration } = metadata.common;

      // Build the relative URL that the frontend will use to stream the file
      const fileUrl = `/uploads/${file.filename}`;

      // Extract embedded cover art (if any)
      const coverArt = extractCoverArt(metadata);

      // Determine display values, falling back to filename
      const songTitle = title || path.parse(file.originalname).name;
      const songArtist = artist || "Unknown Artist";

      // Create the Song document
      const song = new Song({
        title: songTitle,
        artist: songArtist,
        album: albumTag || `${songArtist}`,  // will be overridden by auto-album
        fileUrl,
        duration: Math.round(duration || 0),
        coverArt,
        mimeType: file.mimetype,
        fileSize: file.size,
      });

      await song.save();

      // Auto-Album: group by artist string
      const autoAlbum = await assignToAlbum(songArtist, song._id, coverArt);

      // Update song's album field to reflect the auto-assigned album
      song.album = autoAlbum.name;
      await song.save();

      results.push(song);
    } catch (err) {
      console.error(`[UPLOAD] Error processing ${file.originalname}:`, err.message);
      errors.push({ file: file.originalname, error: err.message });

      // Clean up the file if song creation failed
      fs.unlink(file.path, () => {});
    }
  }

  res.status(201).json({
    uploaded: results.length,
    songs: results,
    errors,
  });
});

module.exports = router;
