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
    
    // Handle overnight playlists (end < start means it goes into next day)
    const isOvernight = endHour < startHour;
    if (isOvernight) {
        playlistBlock.classList.add("overnight");
    }
    
    let displayEndHour = endHour;
    if (isOvernight) {
        // For display, extend to next day
        displayEndHour = endHour + 24;
    }
    
    const startPercent = ((startHour - startTime) / scheduleDuration) * 100;
    const durationPercent = ((displayEndHour - startHour) / scheduleDuration) * 100;
    
    // Clamp to visible range
    let adjustedStartPercent = startPercent;
    let adjustedDurationPercent = durationPercent;
    
    if (startPercent < 0) {
        adjustedStartPercent = 0;
        adjustedDurationPercent = durationPercent + startPercent;
    }
    
    if (startPercent + durationPercent > 100) {
        adjustedDurationPercent = 100 - adjustedStartPercent;
    }

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

    playlistBlock.style.left = `${adjustedStartPercent}%`;
    playlistBlock.style.width = `${adjustedDurationPercent}%`;
    playlistBlock.style.top = `${row * rowHeight + 40}px`;
    playlistBlock.style.height = `${rowHeight - 4}px`;
    playlistBlock.style.margin = "2px";

    const startTimeFormatted = Math.floor(startHour) % 24;
    const endTimeFormatted = Math.floor(endHour) % 24;
    const startMinutes = Math.round((startHour % 1) * 60);
    const endMinutes = Math.round((endHour % 1) * 60);
    
    const startDisplay = `${startTimeFormatted === 0 ? 24 : startTimeFormatted}:${startMinutes.toString().padStart(2, '0')}`;
    let endDisplay = `${endTimeFormatted === 0 ? 24 : endTimeFormatted}:${endMinutes.toString().padStart(2, '0')}`;
    if (isOvernight) {
        endDisplay += ' (+1 day)';
    }
    const timeDisplay = `${startDisplay} - ${endDisplay}`;

    const description = playlist.description || '';
    
    playlistBlock.innerHTML = `
        <div class="time">${timeDisplay}</div>
        <div class="title">${playlist.name}</div>
        <div class="description">${description}</div>
    `;
    
    // Add tooltip for hover and long press
    if (description) {
        playlistBlock.setAttribute('title', description);
        playlistBlock.setAttribute('data-description', description);
        
        // Handle long press on mobile
        let longPressTimer;
        playlistBlock.addEventListener('touchstart', function(e) {
            longPressTimer = setTimeout(() => {
                alert(description);
            }, 500);
        });
        playlistBlock.addEventListener('touchend', function(e) {
            clearTimeout(longPressTimer);
        });
        playlistBlock.addEventListener('touchmove', function(e) {
            clearTimeout(longPressTimer);
        });
    }

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
    const filenameLower = filename.toLowerCase().replace('.json', '');
    
    // Check for full day name
    if (filenameLower.includes(dayLower)) {
        return true;
    }
    
    // Check for abbreviations (new export format uses 3-letter abbrevs)
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
    if (abbrev) {
        // Check if filename contains the abbreviation (e.g., "montue", "satsun")
        if (filenameLower.includes(abbrev)) {
            return true;
        }
        
        // Check for common combinations
        const combinations = {
            'monday': ['montue', 'monwed', 'monthu', 'monfri', 'weekday', 'monfri'],
            'tuesday': ['montue', 'tuewed', 'tuethu', 'tuefri', 'weekday'],
            'wednesday': ['wedthu', 'wedfri', 'weekday'],
            'thursday': ['thufri', 'weekday'],
            'friday': ['weekday', 'monfri'],
            'saturday': ['satsun', 'weekend'],
            'sunday': ['satsun', 'sunsat', 'weekend']
        };
        
        if (combinations[dayLower]) {
            for (const combo of combinations[dayLower]) {
                if (filenameLower.includes(combo)) {
                    return true;
                }
            }
        }
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
            return { error: 'File not found', filename: filename };
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
                return { data: data, filename: filename };
            }
        }
        
        // Check holidays array
        if (currentHoliday && data.holidays && Array.isArray(data.holidays)) {
            if (data.holidays.includes(currentHoliday)) {
                return { data: data, filename: filename };
            }
        }
        
        // Check filename for day match (e.g., "montue", "satsun")
        if (filenameMatchesDay(filename, currentDay)) {
            return { data: data, filename: filename };
        }
        
        return { error: 'Day mismatch', filename: filename };
    } catch (error) {
        return { error: error.message, filename: filename };
    }
}

// Load schedule for current day
async function loadScheduleForDay(day) {
    const currentHoliday = getCurrentHoliday();
    
    // Try different filename patterns - check Daily-Planner directory
    const patternsToTry = [
        // Exact day match
        `${day}.json`,
        // Day abbreviation
        `${day.substring(0, 3)}.json`,
        // Common day combinations (abbreviated format from export)
        'satsun.json',
        'sunsat.json',
        'weekend.json',
        'montuewedthufri.json',
        'monfri.json',
        'weekday.json',
        // Holiday files
        currentHoliday ? `${currentHoliday}.json` : null,
        currentHoliday ? `hol_${currentHoliday.substring(0, 4)}.json` : null,
    ].filter(p => p !== null);
    
    // Also try patterns with underscores (new export format)
    const underscorePatterns = [
        `*_${day.substring(0, 3)}.json`,
        `*_${day}.json`,
        `*_satsun.json`,
        `*_montue.json`,
    ];
    
    let loadedData = null;
    let loadedFilename = null;
    const triedFiles = [];
    
    // Try exact day first
    for (const pattern of patternsToTry) {
        const result = await tryLoadSchedule(pattern);
        triedFiles.push(pattern);
        if (result && result.data) {
            loadedData = result.data;
            loadedFilename = result.filename;
            break;
        }
    }
    
    // If no exact match, try common patterns and check their days/holidays
    if (!loadedData) {
        const commonPatterns = [
            'schedule',
            'radio-schedule',
            'default'
        ];
        
        for (const pattern of commonPatterns) {
            const result = await tryLoadSchedule(`${pattern}.json`);
            triedFiles.push(`${pattern}.json`);
            if (result && result.data) {
                loadedData = result.data;
                loadedFilename = result.filename;
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
        // Better error message
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        const holidayText = currentHoliday ? ` or holiday (${currentHoliday})` : '';
        const triedText = triedFiles.length > 0 ? `\n\nTried files: ${triedFiles.join(', ')}` : '';
        
        container.innerHTML = `
            <div style="padding: 30px; color: #fff; text-align: center; max-width: 600px; margin: 50px auto; background: rgba(255,0,0,0.1); border: 2px solid #ff6b6b; border-radius: 8px;">
                <h2 style="color: #ff6b6b; margin-top: 0;">Schedule Not Found</h2>
                <p>No schedule found for <strong>${dayName}</strong>${holidayText}.</p>
                <p style="font-size: 0.9em; color: #aaa;">Please create and export a schedule for this day in the Daily Planner.</p>
                <p style="font-size: 0.85em; color: #888; margin-top: 20px;">
                    Looking in: <code>../Daily-Planner/</code> directory${triedText}
                </p>
                <p style="font-size: 0.85em; color: #888; margin-top: 10px;">
                    Expected filename format: <code>name_${day.substring(0, 3)}.json</code> or <code>name_montue.json</code>
                </p>
            </div>
        `;
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
