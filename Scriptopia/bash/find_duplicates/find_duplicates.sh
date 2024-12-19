#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check for mediainfo dependency
if ! command_exists mediainfo; then
    echo -e "\e[31mError: 'mediainfo' is not installed.\e[0m"
    read -p "Do you want to install 'mediainfo'? (y/n): " install_choice
    if [[ "$install_choice" == "y" ]]; then
        # Attempt to install mediainfo
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y mediainfo
        elif command -v brew &> /dev/null; then
            brew install mediainfo
        else
            echo -e "\e[31mError: Could not determine package manager. Please install 'mediainfo' manually.\e[0m"
            exit 1
        fi
    else
        echo -e "\e[31mCannot continue without 'mediainfo'. Exiting.\e[0m"
        exit 1
    fi
fi

# Create a timestamp
timestamp=$(date +"%Y%m%d_%H%M%S")
log_file="duplicate_log_${timestamp}.txt"

# Create an associative array to hold metadata
declare -A mp3_files

# Define color codes
RED='\033[0;31m'   # Red
BLUE='\033[0;34m'  # Blue
NC='\033[0m'       # No Color

# Function to extract relevant mp3 metadata
get_mp3_metadata() {
    local file="$1"
    # Extract metadata using mediainfo
    local filename=$(basename "$file")
    local duration=$(mediainfo --Inform="Audio;%Duration/String3%" "$file" | awk '{print $1}')
    local album=$(mediainfo --Inform="Audio;%Album%" "$file")

    # Return filename, duration, and album
    echo "$filename;$duration;$album"
}

# Function to normalize text for comparison
normalize_text() {
    echo "$1" | sed -E 's/[[:punct:]]//g; s/[0-9]//g; s/\s+/ /g; s/^ *//; s/ *$//'
}

# Function to check if filename contains "(copy)" with other characters inside parentheses
contains_copy() {
    [[ "$1" =~ \(\s*.*copy.*\s*\) ]]
}

# Function to highlight text inside parentheses containing "copy"
highlight_parentheses() {
    # Highlight the "(copy)" text in red
    echo "$1" | sed -E "s/(\(.*copy.*\))/\x1b[31m\1\x1b[0m/g"
}

# Find all mp3 files
find . -type f -name "*.mp3" | while read -r file; do
    # Get metadata for the current file
    metadata=$(get_mp3_metadata "$file")
    if [[ -z "$metadata" ]]; then
        continue
    fi
    IFS=';' read -r filename duration album <<< "$metadata"

    # Normalize title and album for comparison
    norm_filename=$(normalize_text "$filename")
    norm_album=$(normalize_text "$album")

    # Use a composite key of normalized name, normalized duration, and normalized album
    key="${norm_filename}_${duration}_${norm_album}"

    # Check if this key already exists
    if [[ -n "${mp3_files[$key]}" ]]; then
        # Log the result to the log file
        echo -e "${RED}Duplicate found:${NC}"
        echo -e "  Original: ${mp3_files[$key]}"
        echo -e "  Duplicate: $file"

        orig_file="${mp3_files[$key]}"
        IFS=';' read -r orig_filename orig_duration orig_album <<< "$(get_mp3_metadata "$orig_file")"

        # Normalize original title and album for comparison
        orig_norm_filename=$(normalize_text "$orig_filename")
        orig_norm_album=$(normalize_text "$orig_album")

        # Check if titles match (using normalized comparisons)
        if [[ "$norm_filename" == "$orig_norm_filename" ]]; then
            echo -e "  Title (matching): ${RED}$filename${NC}"
        else
            echo -e "  Title (original): ${RED}$orig_filename${NC} vs Title (duplicate): ${BLUE}$filename${NC}"
        fi

        # Check if duration matches
        if [[ "$duration" == "$orig_duration" ]]; then
            echo -e "  Duration (matching): ${RED}$duration${NC}"
        else
            echo -e "  Duration (original): ${RED}$orig_duration${NC} vs Duration (duplicate): ${BLUE}$duration${NC}"
        fi

        # Check if album matches (using normalized comparisons)
        if [[ "$norm_album" == "$orig_norm_album" ]]; then
            echo -e "  Album (matching): ${RED}$album${NC}"
        else
            echo -e "  Album (original): ${RED}$orig_album${NC} vs Album (duplicate): ${BLUE}$album${NC}"
        fi

        # Check if any of the filenames contains "(copy)"
        if contains_copy "$filename"; then
            highlighted_filename=$(highlight_parentheses "$filename")
            echo -e "  Note: Duplicate title includes: ${highlighted_filename} from path: $(realpath "$file")"
            echo "  Note: Duplicate title includes: $highlighted_filename from path: $(realpath "$file")" >> "$log_file"
        fi

        echo "" >> "$log_file"  # Add a blank line for readability
    else
        # Store the metadata in the array
        mp3_files[$key]="$file"

        # Check for files that contain "(copy)" and log them
        if contains_copy "$filename"; then
            highlighted_filename=$(highlight_parentheses "$filename")
            echo -e "  Note: File includes: ${highlighted_filename} from path: $(realpath "$file")"
            echo "  Note: File includes: $highlighted_filename from path: $(realpath "$file")" >> "$log_file"
        fi
    fi
done

echo -e "\e[32mDuplicate scan completed. See the log file: $log_file\e[0m"
