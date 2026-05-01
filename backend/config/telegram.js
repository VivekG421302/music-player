function getTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN?.trim(),
    chatId: process.env.TELEGRAM_CHAT_ID?.trim(),
  };
}

function getMissingTelegramConfig() {
  const { botToken, chatId } = getTelegramConfig();
  const missing = [];

  if (!botToken) missing.push("TELEGRAM_BOT_TOKEN");
  if (!chatId) missing.push("TELEGRAM_CHAT_ID");

  return missing;
}

function assertTelegramUploadConfig() {
  const missing = getMissingTelegramConfig();
  if (missing.length > 0) {
    const err = new Error(`Telegram upload is not configured: missing ${missing.join(", ")}`);
    err.status = 503;
    throw err;
  }

  return getTelegramConfig();
}

function assertTelegramDownloadConfig() {
  const { botToken } = getTelegramConfig();
  if (!botToken) {
    const err = new Error("Telegram download is not configured: missing TELEGRAM_BOT_TOKEN");
    err.status = 503;
    throw err;
  }

  return { botToken };
}

function logTelegramConfigStatus() {
  const missing = getMissingTelegramConfig();

  if (missing.length > 0) {
    console.error(`[TELEGRAM] Missing config: ${missing.join(", ")}. Uploads/playback URL resolution will fail until set.`);
    return;
  }

  console.log("[TELEGRAM] Config loaded");
}

module.exports = {
  assertTelegramDownloadConfig,
  assertTelegramUploadConfig,
  logTelegramConfigStatus,
};
