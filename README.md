# YouTube Music Mode Chrome Extension

A minimalist, high-efficiency Chrome extension designed to transform YouTube into a lean music player. Perfect for background listening, slow connections, or users who want to focus on audio without visual distractions.

## 🚀 Features

- **Direct Toggle**: Click the extension icon in your toolbar to instantly enable or disable Music Mode.
- **Visual Status**: A red "ON" badge appears on the icon when the mode is active for that specific tab.
- **Miniaturized UI**: 
  - Shrunken thumbnails for Home, Search, Sidebar recommendations, and Playlists.
  - Video player height reduced to a slim profile.
- **Audio-First Experience**:
  - The video element is hidden by default (audio continues playing).
  - Player controls remain fully visible and functional.
  - **Show/Hide Video** toggle button injected right after the video title for quick peeks.
- **Optimized Performance**:
  - Automatically forces video quality to the lowest available (144p or 240p) to minimize buffering and save data.
- **SPA & Refresh Persistence**:
  - Remembers your toggle state when you refresh the page or navigate between videos on YouTube.
  - State is isolated per tab.

## 🛠️ Installation

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** by toggling the switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the `youtube-music-mode-chrome-extension` folder.

## 📖 Usage

1. Open any [YouTube](https://www.youtube.com) video.
2. Click the **Music Mode** icon in your Chrome extension toolbar.
3. You will see an **"ON"** badge on the icon, and the page will transform into the minimalist music layout.
4. Click the **"👁️ Show Video"** button located next to the video title if you need to see the visuals temporarily.
5. Toggle it off by clicking the extension icon again.

## 🖼️ Icons
The extension uses a custom-vibrant music note icon. When active, it displays a red status badge.

---
Built with 🚀 using **Antigravity** and **Opus 4.5**. Created for a faster, cleaner YouTube audio experience.
