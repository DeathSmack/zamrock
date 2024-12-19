#!/bin/bash

# Find the PIDs of the armcord processes
PIDS=$(pgrep armcord)

if [ -z "$PIDS" ]; then
    echo "armcord is not running."
else
    echo "armcord is running with PIDs: $PIDS"
    # Kill each armcord process
    for PID in $PIDS; do
        kill "$PID"
        if [ $? -eq 0 ]; then
            echo "armcord process $PID has been terminated."
        else
            echo "Failed to terminate armcord process $PID."
        fi
    done
fi
