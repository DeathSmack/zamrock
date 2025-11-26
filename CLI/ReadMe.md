# ZamRock CLI Radio Player

A feature-rich terminal-based radio player for ZamRock Radio with recording capabilities, timer, and more.

![ZamRock CLI Screenshot](screenshot.png)

## Features

- 🎵 Stream ZamRock Radio directly in your terminal
- ⏱️ Built-in Ramen Noodle Timer
- 🎙️ Record streams with various options
- 🎨 Colorful ASCII art display
- 📝 Track information display
- 🔄 Automatic song detection
- 🎵 Lyrics lookup
- 📁 Local recording management

## Installation

### Dependencies

- `ffmpeg` - For audio playback and recording
- `ffplay` - For audio playback
- `curl` - For API requests
- `jq` - For JSON parsing

#### Debian/Ubuntu
```bash
sudo apt update
sudo apt install -y ffmpeg curl jq
