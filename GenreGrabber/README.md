# 🎵 GenreGrabber - AI-Powered Music Genre Extractor

## Overview
GenreGrabber is a powerful Brave browser extension that helps music enthusiasts, DJs, and audio professionals quickly extract and organize music genre information from audio analysis websites. With a single click, copy detailed genre information or AI-generated track descriptions to your clipboard.

## ✨ Features
- **One-Click Genre Extraction** - Instantly copy the main genre and top 5 subgenres in a clean, pipe-separated format
- **AI-Powered Descriptions** - Copy AI-generated track descriptions with a single click
- **Keyboard Shortcut** - Use `Alt+Shift+L` to quickly copy genre information
- **Clean, Minimal Interface** - Simple popup with two intuitive buttons
- **Manifest V3 Compliant** - Built with the latest web extension standards

## 🚀 Installation
1. Download or clone this repository
2. Open Brave browser and navigate to `brave://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## 🎛️ Usage
1. Navigate to any supported audio analysis website (e.g., audioaidynamics.com/genre-finder)
2. Click the extension icon in your browser toolbar
3. Click "Copy Genre" to copy the main genre and subgenres (format: `main:sub1|sub2|sub3|sub4|sub5`)
4. Click "Copy Comments" to copy the AI-generated track description

## 🛠️ Development
### Prerequisites
- Node.js (v14+)
- npm or yarn

### Building
```bash
# Install dependencies
npm install

# Build the extension
npm run build
