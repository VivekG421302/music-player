/**
 * routes/upload.js — Telegram-Based Upload Route
 *
 * POST /upload
 *  - Accepts multiple audio files (multipart/form-data, field: "files")
 *  - Extracts metadata using music-metadata (from buffer)
 *  - Uploads audio to Telegram (stores file_id)
 *  - Creates Song documents in MongoDB
 *  - Auto-creates Albums grouped by artist
 *
 * ⚠️ No local file storage anymore
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const mm = require("music-metadata");

const Song = require("../models/Song");
const Album = require("../models/Album");
const { assertTelegramUploadConfig } = require("../config/telegram");

const router = express.Router();

/* ─────────────────── MULTER (MEMORY) ─────────────────── */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "audio/x-flac",
    "audio/aac",
    "audio/mp4",
    "audio/x-m4a",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (Telegram limit)
});

/* ─────────────────── TELEGRAM UPLOAD ─────────────────── */
async function uploadToTelegram(buffer, filename, mimeType) {
  const { botToken, chatId } = assertTelegramUploadConfig();

  const formData = new FormData();

  formData.append("chat_id", chatId);
  formData.append(
    "audio",
    new Blob([buffer], { type: mimeType }),
    filename
  );

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendAudio`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.ok || !data.result?.audio?.file_id) {
    console.error("Telegram error:", data);
    throw new Error(data.description || "Telegram upload failed");
  }

  return {
    fileId: data.result.audio.file_id,
    filePath: data.result.audio.file_path || null, // optional
  };
}

/* ─────────────────── AUTO-ALBUM LOGIC ─────────────────── */
async function assignToAlbum(artist, songId, coverArt) {
  const artistKey = artist.toLowerCase().trim();
  const albumName = `${artist}`;

  let album = await Album.findOne({ artistKey });

  if (!album) {
    album = new Album({
      name: albumName,
      artist,
      artistKey,
      songIds: [songId],
      coverArt: coverArt || null,
    });
  } else {
    if (!album.coverArt && coverArt) album.coverArt = coverArt;
    if (!album.songIds.some((id) => id.toString() === songId.toString())) {
      album.songIds.push(songId);
    }
  }

  await album.save();
  return album;
}

/* ─────────────────── COVER ART EXTRACT ─────────────────── */
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
  const statuses = req.files.map((file) => ({
    file: file.originalname,
    status: "pending",
  }));

  for (const [index, file] of req.files.entries()) {
    try {
      statuses[index].status = "uploading";

      /* 1. Extract metadata from buffer */
      const metadata = await mm.parseBuffer(
        file.buffer,
        file.mimetype
      );

      const { title, artist, album: albumTag, duration } = metadata.common;

      /* 2. Extract cover art */
      const coverArt = extractCoverArt(metadata);

      /* 3. Normalize values */
      const songTitle =
        title || path.parse(file.originalname).name;

      const songArtist = artist || "Unknown Artist";

      /* 4. Upload to Telegram */
      const { fileId, filePath } = await uploadToTelegram(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      /* 5. Save Song in DB */
      const song = new Song({
        title: songTitle,
        artist: songArtist,
        album: albumTag || `${songArtist}`,
        telegramFileId: fileId,
        telegramFilePath: filePath,
        duration: Math.round(duration || 0),
        coverArt,
        mimeType: file.mimetype,
        fileSize: file.size,
      });

      await song.save();

      /* 6. Auto-Album */
      const autoAlbum = await assignToAlbum(
        songArtist,
        song._id,
        coverArt
      );

      song.album = autoAlbum.name;
      await song.save();

      results.push(song);
      statuses[index] = {
        file: file.originalname,
        status: "done",
        songId: song._id,
      };
    } catch (err) {
      console.error(
        `[UPLOAD ERROR] ${file.originalname}:`,
        err.message
      );

      statuses[index] = {
        file: file.originalname,
        status: "error",
        error: err.message,
      };
    }
  }

  res.status(201).json({
    uploaded: results.length,
    songs: results,
    statuses,
    errors: statuses.filter((item) => item.status === "error"),
  });
});

module.exports = router;
