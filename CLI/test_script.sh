#!/bin/bash

set -e

# Path to your main script
MAIN_SCRIPT="./CLI/zamrock_v-1_5_1.sh"
AUDIO_URL="https://zamrock.deathsmack.com/listen/zamrock/test_stream_7e335"

# Check if required commands are available
test_commands() {
    echo "Checking dependencies..."
    for cmd in ffplay ffmpeg; do
        if ! command -v "$cmd" &> /dev/null; then
            echo "Error: $cmd is not installed."
            exit 1
        fi
    done
    echo "All dependencies are installed."
}

# Test if the main script runs without errors
test_script_execution() {
    echo "Running main script..."
    # Run your script with test parameters
    # Adjust as needed based on your script's usage
    bash "$MAIN_SCRIPT" --help > /dev/null 2>&1
    echo "Main script executed successfully."
}

# Test streaming metadata fetch
test_metadata() {
    echo "Fetching stream metadata..."
    output=$(ffmpeg -i "$AUDIO_URL" 2>&1 | grep -E 'StreamTitle|icy-name|icy-genre' || true)
    if [[ -n "$output" ]]; then
        echo "Metadata fetched: $output"
    else
        echo "Error: No metadata found."
        exit 1
    fi
}

# Run all tests
test_commands
test_script_execution
test_metadata

echo "All tests passed!"
