const mongoose = require("mongoose");

async function connectDB() {
  const dbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/musicplayer";
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER;

  if (!process.env.MONGODB_URI) {
    if (isProduction) {
      throw new Error("MONGODB_URI is required in production");
    }
    console.warn("[DB] MONGODB_URI is not set; using local MongoDB fallback");
  }

  if (!/^mongodb(\+srv)?:\/\//.test(dbUri)) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://");
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[DB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[DB] MongoDB disconnected");
  });

  await mongoose.connect(dbUri, {
    serverSelectionTimeoutMS: 10000,
  });
}

module.exports = connectDB;
