/**
 * src/services/api.js — Centralized API Layer
 *
 * All HTTP calls to the backend are made here.
 * The base URL is read from the VITE_API_URL environment variable.
 *
 * Usage example:
 *   import api from './services/api';
 *   const songs = await api.getSongs({ page: 1, limit: 20 });
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────── Internal fetch helper ─────────────────── */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      // Don't set Content-Type for FormData (browser handles multipart boundary)
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      message = errBody.error || message;
    } catch (_) {}
    throw new Error(message);
  }

  return response.json();
}

/* ─────────────────────── Song API ─────────────────────────── */
const songs = {
  /**
   * Fetch a paginated list of songs.
   * @param {object} params — { page, limit, sort, order, search, artist, album }
   */
  getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/songs${qs ? `?${qs}` : ""}`);
  },

  /** Fetch a single song by ID */
  getById(id) {
    return request(`/songs/${id}`);
  },

  /** Record a play event (increments playCount on backend) */
  recordPlay(id) {
    return request(`/songs/${id}/play`, { method: "POST" });
  },

  /** Delete a song */
  delete(id) {
    return request(`/songs/${id}`, { method: "DELETE" });
  },
};

/* ──────────────────── Upload API ──────────────────────────── */
const upload = {
  /**
   * Upload one or more audio files.
   * @param {FileList|File[]} files
   * @param {function} onProgress — optional progress callback (0-100)
   */
  uploadFiles(files, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/upload`);

      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  },
};

/* ─────────────────── Playlist API ─────────────────────────── */
const playlists = {
  /** Fetch all playlists */
  getAll() {
    return request("/playlists");
  },

  /** Fetch single playlist with populated songs */
  getById(id) {
    return request(`/playlists/${id}`);
  },

  /** Create a new playlist */
  create(data) {
    return request("/playlists", { method: "POST", body: JSON.stringify(data) });
  },

  /** Update playlist name/description */
  update(id, data) {
    return request(`/playlists/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },

  /** Add songs to a playlist */
  addSongs(id, songIds) {
    return request(`/playlists/${id}/songs`, {
      method: "POST",
      body: JSON.stringify({ songIds }),
    });
  },

  /** Remove songs from a playlist */
  removeSongs(id, songIds) {
    return request(`/playlists/${id}/songs`, {
      method: "DELETE",
      body: JSON.stringify({ songIds }),
    });
  },

  /** Delete a playlist entirely */
  delete(id) {
    return request(`/playlists/${id}`, { method: "DELETE" });
  },
};

/* ──────────────────── Album API ────────────────────────────── */
const albums = {
  getAll() {
    return request("/albums");
  },
  getById(id) {
    return request(`/albums/${id}`);
  },
};

const api = { songs, upload, playlists, albums };
export default api;
