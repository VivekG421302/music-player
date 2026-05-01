/**
 * routes/playlists.js — Playlist CRUD API Routes
 *
 * GET    /playlists          — List all playlists (populated with songs)
 * POST   /playlists          — Create a new playlist
 * GET    /playlists/:id      — Single playlist with populated songs
 * PUT    /playlists/:id      — Update name/description/coverArt
 * POST   /playlists/:id/songs — Add songs to playlist
 * DELETE /playlists/:id/songs — Remove songs from playlist
 * DELETE /playlists/:id      — Delete playlist entirely
 */

const express = require("express");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

const router = express.Router();
const SONG_FIELDS = "title artist album duration coverArt telegramFileId telegramFilePath mimeType";

/* ─────────────── GET /playlists (all) ─────────────────────── */
router.get("/", async (_req, res) => {
  try {
    const playlists = await Playlist.find()
      .populate("songIds", SONG_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── POST /playlists (create) ──────────────────── */
router.post("/", async (req, res) => {
  try {
    const { name, description, songIds } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Playlist name is required" });
    }

    // Validate songIds if provided
    let validSongIds = [];
    if (songIds && Array.isArray(songIds) && songIds.length > 0) {
      const songs = await Song.find({ _id: { $in: songIds } }).select("_id");
      validSongIds = songs.map((s) => s._id);
    }

    const playlist = new Playlist({
      name: name.trim(),
      description: description?.trim() || "",
      songIds: validSongIds,
    });

    await playlist.save();
    await playlist.populate("songIds", SONG_FIELDS);

    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── GET /playlists/:id ───────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("songIds", SONG_FIELDS)
      .lean();

    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── PUT /playlists/:id (update meta) ─────────── */
router.put("/:id", async (req, res) => {
  try {
    const { name, description, coverArt } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (coverArt !== undefined) updates.coverArt = coverArt;

    const playlist = await Playlist.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("songIds", SONG_FIELDS);

    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────── POST /playlists/:id/songs (add songs) ──────────── */
router.post("/:id/songs", async (req, res) => {
  try {
    const { songIds } = req.body;
    if (!Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ error: "Provide an array of songIds" });
    }

    // $addToSet avoids duplicates
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { songIds: { $each: songIds } } },
      { new: true }
    ).populate("songIds", SONG_FIELDS);

    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────── DELETE /playlists/:id/songs (remove songs) ─────── */
router.delete("/:id/songs", async (req, res) => {
  try {
    const { songIds } = req.body;
    if (!Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ error: "Provide an array of songIds" });
    }

    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $pullAll: { songIds } },
      { new: true }
    ).populate("songIds", SONG_FIELDS);

    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── DELETE /playlists/:id ────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.json({ message: "Playlist deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
