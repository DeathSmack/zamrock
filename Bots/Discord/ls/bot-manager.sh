#!/usr/bin/env bash
# bot_manager.sh
#   Detects, stops, and optionally restarts the Zamrock Discord bot.
#   Works for bots started in the background (nohup) or in the current
#   terminal window.

set -euo pipefail

# ---------------------------------
# Configuration
# ---------------------------------
BOT_CMD="python3 LS-bot-dis.py"          # command that starts the bot
BOT_DIR="************"                   # pick a dir
VENV_DIR="$BOT_DIR/*****-venv"           # fill in venv name

# ---------------------------------
# Helpers
# ---------------------------------
log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

# Find all PIDs that match the bot script name.
find_bot_pids() {
    # Use basename so we match 'LS-bot-dis.py' regardless of cwd.
    local script=$(basename "$BOT_CMD")
    pgrep -f "$script" || true
}

kill_bot()        { local pid=$1; log "Killing bot process $pid"; kill "$pid" 2>/dev/null || true; }
force_kill_bot()  { local pid=$1; log "Force‑killing bot process $pid"; kill -9 "$pid" 2>/dev/null || true; }

# ---------------------------------
# Start helpers
# ---------------------------------
start_bot_in_background() {
    log "Starting bot in background..."
    (cd "$BOT_DIR" && source "$VENV_DIR/bin/activate" && nohup $BOT_CMD >/dev/null 2>&1 &)
    log "Bot started in background."
}

start_bot_in_terminal() {
    log "Starting bot in the current terminal window..."
    cd "$BOT_DIR"
    source "$VENV_DIR/bin/activate"
    exec $BOT_CMD   # replaces this shell; bot logs appear here
}

# ---------------------------------
# Main logic
# ---------------------------------
pids=($(find_bot_pids))
if [[ ${#pids[@]} -gt 0 ]]; then
    log "Found running bot process(es): ${pids[*]}"
    for pid in "${pids[@]}"; do
        kill_bot "$pid"
    done
    sleep 3
    remaining=($(find_bot_pids))
    if [[ ${#remaining[@]} -gt 0 ]]; then
        log "Process(es) still running after graceful kill: ${remaining[*]}"
        for pid in "${remaining[@]}"; do
            force_kill_bot "$pid"
        done
    else
        log "All bot processes terminated gracefully."
    fi
else
    log "No running bot process found."
fi

echo
read -p "Start a new bot instance? (b = background, t = terminal, n = none) [b] " choice
choice=${choice:-b}
case "$choice" in
    [Bb]) start_bot_in_background ;;
    [Tt]) start_bot_in_terminal ;;
    [Nn]) log "Not starting a new instance." ;;
    *) log "Invalid choice. Exiting." && exit 1 ;;
esac

log "Script finished."
