#!/bin/bash

# Check for required command-line utilities
command -v ffplay >/dev/null 2>&1 || { echo "ffplay is required but it's not installed. Aborting." >&2; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg is required but it's not installed. Aborting." >&2; exit 1; }

# Audio URL to play
AUDIO_URL="https://zamrock.deathsmack.com/listen/zamrock/test_stream_7e335"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECORD_DIR="$SCRIPT_DIR/ZamRock Archive"  # Directory to save recordings

# Define colors
RED='\033[0;31m'    # Color for StreamTitle (when it changes)
GREEN='\033[0;32m'  # Color for StreamTitle (once displayed)
BLUE='\033[0;34m'   # Color for Genre
YELLOW='\033[1;33m' # Color for messages
CYAN='\033[0;36m'   # Color for help message
NC='\033[0m'        # No Color

# Function to print ASCII Art
print_ascii_art() {
    cat << "EOF"
__________             __________               __
\____    /____    _____\______   \ ____   ____ |  | __
  /     /\__  \  /     \|       _//  _ \_/ ___\|  |/ /
 /     /_ / __ \|  Y Y  \    |   (  <_> )  \___|    <
/_______ (____  /__|_|  /____|_  /\____/ \___  >__|_ \
        \/    \/      \/       \/            \/     \/
       __________             .___.__
       \______   \_____     __| _/|__| ____
        |       _/\__  \   / __ | |  |/  _ \
        |    |   \ / __ \_/ /_/ | |  (  <_> )
        |____|_  /(____  /\____ | |__|\____/
               \/      \/      \/
EOF
}

# Function to create a directory for recordings if it doesn't exist
create_recording_directory() {
    if [ ! -d "$RECORD_DIR" ]; then
        mkdir -p "$RECORD_DIR"
        echo -e "${YELLOW}Created directory for recordings: $RECORD_DIR${NC}"
    fi
}

# Function to prompt user to select recording duration
prompt_record_duration() {
    echo -e "${CYAN}Select a recording duration:${NC}"
    echo -e "${YELLOW}a) 30 minutes (1800 seconds)${NC}"
    echo -e "${YELLOW}b) 1 hour (3600 seconds)${NC}"
    echo -e "${YELLOW}c) 2 hours (7200 seconds)${NC}"
    echo -e "${YELLOW}d) 4 hours (14400 seconds)${NC}"
    read -n 1 -s -p "Please choose (a/b/c/d): " choice
    echo  # Move to the next line after user's input

    case $choice in
        a) duration=1800 ;;  # 30 minutes
        b) duration=3600 ;;  # 1 hour
        c) duration=7200 ;;  # 2 hours
        d) duration=14400 ;; # 4 hours
        *) echo -e "${RED}Invalid choice. Recording for 30 minutes by default.${NC}"; duration=1800 ;;
    esac

    record_audio "$duration"
}

# Function to record specified seconds of audio with a countdown timer
record_audio() {
    local duration=$1
    local date
    date=$(date +"%Y-%m-%d")  # Format: YYYY-MM-DD
    local file_path
    file_path="$RECORD_DIR/ZamRock_${duration}s_${date}.mp3"  # Update file naming to include duration and date

    echo -e "${YELLOW}Archiving audio for ${duration} seconds...${NC}"

    # Run ffmpeg in the background
    ffmpeg -t "${duration}" -i "$AUDIO_URL" -acodec copy "$file_path" -y -loglevel quiet &
    FFMPEG_PID=$!

    # Countdown timer while recording
    for ((i=duration; i>0; i--)); do
        echo -ne "${YELLOW}Recording... $i seconds remaining...${NC}\r"
        sleep 1
    done
    echo ""  # Move to the next line after the countdown

    # Wait for ffmpeg to finish
    wait $FFMPEG_PID
    echo -e "${YELLOW}Recording saved to: $file_path${NC}"
}

# Function to start a timer for Ramen Noodle Timer
start_noodle_timer() {
    local duration=180  # Set the timer for 3 minutes
    echo -e "${YELLOW}Starting the Ramen Noodle Timer for ${duration} seconds...${NC}"

    while [ $duration -gt 0 ]; do
        echo -ne "${YELLOW}Timer: $duration seconds remaining...${NC}\r"
        sleep 1
        ((duration--))

        # Check if the timer was cancelled
        if [ $TIMER_CANCELLED -eq 1 ]; then
            echo -e "\n${YELLOW}Timer was canceled by user :(${NC}"
            return
        fi
    done

    echo -e "\n${YELLOW}Timer completed! Ready to eat noodles!${NC}"
}

# Start playing audio in the background
echo "Playing audio stream..."

# Print ASCII Art just before starting the audio
print_ascii_art

# Redirect ffplay output to a temporary file
TMP_LOG=$(mktemp)
ffplay -nodisp -autoexit "$AUDIO_URL" -loglevel info 2> "$TMP_LOG" &
PID=$!

# Print instructions
echo -e "${YELLOW}Press 'p' to pause/unpause, 'r' to start/cancel the Ramen Noodle Timer, 'a' to archive the audio, 'h' for help, or 'q' to quit.${NC}"

# Initialize variables
LAST_STREAM_TITLE=""
LAST_GENRE=""
PAUSED=false  # Track the paused state
TIMER_CANCELLED=0  # Track if timer is cancelled
TIMER_RUNNING=false  # Track if the timer is currently running

# Create the recording directory
create_recording_directory

# Function to fetch and print metadata
fetch_metadata() {
    # Fetch metadata using `ffmpeg`
    METADATA=$(ffmpeg -i "$AUDIO_URL" 2>&1 | grep -E 'StreamTitle|icy-name|icy-genre')

    # Extract the StreamTitle and Genre if available
    STREAM_TITLE=$(echo "$METADATA" | grep 'StreamTitle' | cut -d ':' -f 2- | tr -d ' ')
    GENRE=$(echo "$METADATA" | grep 'icy-genre' | cut -d ':' -f 2- | tr -d ' ')

    # Print Stream Title and Genre
    if [[ -n "$STREAM_TITLE" ]]; then
        if [ "$STREAM_TITLE" != "$LAST_STREAM_TITLE" ]; then
            echo -e "${RED}${STREAM_TITLE}${NC}"
            LAST_STREAM_TITLE="$STREAM_TITLE"

            if [[ -n "$GENRE" ]]; then
                LAST_GENRE="$GENRE"
                echo -e "${BLUE}${LAST_GENRE}${NC}"
            fi
        else
            echo -e "${GREEN}${STREAM_TITLE}${NC}"
        fi
    else
        echo "No current StreamTitle available."
    fi
}

# Start a background job to monitor the output log
(
    while kill -0 $PID 2>/dev/null; do
        while IFS= read -r line; do
            if [[ $line == *"Stream #0:0: Audio: mp3,"* ]]; then
                fetch_metadata
                break
            fi
        done < "$TMP_LOG"
        sleep 5  # Fetch metadata every 5 seconds
    done
) &

# Command help function
show_help() {
    echo -e "${CYAN}Available Commands:${NC}"
    echo -e "${YELLOW}---------------------------------${NC}"
    echo -e "${YELLOW}p${NC}  - Pause or unpause the audio stream"
    echo -e "${YELLOW}r${NC}  - Start or cancel the Ramen Noodle Timer"
    echo -e "${YELLOW}a${NC}  - Archive the audio stream (select duration)"
    echo -e "${YELLOW}h${NC}  - Show this help menu"
    echo -e "${YELLOW}q${NC}  - Quit the script"
    echo -e "${YELLOW}---------------------------------${NC}"
}

# Start the input loop for user commands
while kill -0 $PID 2>/dev/null; do
    read -n 1 -s key  # Read one character silently

    if [ "$key" == "p" ]; then
        if $PAUSED; then
            echo "Resuming playback..."
            kill -CONT $PID  # Send CONT signal to resume
            PAUSED=false
        else
            echo "Pausing playback..."
            kill -STOP $PID  # Send STOP signal to pause
            PAUSED=true
        fi
    elif [ "$key" == "r" ]; then
        if ! $TIMER_RUNNING; then
            TIMER_CANCELLED=0
            TIMER_RUNNING=true
            start_noodle_timer &
            TIMER_PID=$!
        else
            TIMER_CANCELLED=1
            TIMER_RUNNING=false
            kill $TIMER_PID 2>/dev/null
            echo -e "${YELLOW}Timer was canceled by user :(${NC}"
        fi
    elif [ "$key" == "a" ]; then
        prompt_record_duration
    elif [ "$key" == "h" ]; then
        show_help
    elif [ "$key" == "q" ]; then
        echo
        break
    fi
done

# Handle graceful exit
if [[ -n "$STREAM_NAME" ]]; then
    echo -e "${YELLOW}Thank you for listening to ${STREAM_NAME}!${NC}"
else
    echo -e "${YELLOW}Thank you for listening!${NC}"
fi

# Clean up
kill $PID 2>/dev/null
rm "$TMP_LOG"
echo "Playback finished."
