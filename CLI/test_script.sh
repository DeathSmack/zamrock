#!/bin/bash

# This script serves as a basic test suite for the main script
set -e  # Exit immediately if a command exits with a non-zero status

# Path to the main script
MAIN_SCRIPT="./your_main_script.sh"  # Adjust this path to your actual script
AUDIO_URL="https://zamrock.deathsmack.com/listen/zamrock/test_stream_7e335"

# Function to test if required commands are available
test_commands() {
    echo "Testing required commands..."

    for cmd in ffplay ffmpeg; do
        if ! command -v $cmd &> /dev/null; then
            echo "FAIL: Command $cmd is not installed."
            exit 1
        fi
    done

    echo "SUCCESS: All required commands are installed."
}

# Function to test if the script runs without errors
test_script_run() {
    echo "Testing if main script runs without errors..."

    # Run the script in the background and check for errors
    (bash "$MAIN_SCRIPT" &> /dev/null) &
    SCRIPT_PID=$!
    sleep 3  # Allow the script to run for a few seconds
    if ps -p $SCRIPT_PID > /dev/null; then
        kill $SCRIPT_PID  # Kill if still running
        echo "SUCCESS: Main script executed without errors."
    else
        echo "FAIL: Main script encountered an issue during execution."
        exit 1
    fi
}

# Function to test the output format of StreamTitle and Genre
test_metadata_output() {
    echo "Testing metadata output..."

    # Capture the metadata fetch output
    OUTPUT=$(ffmpeg -i "$AUDIO_URL" 2>&1 | grep -E 'StreamTitle|icy-name|icy-genre' || true)

    if [[ -n "$OUTPUT" ]]; then
        echo "SUCCESS: Metadata fetch produced output."
    else
        echo "FAIL: No output from metadata fetch."
        exit 1
    fi
}

# Run the test functions
test_commands
test_script_run
test_metadata_output

echo "All tests passed successfully!"
