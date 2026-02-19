#osu!music

A premium, minimalist music player for **osu! beatmaps**, designed with the sleek aesthetics of **osu!lazer** in mind. Built for a fast, immersive, and high-performance audio experience on macOS.

## ? Features

- **Lazer-Inspired UI**: A stunning glassmorphic interface with vibrant card backgrounds and smooth animations.
- **Beatmap Integration**: Automatically detects and plays music directly from your osu! installation.
- **Smart Search**: Real-time filtering with support for Unicode titles and artist names.
- **Premium Audio**: High-quality playback powered by Howler.js.
- **macOS Native**: Optimized for macOS with custom icons, window draggability, and native behavior.

## ??? Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Animations**: Framer Motion
- **Database**: Realm (MongoDB) for fast beatmap indexing
- **Desktop**: Electron 40.6.0
- **Build**: Electron Builder

## ?? Getting Started

### Prerequisites
- Node.js (v20+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/xtx-junkcode/osumusic.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run dist
   ```

## ?? Releases
Grab the latest `.dmg` or `.zip` from the [releases page](https://github.com/xtx-junkcode/osumusic/releases) or the `release/` folder after building.

---
Created with ?? by [tonixtx](https://github.com/xtx-junkcode)
