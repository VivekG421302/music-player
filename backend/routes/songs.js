/**
 * routes/songs.js — Song API Routes
 *
 * GET  /songs           — Paginated list of all songs
 * GET  /songs/:id       — Single song by ID
 * POST /songs/:id/play  — Increment play count (for "Recently Played" tracking)
 * DELETE /songs/:id     — Delete a song record
 */

const express = require("express");
const Song = require("../models/Song");
const Album = require("../models/Album");

const router = express.Router();
const ALLOWED_SORT_FIELDS = new Set(["createdAt", "title", "artist", "album", "playCount"]);

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ─────────────────── GET /songs (paginated) ───────────────── */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.artist) filter.artist = new RegExp(escapeRegex(req.query.artist), "i");
    if (req.query.album) filter.album = new RegExp(escapeRegex(req.query.album), "i");
    if (req.query.search) {
      const search = new RegExp(escapeRegex(req.query.search), "i");
      filter.$or = [
        { title: search },
        { artist: search },
        { album: search },
      ];
    }

    // Sort options: createdAt (default), title, artist, playCount
    const requestedSort = req.query.sort || "createdAt";
    const sortField = ALLOWED_SORT_FIELDS.has(requestedSort) ? requestedSort : "createdAt";
    const sortDir = req.query.order === "asc" ? 1 : -1;

    const [songs, total] = await Promise.all([
      Song.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limit).lean(),
      Song.countDocuments(filter),
    ]);

    res.json({
      songs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("[SONGS] GET /songs failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────── GET /songs/:id ───────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).lean();
    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ──────────────── POST /songs/:id/play ────────────────────── */
// Called by frontend when playback starts; increments playCount
router.post("/:id/play", async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    ).lean();

    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json({ playCount: song.playCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────── DELETE /songs/:id ────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: "Song not found" });

    // Remove song reference from its album
    await Album.updateMany({ songIds: song._id }, { $pull: { songIds: song._id } });

    await Song.findByIdAndDelete(req.params.id);

    res.json({ message: "Song deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
