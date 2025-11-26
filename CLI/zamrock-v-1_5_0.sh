#!/bin/bash

# Check for required command-line utilities
command -v ffplay >/dev/null 2>&1 || { echo "ffplay is required but it's not installed. Aborting." >&2; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg is required but it's not installed. Aborting." >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required but it's not installed. Aborting." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq is required but it's not installed. Aborting." >&2; exit 1; }

# Audio URL to play
AUDIO_URL="https://zamrock.deathsmack.com/listen/zamrock/test_stream_7e335"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECORD_DIR="$SCRIPT_DIR/ZamRock Recordings"  # Directory to save recordings
API_URL="https://zamrock.deathsmack.com/api/nowplaying/1"  # AzuraCast API endpoint
WEBSITE_LINK="https://zamrock.net"

# Define colors
RED='\033[0;31m'    # Color for StreamTitle (when it changes)
GREEN='\033[0;32m'  # Color for StreamTitle (once displayed)
BLUE='\033[0;34m'   # Color for Genre
YELLOW='\033[1;33m' # Color for messages
CYAN='\033[0;36m'   # Color for help message
PURPLE='\033[0;35m' # Color for timer
NC='\033[0m'        # No Color

# Display settings
ASCII_DISPLAY_INTERVAL=300  # Show ASCII art every 5 minutes (300 seconds)
TRACK_UPDATE_INTERVAL=2     # Update track info every 2 seconds
ascii_counter=0
LAST_ASCII_TIME=0

# Global variables for timer and recording
TIMER_RUNNING=false
TIMER_PID=0
TIMER_DURATION=0
TIMER_START=0
RECORDING_PID=0
RECORDING_ACTIVE=false

# Function to print ASCII Art with color
print_ascii_art() {
    # Generate 8 different random colors for the logo
    local colors=()
    for i in {1..8}; do
        colors+=($((RANDOM % 6 + 31)))  # Random color between 31-36
    done
    
    # Print each line with a different color
    printf "\n"
    printf "\033[1;${colors[0]}m"
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
ZamZam for life...
EOF
    printf "\033[1;${colors[7]}mVisit us at: https://zamrock.net\n"
    printf "${NC}"  # Reset color
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
ZamZam for life...
Visit us at: https://zamrock.net
EOF
    printf "${NC}"  # Reset color
    echo -e "${YELLOW}ZamRock Radio - The Home of Zambian Rock Music${NC}\n"
}

# Function to create a directory for recordings if it doesn't exist
create_recording_directory() {
    if [ ! -d "$RECORD_DIR" ]; then
        mkdir -p "$RECORD_DIR"
        echo -e "${YELLOW}Created directory for recordings: $RECORD_DIR${NC}"
    fi
}

# Function to fetch metadata from AzuraCast API
fetch_metadata() {
    local response
    local exit_code
    
    # Fetch metadata using curl with timeout
    response=$(curl -s -w "%{http_code}" --max-time 10 "$API_URL" 2>/dev/null)
    exit_code="${response: -3}"
    response="${response%???}"
    
    if [ "$exit_code" = "200" ] && [ -n "$response" ]; then
        # Parse JSON response using jq
        local song_title=$(echo "$response" | jq -r '.now_playing.song.title // .now_playing.song.text // "Unknown Track"')
        local artist=$(echo "$response" | jq -r '.now_playing.song.artist // "Unknown Artist"')
        local album=$(echo "$response" | jq -r '.now_playing.song.album // "Unknown Album"')
        local playlist=$(echo "$response" | jq -r '.now_playing.playlist // "Unknown Collection"')
        local duration=$(echo "$response" | jq -r '.now_playing.duration // 0')
        local elapsed=$(echo "$response" | jq -r '.now_playing.elapsed // 0')
        local remaining=$(echo "$response" | jq -r '.now_playing.remaining // 0')
        
        echo "$song_title|$artist|$album|$playlist|$duration|$elapsed|$remaining"
    else
        echo ""
    fi
}

# Function to format duration in seconds to readable string
format_duration() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))
    
    if [ $hours -gt 0 ]; then
        printf "%02d:%02d:%02d" $hours $minutes $secs
    else
        printf "%02d:%02d" $minutes $secs
    fi
}

# Function to draw a progress bar
draw_progress_bar() {
    local current=$1
    local total=$2
    local bar_length=30
    local message="$3"
    local color="$4"
    
    # Use yellow if no color specified
    [ -z "$color" ] && color="YELLOW"
    
    # Get the color code
    local color_code="${!color}"
    
    if [ $total -eq 0 ]; then
        printf "\r${color_code}%s [%s] %s/%s${NC}" \
            "$message" \
            "$(printf '%*s' $bar_length | tr ' ' '?')" \
            "$(format_duration $current)" \
            "$(format_duration $total)"
        return
    fi
    
    # Ensure current doesn't exceed total
    if [ $current -gt $total ]; then
        current=$total
    fi
    
    local filled=$(( (bar_length * current) / total ))
    local empty=$(( bar_length - filled ))
    
    # Ensure filled doesn't exceed bar length
    if [ $filled -gt $bar_length ]; then
        filled=$bar_length
        empty=0
    fi
    
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="█"; done
    for ((i=0; i<empty; i++)); do bar+="░"; done
    
    printf "\r${color_code}%s [%s] %s/%s${NC}" \
        "$message" \
        "$bar" \
        "$(format_duration $current)" \
        "$(format_duration $total)"
}

# Function to show now playing progress with real duration
show_now_playing_progress() {
    local duration=$1
    local elapsed=$2
    local remaining=$3
    
    if [ $duration -eq 0 ]; then
        echo -e "${CYAN}Now Playing - Duration unknown${NC}"
        return
    fi
    
    # Show progress for the remaining time of the current track
    for ((i=0; i<=remaining; i++)); do
        local current_elapsed=$((elapsed + i))
        draw_progress_bar $current_elapsed $duration "Now Playing"
        sleep 1
        
        # Check if we've reached the end of the track
        if [ $current_elapsed -ge $duration ]; then
            break
        fi
    done
    echo ""  # New line after progress bar
}

# Function to prompt user to select recording duration
select_record_duration() {
    echo -e "${CYAN}Select a recording duration:${NC}"
    echo -e "${YELLOW}a) 10 seconds (10 seconds) for testing${NC}"
    echo -e "${YELLOW}b) 5 minutes (300 seconds) for longer tests${NC}"
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
        e) duration=7200 ;;  # 2 hours
        f) duration=14400 ;;  # 4 hours
        *) echo -e "${RED}Invalid choice. Recording for 10 seconds by default.${NC}"; duration=10 ;;
    esac

    # Ask user if they want to upload after recording
    read -n 1 -s -p "Would you like to upload the recording after it's done? (y/n): " upload_choice
    echo  # Move to the next line after user's input

    # Start the recording
    record_audio "$duration" "$upload_choice"
}

# Function to record specified seconds of audio with progress bar
record_audio() {
    local duration=$1
    local upload_choice=$2
    local date=$(date +"%Y-%m-%d")
    local timestamp=$(date +"%H-%M-%S")
    local file_path="$RECORD_DIR/ZamRock_${duration}s_${date}_${timestamp}.mp3"

    echo -e "${YELLOW}Archiving audio for ${duration} seconds...${NC}"

    # Run ffmpeg in the background
    ffmpeg -t "${duration}" -i "$AUDIO_URL" -acodec copy "$file_path" -y -loglevel quiet &
    FFMPEG_PID=$!

    # Progress bar while recording
    for ((i=0; i<=duration; i++)); do
        draw_progress_bar $i $duration "Recording"
        sleep 1
        
        # Check if ffmpeg is still running
        if ! kill -0 $FFMPEG_PID 2>/dev/null; then
            break
        fi
    done
    echo ""  # New line after progress bar

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

# Function to upload the recorded audio to the server with progress bar
upload_recording() {
    local file_path="$1"

    # Check if the file exists
    if [[ -f "$file_path" ]]; then
        echo -e "${YELLOW}Uploading the recorded audio to the server...${NC}"
        echo -e "${YELLOW}Commands are disabled until upload is finished. Please do not close the terminal.${NC}"

        # Get file size for progress calculation
        local file_size=$(stat -c%s "$file_path" 2>/dev/null || echo "0")
        
        if [ "$file_size" -eq 0 ]; then
            # Fallback for systems without stat -c
            file_size=$(wc -c < "$file_path" 2>/dev/null || echo "0")
        fi
        
        # Start upload with progress monitoring
        local uploaded_bytes=0
        local last_progress_time=0
        
        # Use curl with progress bar and monitor the output
        response=$(curl -w "%{http_code}" -o /dev/null -X POST "$UPLOAD_URL" \
            -F "file=@$file_path" \
            -H "Content-Type: multipart/form-data" \
            --progress-bar 2>&1)
        
        # Extract HTTP status code
        local http_code="${response##*$'\n'}"
        local response_body="${response%$'\n'*}"
        
        # Process the response
        if [ "$http_code" = "200" ]; then
            local filename=$(basename "$file_path")
            echo -e "${GREEN}File ${filename} successfully added to ZamRock radio archives!${NC}"
            echo -e "${GREEN}Thank you for your contribution!${NC}"
            echo "$(basename "$file_path")" >> "$UPLOAD_LOG"
        else
            echo -e "${RED}Upload failed with HTTP code: ${http_code}${NC}"
            echo -e "${RED}Please check the server status or your file size.${NC}"
        fi
    else
        echo -e "${RED}File not found for uploading: $file_path${NC}"
    fi
}

# Function to start a timer for Ramen Noodle Timer
start_noodle_timer() {
    if $TIMER_RUNNING; then
        # Cancel existing timer
        if [ -f "/tmp/timer_cancel_$TIMER_PID" ]; then
            rm -f "/tmp/timer_cancel_$TIMER_PID"
        fi
        touch "/tmp/timer_cancel_$TIMER_PID"
        TIMER_RUNNING=false
        # Make sure the timer process is really dead
        kill -9 $TIMER_PID 2>/dev/null
        wait $TIMER_PID 2>/dev/null
        echo -e "\n${YELLOW}⏹️  Timer cancelled${NC}"
        return
    fi
    
    local duration=180  # 3 minutes
    TIMER_START=$(date +%s)
    TIMER_DURATION=$duration
    TIMER_RUNNING=true
    
    (
        for ((i=0; i<=duration; i++)); do
            if [ -f "/tmp/timer_cancel_$TIMER_PID" ]; then
                rm -f "/tmp/timer_cancel_$TIMER_PID"
                break
            fi
            sleep 1
        done
        
        if [ $i -ge $duration ]; then
            # Timer completed
            echo -e "\n${GREEN}⏰ Timer completed! Ready to eat noodles! 🍜${NC}"
            # Play a sound if available
            if command -v paplay &> /dev/null; then
                paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || \
                paplay /usr/share/sounds/gnome/default/alerts/glass.ogg 2>/dev/null || \
                echo -e "\a"  # Fallback to terminal bell
            else
                echo -e "\a"  # Terminal bell
            fi
        fi
        
        TIMER_RUNNING=false
    ) &
    TIMER_PID=$!
    disown
    
    echo -e "\n${GREEN}⏱️  Ramen Timer started for $(format_duration $duration)${NC}"
    echo -e "${YELLOW}Press 'r' again to cancel the timer${NC}"
}

# Function to record the stream
record_stream() {
    echo -e "\n${CYAN}🎙️  Recording Options:${NC}"
    echo "1. 10 second test clip"
    echo "2. Custom duration (e.g., 30s, 2m, 1h)"
    echo "3. Record until specific file size (e.g., 5mb, 1gb)"
    echo -n "Select an option (1-3): "
    read -r choice
    
    case $choice in
        1)
            record_duration 10 "10s_test"
            ;;
        2)
            echo -n "Enter duration (e.g., 30s, 2m, 1h): "
            read -r duration
            record_duration $duration "custom_${duration}"
            ;;
        3)
            echo -n "Enter file size (e.g., 5mb, 1gb): "
            read -r size
            record_until_size $size
            ;;
        *)
            echo -e "${YELLOW}Invalid option. Returning to main menu.${NC}"
            return
            ;;
    esac
}

# Record for a specific duration
record_duration() {
    local duration=$1
    local prefix=$2
    local filename="${prefix}_$(date +%Y%m%d_%H%M%S).mp3"
    local filepath="$RECORD_DIR/$filename"
    
    mkdir -p "$RECORD_DIR"
    
    # Pause any active playback
    local was_playing=true
    if $PAUSED; then
        was_playing=false
    else
        kill -STOP $PID 2>/dev/null
    fi
    
    # Clear any existing trap
    trap - INT
    
    echo -e "\n${YELLOW}🎙️  Recording $duration of audio to:${NC}"
    echo -e "${CYAN}$filepath${NC}"
    echo -e "${YELLOW}Press 'a' to cancel recording${NC}"
    
    # Start recording in background
    ffmpeg -y -t $duration -i "$AUDIO_URL" -c copy "$filepath" >/dev/null 2>&1 &
    RECORDING_PID=$!
    RECORDING_ACTIVE=true
    
    # Monitor for cancel key or completion
    while kill -0 $RECORDING_PID 2>/dev/null; do
        # Check for cancel key (non-blocking read)
        if read -t 0.1 -n 1 -s key && [[ "$key" == "a" ]]; then
            kill $RECORDING_PID 2>/dev/null
            echo -e "\n${YELLOW}Recording cancelled by user.${NC}"
            RECORDING_ACTIVE=false
            break
        fi
        
        # Show recording status
        if [ -f "$filepath" ]; then
            local current_size=$(du -h "$filepath" | cut -f1)
            local duration_sec=$(( $(date +%s) - $(date -r "$filepath" +%s) ))
            printf "\rRecording: %-10s  Duration: %02d:%02d" "$current_size" $((duration_sec/60)) $((duration_sec%60))
        fi
        sleep 0.5
    done
    
    # Clean up
    wait $RECORDING_PID 2>/dev/null
    RECORDING_ACTIVE=false
    
    # Show final status
    if [ -f "$filepath" ] && [ -s "$filepath" ]; then
        local final_size=$(du -h "$filepath" | cut -f1)
        echo -e "\n${GREEN}✅ Recording complete!${NC}"
        echo -e "   File: ${CYAN}$filepath${NC}"
        echo -e "   Size: ${GREEN}$final_size${NC}"
    else
        # Clean up empty file if any
        [ -f "$filepath" ] && rm -f "$filepath"
        echo -e "\n${YELLOW}⚠️  Recording was cancelled or failed${NC}"
    fi
    
    # Resume playback if it was playing
    if $was_playing; then
        kill -CONT $PID 2>/dev/null
    fi
    
    # Reset trap
    trap - INT
}

# Record until specific file size is reached
record_until_size() {
    local target_size=$1
    local filename="size_${target_size}_$(date +%Y%m%d_%H%M%S).mp3"
    local filepath="$RECORD_DIR/$filename"
    
    mkdir -p "$RECORD_DIR"
    
    echo -e "\n${YELLOW}🎙️  Recording until file reaches $target_size ...${NC}"
    
    ffmpeg -y -i "$AUDIO_URL" -c copy -fs $target_size "$filepath" >/dev/null 2>&1 &
    local ffmpeg_pid=$!
    
    echo -e "${CYAN}Recording in progress... Press Ctrl+C to stop early${NC}"
    
    trap 'kill $ffmpeg_pid 2>/dev/null; echo -e "\n${YELLOW}Recording stopped.${NC}"; return' INT
    
    while kill -0 $ffmpeg_pid 2>/dev/null; do
        if [ -f "$filepath" ]; then
            local current_size=$(du -h "$filepath" | cut -f1)
            printf "\rCurrent size: %-8s" "$current_size"
        fi
        sleep 1
    done
    
    if [ -f "$filepath" ]; then
        echo -e "\n${GREEN}✅ Recording complete. Final size: $(du -h "$filepath" | cut -f1)${NC}"
        echo -e "File saved to: $filepath"
    else
        echo -e "\n${RED}❌ Failed to record audio${NC}"
    fi
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
LAST_ARTIST=""
LAST_ALBUM=""
LAST_PLAYLIST=""
LAST_DURATION=0
PAUSED=false
TIMER_CANCELLED=0
TIMER_RUNNING=false

# Create the recording directory
create_recording_directory

# Function to fetch lyrics (using a simple API)
get_lyrics() {
    local artist="$1"
    local title="$2"
    
    # Clean up the artist and title for URL
    artist=$(echo "$artist" | tr ' ' '+' | tr -d '[:punct:]')
    title=$(echo "$title" | tr ' ' '+' | tr -d '[:punct:]')
    
    echo -e "\n${CYAN}Searching for lyrics...${NC}"
    
    # Try to get lyrics (using a public API)
    local lyrics=$(curl -s --get --data-urlencode "artist=$artist" --data-urlencode "title=$title" \
        "https://api.lyrics.ovh/v1/$artist/$title" | jq -r '.lyrics' 2>/dev/null)
    
    if [ "$lyrics" != "null" ] && [ -n "$lyrics" ]; then
        echo -e "\n${GREEN}Lyrics for $LAST_STREAM_TITLE by $LAST_ARTIST:${NC}\n"
        echo "$lyrics"
    else
        echo -e "${YELLOW}No lyrics found for this track.${NC}"
    fi
}

# Function to display current track information with progress
display_track_info() {
    local metadata=$(fetch_metadata)
    
    if [ -n "$metadata" ]; then
        IFS='|' read -r song_title artist album playlist duration elapsed remaining <<< "$metadata"
        
        # Check if track has changed
        if [ "$song_title" != "$LAST_STREAM_TITLE" ] || [ "$artist" != "$LAST_ARTIST" ]; then
            echo ""  # New line when track changes
            print_ascii_art
            echo -e "${CYAN}╔════════════════════════════════════════════╗"
            echo -e "║           ${YELLOW}🎵  Now Playing  🎵${CYAN}              ║"
            echo -e "╠════════════════════════════════════════════╣"
            echo -e "║ ${YELLOW}🎵  Title:${NC}  $song_title"
            echo -e "║ ${YELLOW}🎤  Artist:${NC} $artist"
            if [ "$album" != "Unknown Album" ]; then
                echo -e "║ ${YELLOW}💿  Album:${NC}  $album"
            fi
            if [ "$playlist" != "Unknown Collection" ]; then
                echo -e "║ ${YELLOW}📋  Playlist:${NC} $playlist"
            fi
            echo -e "║ ${YELLOW}⏱️   Duration:${NC} $(format_duration $duration)"
            echo -e "╚════════════════════════════════════════════╝${NC}"
            
            LAST_STREAM_TITLE="$song_title"
            LAST_ARTIST="$artist"
            LAST_ALBUM="$album"
            LAST_PLAYLIST="$playlist"
            LAST_DURATION=$duration
        fi
        
        # Always update the progress display
        if [ $duration -gt 0 ]; then
            # Show progress on the same line
            printf "\r\033[K"  # Clear current line
            draw_progress_bar $elapsed $duration "Now Playing" "GREEN"
        fi
    fi
}

# Start a background job to monitor track information
(
    # Initial display
    echo -e "${CYAN}Loading track information...${NC}"
    
    while kill -0 $PID 2>/dev/null; do
        current_time=$(date +%s)
        # Show ASCII art every 5 minutes or when forced
        if [ $((current_time - LAST_ASCII_TIME)) -ge 300 ]; then
            print_ascii_art
            LAST_ASCII_TIME=$current_time
        fi
        
        # Only show track info if timer isn't running
        if ! $TIMER_RUNNING; then
            display_track_info
        fi
        
        sleep $TRACK_UPDATE_INTERVAL
    done
) &

# Command help function
show_help() {
    clear
    print_ascii_art
    echo -e "${CYAN}╔════════════════════════════════════════════╗"
    echo -e "║           ${YELLOW}ZamRock CLI - Help Menu${CYAN}              ║"
    echo -e "╠════════════════════════════════════════════╣"
    echo -e "║ ${YELLOW}${GREEN}p${NC}  - Pause or unpause the audio stream"
    echo -e "║ ${YELLOW}${GREEN}r${NC}  - Start or cancel the Ramen Noodle Timer"
    echo -e "║ ${YELLOW}${GREEN}a${NC}  - Archive the audio stream (select duration)"
    echo -e "║ ${YELLOW}${GREEN}i${NC}  - Show ZamRock information and social links"
    echo -e "║ ${YELLOW}${GREEN}l${NC}  - Search for lyrics of current track"
    echo -e "║ ${YELLOW}${GREEN}h${NC}  - Show this help menu"
    echo -e "║ ${YELLOW}${GREEN}q${NC}  - Quit the script"
    echo -e "╠════════════════════════════════════════════╣"
    echo -e "║ ${YELLOW}🔊 Now Playing:${NC} ${LAST_STREAM_TITLE:-Unknown Track}"
    echo -e "║ ${YELLOW}🎤 Artist:${NC} ${LAST_ARTIST:-Unknown Artist}"
    echo -e "║ ${YELLOW}⏱️  Timer:${NC} ${TIMER_RUNNING:+${PURPLE}Running - $((TIMER_DURATION - ($(date +%s) - TIMER_START)))s left${NC}}${TIMER_RUNNING:+}${TIMER_RUNNING:-Not running}"
    echo -e "╚════════════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}Press any key to return to the player...${NC}"
    read -n 1 -s
    NO_CLEAR=true
}

# Function to display information about ZamRock
show_info() {
    clear
    print_ascii_art
    echo -e "${CYAN}╔════════════════════════════════════════════╗"
    echo -e "║           ${YELLOW}ZamRock Radio - Connect With Us${CYAN}          ║"
    echo -e "╠════════════════════════════════════════════╣"
    echo -e "║ ${YELLOW}🌐 Website:${NC}  ${GREEN}https://zamrock.net${NC}"
    echo -e "║ ${YELLOW}💬 Matrix:${NC}  ${GREEN}https://matrix.to/#/#zamrock:unredacted.org${NC}"
    echo -e "║ ${YELLOW}🐘 Mastodon:${NC} ${GREEN}https://musicworld.social/@ZamRock${NC}"
    echo -e "║ ${YELLOW}🔵 BlueSky:${NC}  ${GREEN}https://bsky.app/profile/zamrock.net${NC}"
    echo -e "║ ${YELLOW}🎮 Discord:${NC}  ${GREEN}https://discord.gg/TGNSc9kTjR${NC}"
    echo -e "║ ${YELLOW}💬 Revolt:${NC}   ${GREEN}https://stt.gg/CsjKzYWm${NC}"
    echo -e "║"
    echo -e "║ ${YELLOW}🔊 Now Playing:${NC} ${LAST_STREAM_TITLE:-Unknown Track}"
    echo -e "║ ${YELLOW}🎤 Artist:${NC} ${LAST_ARTIST:-Unknown Artist}"
    echo -e "║ ${YELLOW}💿 Album:${NC} ${LAST_ALBUM:-Unknown Album}"
    echo -e "╚════════════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}Press any key to return to the player...${NC}"
    read -n 1 -s
}

cleanup() {
    kill $PID 2>/dev/null
    [ -n "$TIMER_PID" ] && kill $TIMER_PID 2>/dev/null
    rm -f "$TMP_LOG"
    echo -e "${YELLOW}Playback finished.${NC}"
}

trap cleanup EXIT SIGINT SIGTERM

# Function to update timer display
update_timer_display() {
    if $TIMER_RUNNING; then
        local elapsed=$(( $(date +%s) - TIMER_START ))
        local remaining=$(( TIMER_DURATION - elapsed ))
        
        if [ $remaining -le 0 ]; then
            TIMER_RUNNING=false
            echo -e "\n${GREEN}⏰ Ramen is ready! Enjoy! 🍜${NC}"
            # Show song info after timer completes
            display_track_info
            return
        fi
        
        printf "\r\033[K"  # Clear current line
        draw_progress_bar $elapsed $TIMER_DURATION "🍜 Ramen Timer" "PURPLE"
        return 1  # Indicate timer is running
    fi
    return 0  # Indicate timer is not running
}

# Start the input loop for user commands
while kill -0 $PID 2>/dev/null; do
    # Check for timer updates if not recording
    if $TIMER_RUNNING && ! $RECORDING_ACTIVE; then
        update_timer_display
    fi
    
    read -n 1 -s -t 1 key  # Wait 1 second for keypress, then continue
    
    # Clear any remaining input
    while read -r -t 0; do read -r; done
    
    # Store last command
    LAST_CMD="$key"
    
    # Show song info after any command
    if [ -n "$key" ]; then
        # Don't show art if timer is running
        if ! $TIMER_RUNNING; then
            print_ascii_art
            display_track_info
        fi
        # Reset ASCII timer after showing art
        LAST_ASCII_TIME=$(date +%s)
    fi

    if [ "$key" == "p" ]; then
        if $PAUSED; then
            echo -e "\n${GREEN}▶️  Resuming playback...${NC}"
            kill -CONT $PID  # Send CONT signal to resume
            PAUSED=false
        else
            echo -e "\n${YELLOW}⏸️  Pausing playback...${NC}"
            kill -STOP $PID  # Send STOP signal to pause
            PAUSED=true
        fi
    elif [ "$key" == "r" ]; then
        if $TIMER_RUNNING; then
            # Cancel the timer
            touch "/tmp/timer_cancel_$TIMER_PID"
            TIMER_RUNNING=false
            echo -e "\n${YELLOW}⏹️  Timer cancelled${NC}"
        else
            start_noodle_timer
        fi
    elif [ "$key" == "a" ]; then
        if $RECORDING_ACTIVE; then
            echo -e "\n${YELLOW}Stopping recording...${NC}"
            kill $RECORDING_PID 2>/dev/null
            RECORDING_ACTIVE=false
        else
            # Pause timer updates while in recording menu
            local was_timer_running=$TIMER_RUNNING
            $TIMER_RUNNING && touch "/tmp/timer_cancel_$TIMER_PID"
            
            # Show recording menu
            record_stream
            
            # Restore timer if it was running
            if $was_timer_running; then
                TIMER_RUNNING=true
                start_noodle_timer
            fi
        fi
    elif [ "$key" == "i" ]; then
        show_info
    elif [ "$key" == "h" ]; then
        show_help
        # Show website link after help
        echo -e "\n${CYAN}Visit our website: $WEBSITE_LINK${NC}"
        echo -e "${YELLOW}Press any key to continue...${NC}"
        read -n 1 -s
    elif [ "$key" == "l" ]; then
        if [ -n "$LAST_STREAM_TITLE" ] && [ -n "$LAST_ARTIST" ]; then
            get_lyrics "$LAST_ARTIST" "$LAST_STREAM_TITLE"
            NO_CLEAR=true
            echo -e "\n${YELLOW}Press any key to continue...${NC}"
            read -n 1 -s
        else
            echo -e "\n${YELLOW}No track information available to search for lyrics.${NC}"
            sleep 2
        fi
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
