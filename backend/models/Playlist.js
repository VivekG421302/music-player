/**
 * models/Playlist.js — Playlist Mongoose Model
 *
 * Fields:
 *  name        — Playlist display name
 *  description — Optional text description
 *  songIds     — Array of Song ObjectId references
 *  coverArt    — Derived from first song's cover, or custom
 *  createdAt   — Auto-managed by timestamps
 */

const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    songIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    coverArt: {
      type: String,  // URL or base64; auto-derived if null
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Playlist", playlistSchema);
