/**
 * models/Song.js — Song Mongoose Model
 *
 * Fields:
 *  title       — Track name (extracted from ID3 tags or filename)
 *  artist      — Artist name (used for auto-album grouping)
 *  album       — Auto-assigned by backend based on artist string
 *  telegramFileId   — Telegram audio file_id used for playback
 *  telegramFilePath — Optional cached Telegram file_path from getFile
 *  duration    — Duration in seconds (extracted via music-metadata)
 *  coverArt    — Base64 data URL or URL string for album art
 *  mimeType    — MIME type of the uploaded file (e.g. audio/mpeg)
 *  fileSize    — Size in bytes
 *  playCount   — Incremented each time the song is played
 *  createdAt   — Automatically managed by Mongoose timestamps
 */

const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      default: "Unknown Artist",
      trim: true,
    },
    album: {
      type: String,
      default: "Unknown Album",
      trim: true,
    },
    telegramFileId: {
      type: String,
      required: true,
    },
    telegramFilePath: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,  // seconds
      default: 0,
    },
    coverArt: {
      type: String,  // base64 data URL or external URL
      default: null,
    },
    mimeType: {
      type: String,
      default: "audio/mpeg",
    },
    fileSize: {
      type: Number,  // bytes
      default: 0,
    },
    playCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,  // adds createdAt, updatedAt
  }
);

// Index for fast artist-based album grouping queries
songSchema.index({ artist: 1 });
songSchema.index({ album: 1 });
songSchema.index({ createdAt: -1 });
songSchema.index({ telegramFileId: 1 });

module.exports = mongoose.model("Song", songSchema);
