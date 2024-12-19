# Script Description

## Purpose
The script is designed to scan a directory (and its subdirectories) for duplicate MP3 files based on their metadata (like title, duration, and album) and filename. It specifically checks for instances where the filename indicates a copy (e.g., containing the term "copy" or similar variations in parentheses).

## Key Features
1. **Metadata Extraction**: Utilizes `mediainfo` to extract metadata for MP3 files, including the title, duration, and album.
2. **Duplicate Detection**:
    - Compares normalized titles, durations, and album names to find duplicates.
    - Highlights any filenames containing "copy" within parentheses, printing them in red for easy identification.
    - Ignores numeric text in parentheses (like "song_title (1).mp3") when comparing for duplicates, which means it will flag "song_title (1).mp3" if there exists a "song_title.mp3".
3. **Logging**: Creates a log file with details about detected duplicates, including the original and duplicate file paths.
4. **User-Friendly Output**: Provides clear, color-coded terminal output to indicate duplicates and pertinent details.

## What It Looks For
- **Duplicate Files**: The script identifies files with the same title and duration or those that have similar audio content but are named differently.
- **Files with “Copy”**: It specifically flags files where the filename includes the word "copy" within parentheses and highlights these occurrences in red.
- **Full File Paths**: When duplicates are detected, the script provides full paths to all flagged files to facilitate user review and action.

# Installation Instructions

## For Linux

1. **Prerequisites**:
   - Ensure that you have Bash installed (most Linux distros have it by default).
   - Install `mediainfo` to extract metadata from MP3 files.

2. **Install mediainfo**:
   You can install `mediainfo` using a package manager:

   **For Debian/Ubuntu**:
   ```bash
   sudo apt-get install -y mediainfo

### Option 2: Using Git Bash

1. **Install Git for Windows**:
   Download and install Git from [git-scm.com](https://git-scm.com/download/win). During installation, make sure to enable the option that allows running bash commands.

2. **Install mediainfo**:
   - Download binaries from the [MediaInfo official website](https://mediaarea.net/en/MediaInfo/Download) and add the executable to your PATH.

3. **Open Git Bash**:
   - Right-click in your file explorer and select "Git Bash Here."

4. **Download the Script**:
   Save the script to a file named `find_duplicates.sh` in your desired directory.

5. **Make the Script Executable**:
   Run:
   ```bash
   chmod +x find_duplicates.sh

6. **Run the Script: Navigate to the directory containing your MP3 files using cd, then exe**:
  Run:
  ```bash
  ./find_duplicates.sh
