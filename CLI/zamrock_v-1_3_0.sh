#!/bin/bash

# Check for required command-line utilities
command -v ffplay >/dev/null 2>&1 || { echo "ffplay is required but it's not installed. Aborting." >&2; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg is required but it's not installed. Aborting." >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required but it's not installed. Aborting." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq is required but it's not installed. Aborting." >&2; exit 1; }

# Audio URL to play
AUDIO_URL="https://zamrock.deathsmack.com/listen/zamrock/test_stream_7e335"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECORD_DIR="$SCRIPT_DIR/ZamRock Archive"  # Directory to save recordings
UPLOAD_URL="https://zamrock.net/wp-json/upload/v1/mp3/"  # WordPress upload endpoint
UPLOAD_LOG="$SCRIPT_DIR/uploaded_files.log"  # Log of uploaded files

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
select_record_duration() {
    echo -e "${CYAN}Select a recording duration:${NC}"
    echo -e "${YELLOW}a) 10 seconds (10 seconds) for testing${NC}"
    echo -e "${YELLOW}b) 5 minutes (300 seconds) for longer tests${NC}"  # Added 5-minute option
    echo -e "${YELLOW}c) 30 minutes (1800 seconds)${NC}"
    echo -e "${YELLOW}d) 1 hour (3600 seconds)${NC}"
    echo -e "${YELLOW}e) 2 hours (7200 seconds)${NC}"
    echo -e "${YELLOW}f) 4 hours (14400 seconds)${NC}"

    read -n 1 -s -p "Please choose (a/b/c/d/e/f): " choice
    echo  # Move to the next line after user's input

    case $choice in
        a) duration=10 ;;     # 10 seconds
        b) duration=300 ;;    # 5 minutes
        c) duration=1800 ;;   # 30 minutes
        d) duration=3600 ;;   # 1 hour
        e) duration=7200 ;;   # 2 hours
        f) duration=14400 ;;  # 4 hours
        *) echo -e "${RED}Invalid choice. Recording for 10 seconds by default.${NC}"; duration=10 ;;
    esac

    # Ask user if they want to upload after recording
    read -n 1 -s -p "Would you like to upload the recording after it's done? (y/n): " upload_choice
    echo  # Move to the next line after user's input

    # Start the recording
    record_audio "$duration" "$upload_choice"
}

# Function to record specified seconds of audio
record_audio() {
    local duration=$1
    local upload_choice=$2
    local date=$(date +"%Y-%m-%d")  # Format: YYYY-MM-DD
    local timestamp=$(date +"%H-%M-%S")  # Format: HH-MM-SS
    local file_path="$RECORD_DIR/ZamRock_${duration}s_${date}_${timestamp}.mp3"  # Update the file naming to include duration, date, and timestamp

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

    # Prompt user for upload after recording if they opted for it
    if [ "$upload_choice" == "y" ]; then
        upload_recording "$file_path"
    else
        echo -e "${YELLOW}You can upload the file later if you want.${NC}"
    fi
}

# Function to upload the recorded audio to the server
upload_recording() {
    local file_path="$1"

    # Check if the file exists
    if [[ -f "$file_path" ]]; then
        echo -e "${YELLOW}Uploading the recorded audio to the server...${NC}"
        echo -e "${YELLOW}Commands are disabled until upload is finished. Please do not close the terminal.${NC}"

        # Start the upload command and capture both response and HTTP status
        response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$UPLOAD_URL" -F "file=@$file_path" -H "Content-Type: multipart/form-data" --progress-bar 2>&1)

        # Capture the exit status of the curl command
        curl_exit_status=$?

        # Process the response to extract percent uploaded
        if [ $curl_exit_status -eq 0 ]; then
            # Print the output and extract HTTP status code
            echo "$response" | awk '/%/{print $1"% uploaded"}'

            # HTTP response code received
            final_http_code=$(echo "$response" | tail -n 1)
            if [ "$final_http_code" == "200" ]; then
                local filename=$(basename "$file_path")
                echo -e "${GREEN}File ${filename} successfully added to ZamRock radio archives!${NC}"
                echo -e "${GREEN}Thank you for your contribution!${NC}"
                echo "$(basename "$file_path")" >> "$UPLOAD_LOG"  # Log the uploaded file
            else
                echo -e "${RED}Upload failed with HTTP code: ${final_http_code}${NC}"
                echo -e "${RED}Please check the server status or your file size.${NC}"
            fi
        else
            echo -e "${RED}Failed to execute upload command. Please check your network connection.${NC}"
        fi
    else
        echo -e "${RED}File not found for uploading: $file_path${NC}"
    fi
}

# Function to start a timer for Ramen Noodle Timer
start_noodle_timer() {
    local duration=180  # Set the timer for 3 minutes
    echo -e "${YELLOW}Starting the Ramen Noodle Timer for ${duration} seconds...${NC}"

    while [ $duration -gt 0 ]; do
        echo -ne "${YELLOW}Timer: $duration seconds remaining...${NC}\r"
        sleep 1
        ((duration--))
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
echo -e "${YELLOW}Press 'h' for help commands.${NC}"

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

    # Print Stream Title and Genre at the end of the timer output
    if [[ -n "$STREAM_TITLE" ]]; then
        if [ "$STREAM_TITLE" != "$LAST_STREAM_TITLE" ]; then
            LAST_STREAM_TITLE="$STREAM_TITLE"
            if [[ -n "$GENRE" ]]; then
                LAST_GENRE="$GENRE"
                echo -e "\n${RED}${STREAM_TITLE}${NC}"
                echo -e "${BLUE}${LAST_GENRE}${NC}"
            else
                echo -e "\n${RED}${STREAM_TITLE}${NC}"
            fi
        else
            echo -e "\n${GREEN}${STREAM_TITLE}${NC}"
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
    echo -e "${YELLOW}a${NC}  - Archive the audio stream (select duration or cancel recording)"
    echo -e "${YELLOW}i${NC}  - Information about ZamRock"
    echo -e "${YELLOW}h${NC}  - Show this help menu"
    echo -e "${YELLOW}q${NC}  - Quit the script"
    echo -e "${YELLOW}---------------------------------${NC}"
}

# Function to display information about ZamRock
show_info() {
    echo -e "${YELLOW}Learn more about ZamRock:${NC}"
    echo -e "${CYAN}---------------------------------${NC}"
    echo -e "${YELLOW}Apply for membership for the radio at:${NC} ${GREEN}https://zamrock.net/${NC}"
    echo -e "${YELLOW}Chat with us on Discord at:${NC} ${GREEN}https://discord.gg/tHDfcWj9${NC}"
    echo -e "${YELLOW}Follow us for news and updates at:${NC} ${GREEN}https://bsky.app/profile/zamrock.bsky.social${NC}"
    echo -e "${CYAN}---------------------------------${NC}"
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
        select_record_duration  # Prompt for recording duration
    elif [ "$key" == "i" ]; then
        show_info
    elif [ "$key" == "h" ]; then
        show_help
    elif [ "$key" == "q" ]; then
        echo
        break
    fi
done

# Handle graceful exit
echo -e "${YELLOW}Thank you for listening!${NC}"

# Clean up
kill $PID 2>/dev/null
rm "$TMP_LOG"
echo "Playback finished."
