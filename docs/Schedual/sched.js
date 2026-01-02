// Get current day and load appropriate schedule
function getCurrentDay() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  return days[today.getDay()];
}

// Convert time string "HH:MM" to decimal hours
function timeToHours(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes / 60);
}

// Check if current time is within playlist time range (handles overnight)
function isTimeInRange(currentHour, startTime, endTime) {
  const startHour = timeToHours(startTime);
  const endHour = timeToHours(endTime);
  
  // Handle overnight playlists (end time is next day)
  if (endHour < startHour) {
    return currentHour >= startHour || currentHour < endHour;
  }
  return currentHour >= startHour && currentHour < endHour;
}

let scheduleData = [];
const container = document.getElementById("scheduleContainer");
const timeAxis = document.getElementById("timeAxis");

const startTime = 6;
const endTime = 30;
const scheduleDuration = endTime - startTime;
const rowHeight = 100;

// Create time axis labels
for (let i = startTime; i <= endTime; i++) {
    const hour = i % 24;
    const timeLabel = document.createElement("div");
    timeLabel.classList.add("time-label");
    timeLabel.textContent = `${hour === 0 ? 24 : hour}:00`;
    timeAxis.appendChild(timeLabel);
}

// Function to check for overlaps
function isOverlapping(playlist, rowData) {
    return rowData.some(r => {
        const rStart = timeToHours(r.start);
        const rEnd = timeToHours(r.end);
        const pStart = timeToHours(playlist.start);
        const pEnd = timeToHours(playlist.end);
        
        // Handle overnight for both
        if (rEnd < rStart && pEnd < pStart) {
            return true; // Both overnight, assume overlap
        }
        if (rEnd < rStart) {
            return pStart < rEnd || pEnd > rStart;
        }
        if (pEnd < pStart) {
            return rStart < pEnd || rEnd > pStart;
        }
        return pStart < rEnd && pEnd > rStart;
    });
}

// Modified row assignment logic to minimize overlaps
function findAvailableRow(playlist, rows) {
    for (let i = 0; i < rows.length; i++) {
        if (!isOverlapping(playlist, rows[i])) {
            return i;
        }
    }
    return rows.length; // No suitable row found, create a new one
}

// Create a data structure to track row occupancy
const rows = [[]];

// Function to get current time in Denver
function getCurrentDenverTime() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const denverTime = new Date(utc - (7 * 3600000)); // Denver is UTC-7
    return denverTime;
}

let currentPlaylistElement = null; // Store the currently highlighted playlist

// Function to create and position a playlist block
function createPlaylistBlock(playlist) {
    const playlistBlock = document.createElement("div");
    playlistBlock.classList.add("show");

    const startHour = timeToHours(playlist.start);
    const endHour = timeToHours(playlist.end);
    
    // Handle overnight playlists
    let displayEndHour = endHour;
    if (endHour < startHour) {
        displayEndHour = endHour + 24;
    }
    
    const startPercent = ((startHour - startTime) / scheduleDuration) * 100;
    const durationPercent = ((displayEndHour - startHour) / scheduleDuration) * 100;

    // Find an available row with overlap prevention
    let row = findAvailableRow(playlist, rows);

    // If the row doesn't exist, create it
    if (!rows[row]) {
        rows[row] = [];
    }
    rows[row].push({
        start: playlist.start,
        end: playlist.end
    });

    playlistBlock.style.left = `${startPercent}%`;
    playlistBlock.style.width = `${durationPercent}%`;
    playlistBlock.style.top = `${row * rowHeight + 40}px`;
    playlistBlock.style.height = `${rowHeight - 4}px`;
    playlistBlock.style.margin = "2px";

    const startTimeFormatted = Math.floor(startHour) % 24;
    const endTimeFormatted = Math.floor(endHour) % 24;
    const startMinutes = Math.round((startHour % 1) * 60);
    const endMinutes = Math.round((endHour % 1) * 60);
    
    const startDisplay = `${startTimeFormatted === 0 ? 24 : startTimeFormatted}:${startMinutes.toString().padStart(2, '0')}`;
    const endDisplay = `${endTimeFormatted === 0 ? 24 : endTimeFormatted}:${endMinutes.toString().padStart(2, '0')}`;
    const timeDisplay = `${startDisplay} - ${endDisplay}`;

    playlistBlock.innerHTML = `
        <div class="time">${timeDisplay}</div>
        <div class="title">${playlist.name}</div>
        <div class="description">${playlist.description || ''}</div>
    `;

    container.appendChild(playlistBlock);
    return playlistBlock;
}

// Function to find the currently playing playlist
function findCurrentPlaylist(currentTime) {
    const currentHour = currentTime.getHours() + (currentTime.getMinutes() / 60);
    
    for (let i = 0; i < scheduleData.length; i++) {
        const playlist = scheduleData[i];
        if (isTimeInRange(currentHour, playlist.start, playlist.end)) {
            return playlist;
        }
    }
    return null; // No playlist found for the current time
}

// Function to highlight the currently playing playlist
function highlightCurrentPlaylist() {
    const denverTime = getCurrentDenverTime();
    const currentPlaylist = findCurrentPlaylist(denverTime);

    // Remove highlight from previous playlist
    if (currentPlaylistElement) {
        currentPlaylistElement.classList.remove("current-show");
    }

    // Find and highlight the new current playlist
    if (currentPlaylist) {
        // Find element with a matching name
        currentPlaylistElement = Array.from(container.children).find(child => {
            return child.querySelector('.title').textContent === currentPlaylist.name;
        });

        if (currentPlaylistElement) {
            currentPlaylistElement.classList.add("current-show");
        }
    }
}

// Function to create current time line
function createCurrentTimeLine() {
    const denverTime = getCurrentDenverTime();
    const currentHour = denverTime.getHours();
    const currentMinute = denverTime.getMinutes();

    const currentTimeDecimal = currentHour + (currentMinute / 60);
    const timePositionPercent = ((currentTimeDecimal - startTime) / scheduleDuration) * 100;

    const currentTimeLine = document.createElement("div");
    currentTimeLine.classList.add("current-time-line");
    currentTimeLine.style.left = `${timePositionPercent}%`;

    container.appendChild(currentTimeLine);
}

// Function to update the clock
function updateClock() {
    const localTime = new Date();
    const hours = localTime.getHours();
    const minutes = localTime.getMinutes();
    const seconds = localTime.getSeconds();

    document.getElementById('local-time').innerHTML = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Load schedule for current day
function loadScheduleForDay(day) {
    const filename = `../Daily-Planner/${day}.json`;
    
    fetch(filename)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Schedule not found for ${day}`);
            }
            return response.json();
        })
        .then(data => {
            // Convert new format to display format
            const playlists = data.playlists || data.shows || [];
            
            scheduleData = playlists.map(playlist => ({
                name: playlist.name || playlist.show || 'Untitled',
                start: playlist.start || '00:00',
                end: playlist.end || '01:00',
                description: playlist.description || ''
            }));
            
            // Clear container
            container.innerHTML = '';
            container.appendChild(timeAxis);
            
            // Reset rows
            rows.length = 1;
            rows[0] = [];
            
            // Create playlist blocks
            const playlistElements = scheduleData.map(playlist => createPlaylistBlock(playlist));
            
            // Initial highlight
            highlightCurrentPlaylist();
            
            // Add the current time line
            createCurrentTimeLine();
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
            container.innerHTML = `<div style="padding: 20px; color: #fff;">Schedule not found for ${day}. Please create a schedule for this day in the Daily Planner.</div>`;
        });
}

// Initialize: Load schedule for current day
const currentDay = getCurrentDay();
loadScheduleForDay(currentDay);

// Set interval to update highlighting every minute
setInterval(highlightCurrentPlaylist, 60000);

// Set interval to update clock
setInterval(updateClock, 1000);
updateClock(); // Initial update
