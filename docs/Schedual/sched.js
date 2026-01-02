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

// Get list of all JSON files in Daily-Planner directory
async function getAvailableSchedules() {
    // Since we can't list files directly, we'll try common patterns
    // This is a workaround - in production you might want a manifest file
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayAbbrevs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    // Try to fetch a manifest or common files
    // For now, we'll try the current day first, then check for files containing the day
    return days;
}

// Check if a filename matches the current day
function filenameMatchesDay(filename, day) {
    const dayLower = day.toLowerCase();
    const filenameLower = filename.toLowerCase();
    
    // Check for full day name
    if (filenameLower.includes(dayLower)) {
        return true;
    }
    
    // Check for abbreviations
    const abbrevMap = {
        'monday': 'mon',
        'tuesday': 'tue',
        'wednesday': 'wed',
        'thursday': 'thu',
        'friday': 'fri',
        'saturday': 'sat',
        'sunday': 'sun'
    };
    
    const abbrev = abbrevMap[dayLower];
    if (abbrev && filenameLower.includes(abbrev)) {
        return true;
    }
    
    return false;
}

// Check if current date is a holiday
function getCurrentHoliday() {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const date = today.getDate();
    
    // Simple holiday detection (you can expand this)
    const holidays = {
        'new-years-day': { month: 1, date: 1 },
        'valentines-day': { month: 2, date: 14 },
        'st-patricks-day': { month: 3, date: 17 },
        'independence-day': { month: 7, date: 4 },
        'halloween': { month: 10, date: 31 },
        'christmas-eve': { month: 12, date: 24 },
        'christmas-day': { month: 12, date: 25 },
        'new-years-eve': { month: 12, date: 31 }
    };
    
    for (const [holidayId, holiday] of Object.entries(holidays)) {
        if (holiday.month === month && holiday.date === date) {
            return holidayId;
        }
    }
    
    return null;
}

// Try to load a schedule file
async function tryLoadSchedule(filename) {
    try {
        const response = await fetch(`../Daily-Planner/${filename}`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        
        // Check if this schedule applies to the current day
        const currentDay = getCurrentDay();
        const currentHoliday = getCurrentHoliday();
        
        // Check days array
        if (data.days && Array.isArray(data.days)) {
            const dayMatches = data.days.some(d => 
                d.toLowerCase() === currentDay || 
                filenameMatchesDay(d, currentDay)
            );
            if (dayMatches) {
                return data;
            }
        }
        
        // Check holidays array
        if (currentHoliday && data.holidays && Array.isArray(data.holidays)) {
            if (data.holidays.includes(currentHoliday)) {
                return data;
            }
        }
        
        // Check filename for day match
        if (filenameMatchesDay(filename, currentDay)) {
            return data;
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// Load schedule for current day
async function loadScheduleForDay(day) {
    const currentHoliday = getCurrentHoliday();
    
    // Try different filename patterns
    const patternsToTry = [
        // Exact day match
        `${day}.json`,
        // Day abbreviation
        `${day.substring(0, 3)}.json`,
        // Common combinations
        'sat-sun.json',
        'sun-sat.json',
        'weekend.json',
        'mon-fri.json',
        'weekday.json',
        // Holiday files
        currentHoliday ? `${currentHoliday}.json` : null,
        // Any file with day in name (we'll need to check contents)
    ].filter(p => p !== null);
    
    // Also try to find files that might match by checking common patterns
    // Since we can't list directory, we'll try a few common patterns
    const commonPatterns = [
        'schedule',
        'radio-schedule',
        'default'
    ];
    
    let loadedData = null;
    let loadedFilename = null;
    
    // Try exact day first
    for (const pattern of patternsToTry) {
        const data = await tryLoadSchedule(pattern);
        if (data) {
            loadedData = data;
            loadedFilename = pattern;
            break;
        }
    }
    
    // If no exact match, try common patterns and check their days/holidays
    if (!loadedData) {
        for (const pattern of commonPatterns) {
            const data = await tryLoadSchedule(`${pattern}.json`);
            if (data) {
                loadedData = data;
                loadedFilename = pattern;
                break;
            }
        }
    }
    
    if (loadedData) {
        // Convert new format to display format
        const playlists = loadedData.playlists || loadedData.shows || [];
        
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
    } else {
        container.innerHTML = `<div style="padding: 20px; color: #fff;">No schedule found for ${day}${currentHoliday ? ` or ${currentHoliday}` : ''}. Please create and export a schedule for this day in the Daily Planner.</div>`;
    }
}

// Initialize: Load schedule for current day
const currentDay = getCurrentDay();
loadScheduleForDay(currentDay);

// Set interval to update highlighting every minute
setInterval(highlightCurrentPlaylist, 60000);

// Set interval to update clock
setInterval(updateClock, 1000);
updateClock(); // Initial update
