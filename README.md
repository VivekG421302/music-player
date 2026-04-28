# 🎵 Groove — Personal Music Player Suite

A full-stack personal music player with a React + Vite frontend and a Node.js + Express backend.

---

## Architecture Overview

```
groove/
├── frontend/     # React + Vite (deploys to Vercel)
└── backend/      # Node.js + Express (deploys to Render)
```

| Layer     | Tech                                        |
|-----------|---------------------------------------------|
| Frontend  | React 18, Vite, plain JS, pure CSS          |
| Backend   | Node.js, Express 4, Multer, music-metadata  |
| Database  | MongoDB Atlas + Mongoose                    |
| Deploy    | Vercel (frontend) + Render (backend)        |

---

## Features

- 🎵 **Uninterrupted playback** — audio persists across all navigation via React Context
- 🎨 **Theme Engine** — pick any accent colour on the Profile page; updates CSS variables live
- 📀 **Vinyl Player** — rotating vinyl record animation with tonearm on the Player page
- ♾️ **Infinite Scroll** — IntersectionObserver-based pagination on Songs and Home
- 💾 **Blob Cache** — uploaded songs are cached as object URLs (sessionStorage) to prevent lag
- 🗂️ **Auto-Album** — backend groups songs into albums by artist string on upload
- 📋 **Playlists** — create, delete, add/remove songs, bulk upload
- 🔀 **Play Modes** — Sequence, Shuffle, Revolve (loop all), Repeat (loop one)
- 📱 **Responsive** — mobile bottom tab bar + compact mini-player

---

## Quick Start (Local Development)

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas free tier)

### 1. Clone

```bash
git clone https://github.com/your-username/groove.git
cd groove
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and CORS_ORIGIN
npm run dev         # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL=http://localhost:5000
npm run dev         # starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Required | Example                                      | Description                              |
|----------------|----------|----------------------------------------------|------------------------------------------|
| `MONGODB_URI`  | ✅        | `mongodb+srv://user:pw@cluster.mongodb.net/musicplayer` | MongoDB connection string   |
| `PORT`         | ❌        | `5000`                                       | HTTP port (Render sets this auto)        |
| `CORS_ORIGIN`  | ✅        | `https://your-app.vercel.app`                | Vercel frontend URL (no trailing slash)  |

### Frontend (`frontend/.env.local`)

| Variable        | Required | Example                              | Description              |
|-----------------|----------|--------------------------------------|--------------------------|
| `VITE_API_URL`  | ✅        | `https://your-backend.onrender.com`  | Render backend URL       |

---

## Deploying to Production

### Step 1 — MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create a free cluster
2. **Database Access** → Add a user with read/write privileges
3. **Network Access** → Allow access from anywhere (`0.0.0.0/0`) for Render
4. **Connect** → Copy the connection string (replace `<password>`)

### Step 2 — Deploy Backend to Render

1. Push the project to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo; set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Node version**: 18 or higher
4. Add **Environment Variables**:
   - `MONGODB_URI` — your Atlas URI
   - `CORS_ORIGIN` — leave blank for now, fill in after Vercel deploy
5. Click **Deploy**. Copy the service URL (e.g. `https://groove-api.onrender.com`)

### Step 3 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add **Environment Variable**:
   - `VITE_API_URL` = your Render URL (e.g. `https://groove-api.onrender.com`)
4. Click **Deploy**. Copy the Vercel URL (e.g. `https://groove.vercel.app`)

### Step 4 — Update CORS on Render

1. Go back to your Render service → **Environment**
2. Set `CORS_ORIGIN` = your Vercel URL (e.g. `https://groove.vercel.app`)
3. Render will auto-redeploy

---

## API Reference

### Songs

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/songs`              | Paginated list; query: `page, limit, sort, order, search, artist, album` |
| GET    | `/songs/:id`          | Single song                        |
| POST   | `/songs/:id/play`     | Increment play count               |
| DELETE | `/songs/:id`          | Delete song + file                 |

### Upload

| Method | Endpoint   | Description                                         |
|--------|------------|-----------------------------------------------------|
| POST   | `/upload`  | Multipart upload; field: `files[]`; max 20 files, 50 MB each |

### Playlists

| Method | Endpoint                    | Description                     |
|--------|-----------------------------|---------------------------------|
| GET    | `/playlists`                | All playlists (songs populated) |
| POST   | `/playlists`                | Create playlist `{ name, description, songIds }` |
| GET    | `/playlists/:id`            | Single playlist                 |
| PUT    | `/playlists/:id`            | Update name / description       |
| POST   | `/playlists/:id/songs`      | Add songs `{ songIds: [] }`     |
| DELETE | `/playlists/:id/songs`      | Remove songs `{ songIds: [] }`  |
| DELETE | `/playlists/:id`            | Delete playlist                 |

### Albums

| Method | Endpoint      | Description                              |
|--------|---------------|------------------------------------------|
| GET    | `/albums`     | All albums (auto-created on upload)      |
| GET    | `/albums/:id` | Single album with populated songs        |

---

## Folder Structure

```
backend/
├── index.js              # Express server entry
├── models/
│   ├── Song.js           # Song Mongoose model
│   ├── Playlist.js       # Playlist model
│   └── Album.js          # Album model (auto-grouped by artist)
├── routes/
│   ├── songs.js          # GET/DELETE songs + play count
│   ├── upload.js         # Multer upload + auto-album logic
│   ├── playlists.js      # Full playlist CRUD
│   └── albums.js         # Album read routes
└── uploads/              # Audio files (local; swap for Telegram/S3)

frontend/
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx           # React root
    ├── App.jsx            # Routes + providers
    ├── services/
    │   └── api.js         # Centralized API (all fetch calls)
    ├── context/
    │   ├── AudioContext.jsx  # Global audio + queue + recents
    │   └── ThemeContext.jsx  # Accent colour engine
    ├── hooks/
    │   └── usePaginatedSongs.js  # IntersectionObserver pagination
    ├── components/
    │   ├── Layout/
    │   │   ├── Sidebar.jsx / .css
    │   ├── Player/
    │   │   ├── MiniPlayer.jsx / .css
    │   └── UI/
    │       ├── SongRow.jsx
    │       ├── PlaylistCard.jsx / .css
    ├── pages/
    │   ├── Home.jsx / .css
    │   ├── Songs.jsx / .css
    │   ├── Player.jsx / .css
    │   ├── Playlists.jsx / .css
    │   └── Profile.jsx / .css
    └── styles/
        └── globals.css    # Design system, variables, utilities
```

---

## Swapping Storage (Telegram / S3)

The upload route in `backend/routes/upload.js` uses Multer's `diskStorage` to save files to `./uploads/`. To switch providers:

1. Replace the `storage` constant with your target (e.g. `multer-s3`, a Telegram Bot API call)
2. Update `fileUrl` to point to the new file location (CDN URL, Telegram file URL, etc.)
3. The rest of the backend and all frontend code remains unchanged

---

## Caching Strategy

- **Blob Cache** (`frontend/src/context/AudioContext.jsx`): when a song first plays, its audio is fetched and stored as a `URL.createObjectURL(blob)` in a module-level `blobCache` object. Subsequent plays reuse the blob URL with zero network cost.
- **Recently Played** (`localStorage key: groove_recents`): last 20 songs, stored as JSON. Read by both Home and Songs pages.

---

## Licence

MIT — personal use, modify freely.
# music-player
