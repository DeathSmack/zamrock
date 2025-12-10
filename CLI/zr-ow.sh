#!/usr/bin/env bash
#======================================================================
#  ZamRock CLI – 2025‑11‑29
#  Author: deathsmack (치명타)   ──  https://zamrock.net
#
#  Features
#  --------
#   • Play the live ZamRock stream
#   • Pause / resume
#   • Show “now‑playing” + logo
#   • Quick‑help menu
#   • “Archive” mode – record for a duration or until a file‑size limit
#   • Graceful shutdown
#======================================================================

#---------------------------#
#  GLOBAL CONFIGURATION      #
#---------------------------#
AUDIO_URL="https://stream.zamrock.net/live"     # ← change if your stream URL differs
RECORD_DIR="$HOME/Downloads/ZamRock-Archive"    # where the recordings are stored
LOGO_TEXT="$(cat <<'EOT'
  ______  __  __   ______   __      ______  ______   ______  __  ______  
 |  ____||  \/  | |  ____| |  |    |  ____||  ____| |  ____||  ||  ____| 
 | |__   | \  / | | |__    |  |    | |__   | |__    | |__   |  || |__    
 |  __|  | |\/| | |  __|   |  |    |  __|  |  __|   |  __|  |  ||  __|   
 | |____ | |  | | | |____  |  |____| |____ | |____  | |____ |  || |____  
 |______||_|  |_| |______| |________|______||______| |______||__||______|
EOT
)"
HELP_LINES=(
    "${YELLOW}${GREEN}p${NC}  - Pause / Unpause playback"
    "${YELLOW}${GREEN}r${NC}  - Toggle ramen timer (demo)"
    "${YELLOW}${GREEN}a${NC}  - Archive the stream (test clip / duration / size)"
    "${YELLOW}${GREEN}i${NC}  - Show ZamRock info (logo + now‑playing)"
    "${YELLOW}${GREEN}l${NC}  - Search for lyrics (demo)"
    "${YELLOW}${GREEN}n${NC}  - Show logo & Now‑Playing"
    "${YELLOW}${GREEN}t${NC}  - Toggle typewriter effect (demo)"
    "${YELLOW}${GREEN}h${NC}  - Help"
    "${YELLOW}${GREEN}q${NC}  - Quit"
)

#---------------------------#
#  ANSI COLORS              #
#---------------------------#
RED=$(tput setaf 1)
GREEN=$(tput setaf 2)
YELLOW=$(tput setaf 3)
BLUE=$(tput setaf 4)
CYAN=$(tput setaf 6)
WHITE=$(tput setaf 7)
BOLD=$(tput bold)
RESET=$(tput sgr0)
NC=$(tput sgr0)          # No Color

#---------------------------#
#  STATE VARIABLES          #
#---------------------------#
PID=0                      # main audio player PID
RECORDING_PID=0           # recording PID
RECORDING_ACTIVE=false    # true while a recording is running
READ_TIMEOUT=0.1           # loop sleep time (seconds)

#---------------------------#
#  UTILS                    #
#---------------------------#
type_print() {
    local text="$1"
    echo -e "$text"
}

render_box() {
    local title="$1"
    shift
    local lines=("$@")
    local width=0
    for l in "${lines[@]}"; do
        [[ ${#l} -gt $width ]] && width=${#l}
    done
    width=$((width+4))
    local border=$(printf '%*s' $width '' | tr ' ' '-')
    echo -e "${BOLD}${BLUE}┌${border}┐${NC}"
    echo -e "${BOLD}${BLUE}│${NC} ${title} ${BOLD}${BLUE}│${NC}"
    echo -e "${BOLD}${BLUE}├${border}┤${NC}"
    for l in "${lines[@]}"; do
        printf '│ %-*s │\n' $((width-2)) "$l"
    done
    echo -e "${BOLD}${BLUE}└${border}┘${NC}"
}

#---------------------------#
#  AUDIO PLAYBACK           #
#---------------------------#
start_stream() {
    # ffplay -nodisp -autoexit "$AUDIO_URL"
    # We use mpv because it gives us pause / resume control
    mpv --quiet --no-video "$AUDIO_URL" &
    PID=$!
    echo -e "${GREEN}▶︎  Streaming started (PID $PID)${NC}"
}

pause_stream() {
    if [[ $PID -ne 0 ]]; then
        kill -STOP $PID 2>/dev/null
        echo -e "${YELLOW}⏸️  Paused${NC}"
    fi
}

resume_stream() {
    if [[ $PID -ne 0 ]]; then
        kill -CONT $PID 2>/dev/null
        echo -e "${GREEN}▶︎  Resumed${NC}"
    fi
}

stop_stream() {
    if [[ $PID -ne 0 ]]; then
        kill $PID 2>/dev/null
        wait $PID 2>/dev/null
        echo -e "${RED}⏹️  Stream stopped${NC}"
        PID=0
    fi
}

toggle_pause() {
    if [[ $PID -eq 0 ]]; then
        echo -e "${RED}❗  No active stream${NC}"
    else
        if kill -0 $PID 2>/dev/null; then
            if ps -o state= -p $PID | grep -q 'T'; then
                resume_stream
            else
                pause_stream
            fi
        fi
    fi
}

#---------------------------#
#  ARCHIVE (RECORDING)      #
#---------------------------#
parse_size_to_bytes() {
    local s=$1
    local num=${s%[a-zA-Z]*}
    local unit=${s##$num}
    num=${num#0}
    case "${unit,,}" in
        kb|k) echo $((num*1024));;
        mb|m) echo $((num*1024*1024));;
        gb|g) echo $((num*1024*1024*1024));;
        *) return 1;;
    esac
}

start_recording() {
    local mode=$1           # "duration" | "size"
    local value=$2          # seconds / “5mb” etc.
    local prefix=$3         # e.g. "30s_test" or "size_5mb"

    mkdir -p "$RECORD_DIR"

    if [[ $mode == duration ]]; then
        # Convert human readable duration to seconds
        local sec
        if [[ $value =~ ^([0-9]+)(s|m|h)$ ]]; then
            local v=${BASH_REMATCH[1]}
            local u=${BASH_REMATCH[2]}
            case "$u" in
                s) sec=$v;;
                m) sec=$((v*60));;
                h) sec=$((v*3600));;
            esac
        else
            echo -e "${RED}❌  Invalid duration format. Use 30s, 2m, 1h.${NC}"
            return
        fi
        local filename="${prefix}_$(date +%Y%m%d_%H%M%S).mp3"
        local filepath="$RECORD_DIR/$filename"

        echo -e "\n${YELLOW}🎙️  Recording for $sec seconds → ${CYAN}$filepath${NC}"
        ffmpeg -y -t "$sec" -i "$AUDIO_URL" -c copy "$filepath" >/dev/null 2>&1 &
        RECORDING_PID=$!
        RECORDING_ACTIVE=true
    else
        # mode == size
        local bytes
        bytes=$(parse_size_to_bytes "$value") || {
            echo -e "${RED}❌  Bad size format. Use e.g. 5mb, 500kb, 1gb.${NC}"
            return
        }
        local filename="size_${value}_$(date +%Y%m%d_%H%M%S).mp3"
        local filepath="$RECORD_DIR/$filename"

        echo -e "\n${YELLOW}🎙️  Recording until file reaches $value → ${CYAN}$filepath${NC}"
        ffmpeg -y -i "$AUDIO_URL" -c copy -fs "$bytes" "$filepath" >/dev/null 2>&1 &
        RECORDING_PID=$!
        RECORDING_ACTIVE=true
    fi

    echo -e "${CYAN}Press 'a' again to stop recording early…${NC}"
}

stop_recording() {
    if $RECORDING_ACTIVE; then
        echo -e "\n${YELLOW}🛑  Stopping recording…${NC}"
        kill $RECORDING_PID 2>/dev/null
        RECORDING_ACTIVE=false
        wait $RECORDING_PID 2>/dev/null
    fi
}

archive_stream() {
    echo -e "\n${CYAN}📦  Archive the stream${NC}"
    echo "1) 10‑second test clip"
    echo "2) Custom duration (e.g. 30s, 2m, 1h)"
    echo "3) Until file reaches a target size (e.g. 5mb, 1gb)"
    read -p "Select option (1–3): " choice

    case "$choice" in
        1)
            start_recording duration 10 "10s_test"
            ;;
        2)
            read -p "Enter duration (30s, 2m, 1h): " dur
            start_recording duration "$dur" "custom_$dur"
            ;;
        3)
            read -p "Enter target file size (5mb, 1gb): " sz
            start_recording size "$sz" "size_$sz"
            ;;
        *)
            echo -e "${YELLOW}❌  Invalid choice – returning to main menu.${NC}"
            ;;
    esac
}

#---------------------------#
#  HELP & INFO              #
#---------------------------#
show_help() {
    local lines=("${HELP_LINES[@]}")
    render_box "${YELLOW}ZamRock CLI – Help${NC}" "${lines[@]}"
    type_print "${YELLOW}Press any key to return…${NC}"
    read -n 1 -s
}

show_info() {
    render_box "${GREEN}ZamRock – Live Music${NC}" "$LOGO_TEXT"
    type_print "${CYAN}Now‑Playing: ♫ ZamRock – Live FM ♫${NC}"
    type_print "${CYAN}🔗 https://zamrock.net${NC}"
    type_print "${CYAN}🛠️  Commands: p r a i l n t h q${NC}"
    type_print "${CYAN}Press any key to return…${NC}"
    read -n 1 -s
}

#---------------------------#
#  CLEANUP & SIGNALS        #
#---------------------------#
cleanup() {
    echo -e "\n${GREEN}🔄  Cleaning up…${NC}"
    stop_recording
    stop_stream
    exit 0
}
trap cleanup INT TERM

#---------------------------#
#  MAIN LOOP                #
#---------------------------#
echo -e "${GREEN}🎧  Starting ZamRock CLI…${NC}"
start_stream

while kill -0 $PID 2>/dev/null; do
    read -n 1 -s -t $READ_TIMEOUT key
    case "$key" in
        p) toggle_pause ;;
        r) echo -e "${YELLOW}🔴  Ramen timer toggle (demo)${NC}" ;;
        a)
            if $RECORDING_ACTIVE; then
                stop_recording
            else
                archive_stream
            fi
            ;;
        i) show_info ;;
        l) echo -e "${YELLOW}🔎  Lyrics search (demo)${NC}" ;;
        n) show_info ;;
        t) echo -e "${YELLOW}✏️  Typewriter effect toggle (demo)${NC}" ;;
        h) show_help ;;
        q) cleanup ;;
        *) ;;  # ignore unknown keys
    esac
done

# Should never reach here – cleanup will exit
cleanup