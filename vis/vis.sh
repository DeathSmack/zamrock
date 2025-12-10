#!/usr/bin/env bash
set -euo pipefail

# Correct stream URL (taken from zamrock radio-info.md)
STREAM_URL="https://divine-paper-3624.deathsmack-a51.workers.dev/"

# Optional: path to a CAVA config (will be used only if the file exists)
CAVA_CONF="${HOME}/.config/cava/config"

# Check that ffmpeg and cava are present
command -v ffmpeg &>/dev/null || { echo "ffmpeg not installed"; exit 1; }
command -v cava   &>/dev/null || { echo "cava not installed"; exit 1; }

# Build the CAVA invocation
CAVA_CMD="cava"
[[ -f "$CAVA_CONF" ]] && CAVA_CMD="$CAVA_CMD -p \"$CAVA_CONF\""

# Pull the stream and pipe it into CAVA
ffmpeg -loglevel error -i "$STREAM_URL" -f wav -ar 44100 -ac 1 - | eval "$CAVA_CMD"