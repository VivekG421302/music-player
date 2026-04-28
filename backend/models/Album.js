/**
 * models/Album.js — Album Mongoose Model
 *
 * Albums are automatically created/updated when songs are uploaded.
 * Grouping key: the 'artist' string (lowercased + trimmed).
 *
 * Fields:
 *  name        — Album name (defaults to "artist's Songs")
 *  artist      — Artist name (the grouping key)
 *  artistKey   — Normalized lowercase artist for deduplication
 *  songIds     — References to Song documents in this album
 *  coverArt    — Taken from first song uploaded to this album
 */

const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    // Normalized for deduplication: toLowerCase().trim()
    artistKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    songIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    coverArt: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

albumSchema.index({ artistKey: 1 });

module.exports = mongoose.model("Album", albumSchema);
