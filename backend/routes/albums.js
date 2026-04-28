/**
 * routes/albums.js — Album API Routes
 *
 * Albums are auto-created on upload; they are read-only from the client.
 *
 * GET /albums       — List all albums with song count
 * GET /albums/:id   — Single album with populated songs
 */

const express = require("express");
const Album = require("../models/Album");

const router = express.Router();

/* ─────────────── GET /albums ───────────────────────────────── */
router.get("/", async (_req, res) => {
  try {
    const albums = await Album.find()
      .populate("songIds", "title artist duration coverArt fileUrl")
      .sort({ createdAt: -1 })
      .lean();

    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── GET /albums/:id ──────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate("songIds", "title artist duration coverArt fileUrl mimeType")
      .lean();

    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
