const express = require("express");
const Song = require("../models/Song");
const { assertTelegramDownloadConfig } = require("../config/telegram");

const router = express.Router();

function buildTelegramFileUrl(botToken, filePath) {
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}

async function getTelegramFilePath(botToken, fileId) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`
  );
  const data = await response.json();

  if (!data.ok || !data.result?.file_path) {
    throw new Error(data.description || "Telegram getFile failed");
  }

  return data.result.file_path;
}

router.get("/:fileId", async (req, res, next) => {
  try {
    const { botToken } = assertTelegramDownloadConfig();

    const fileId = req.params.fileId;
    const song = await Song.findOne({ telegramFileId: fileId });
    let filePath = song?.telegramFilePath;

    if (!filePath) {
      filePath = await getTelegramFilePath(botToken, fileId);
      if (song) {
        song.telegramFilePath = filePath;
        await song.save();
      }
    }

    res.set("Cache-Control", "private, max-age=3600");
    res.json({
      url: buildTelegramFileUrl(botToken, filePath),
      filePath,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
