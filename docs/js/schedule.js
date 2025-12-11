// Schedule data
let scheduleData = [];
let currentShows = [];
let upcomingShows = [];
let userTimezone = 'auto'; // Start with auto-detect
let currentTime = new Date();
let scheduleInterval;

// Timezone mapping for display
const timezoneMap = {
    'auto': 'Auto (Browser Time)',
    'America/Denver': 'Mountain Time (MT)',
    'America/New_York': 'Eastern Time (ET)',
    'America/Chicago': 'Central Time (CT)',
    'America/Los_Angeles': 'Pacific Time (PT)',
    'UTC': 'UTC/GMT',
    'Europe/London': 'London (GMT)'
};

// DOM Elements
const timezoneSelect = document.getElementById('timezone');
const currentDayElement = document.getElementById('current-day');
const currentTimeElement = document.getElementById('current-time');
const currentShowsContainer = document.getElementById('current-shows');
const upcomingShowsContainer = document.getElementById('upcoming-shows');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mainNav = document.getElementById('mainNav');

// Days of the week for display
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Initialize the schedule
async function initSchedule() {
    // Set up mobile menu
    setupMobileMenu();
    
    // Populate timezone dropdown
    populateTimezoneSelect();
    
    // Try to get timezone from cookie or use browser's timezone
    const timezoneCookie = getCookie('user_timezone');
    if (timezoneCookie && timezoneMap[timezoneCookie]) {
        userTimezone = timezoneCookie;
    } else {
        try {
            const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (detectedTz) {
                userTimezone = detectedTz;
            }
        } catch (e) {
            console.error('Error detecting timezone:', e);
            userTimezone = 'America/Denver'; // Fallback to MT
        }
    }
    timezoneSelect.value = userTimezone;
    
    // Load schedule data
    try {
        const response = await fetch('../Radio-Schedule.json');
        const data = await response.json();
        scheduleData = data.schedule;
        updateSchedule();
    } catch (error) {
        console.error('Error loading schedule data:', error);
        currentShowsContainer.innerHTML = '<div class="error">Error loading schedule. Please try again later.</div>';
    }
    
    // Set up timezone change handler
    timezoneSelect.addEventListener('change', (e) => {
        userTimezone = e.target.value;
        setCookie('user_timezone', userTimezone, 365);
        updateSchedule();
    });
    
    // Update time and schedule every minute
    updateCurrentTime();
    scheduleInterval = setInterval(updateCurrentTime, 60000);
}

// Set up mobile menu functionality
function setupMobileMenu() {
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            mainNav.style.display = mainNav.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-toggle')) {
                mainNav.style.display = 'none';
            }
        });
    }
}

// Update the displayed current time and day
function updateCurrentTime() {
    const now = new Date();
    currentTime = now;
    
    // Format time
    const timeOptions = {
        timeZone: userTimezone === 'auto' ? undefined : userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    // Format date
    const dateOptions = {
        timeZone: userTimezone === 'auto' ? undefined : userTimezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    // Update time display
    const timeStr = now.toLocaleTimeString('en-US', timeOptions);
    const dateStr = now.toLocaleDateString('en-US', dateOptions);
    
    if (currentDayElement) currentDayElement.textContent = dateStr;
    if (currentTimeElement) currentTimeElement.textContent = timeStr;
    
    // Update schedule every minute
    updateSchedule();
}

// Convert local time to specified timezone
function getTimeInZone(date, timeZone) {
    if (timeZone === 'auto') return date;
    
    const options = {
        timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    const timeString = parts.find(part => part.type === 'time').value;
    
    // Parse the time string back to hours and minutes
    const [hours, minutes] = timeString.split(':').map(Number);
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes,
        date.getSeconds()
    );
}

// Populate timezone select dropdown
function populateTimezoneSelect() {
    timezoneSelect.innerHTML = '';
    
    for (const [value, label] of Object.entries(timezoneMap)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        timezoneSelect.appendChild(option);
    }
}

// Calculate time in minutes since midnight
function getTimeInMinutes(date) {
    return date.getHours() * 60 + date.getMinutes();
}

// Format time with AM/PM
function formatTime(hours, minutes) {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Update the updateSchedule function to handle timezone conversion
function updateSchedule() {
    if (!scheduleData.length) return;
    
    // Get current time in user's timezone
    const now = userTimezone === 'auto' ? new Date() : new Date(new Date().toLocaleString('en-US', { timeZone: userTimezone }));
    currentTime = now;
    
    const currentDay = daysOfWeek[now.getDay()];
    const currentTimeInMinutes = getTimeInMinutes(now);
    
    // Reset current and upcoming shows
    currentShows = [];
    upcomingShows = [];
    
    // Process each show in the schedule
    scheduleData.forEach(show => {
        // Convert show times to the selected timezone
        const [startHour, startMinute] = show.start.split(':').map(Number);
        const [endHour, endMinute] = show.end.split(':').map(Number);
        
        // Create date objects in the station's timezone (MT)
        const stationTz = 'America/Denver';
        const nowInStationTz = new Date(now.toLocaleString('en-US', { timeZone: stationTz }));
        const today = nowInStationTz.toISOString().split('T')[0];
        
        // Create date objects for show start/end in station timezone
        const showStart = new Date(`${today}T${show.start}:00-07:00`); // MT is UTC-7
        const showEnd = new Date(`${today}T${show.end}:00-07:00`);
        
        // Convert to user's selected timezone
        const userStartTime = userTimezone === 'auto' 
            ? showStart 
            : new Date(showStart.toLocaleString('en-US', { timeZone: userTimezone }));
        const userEndTime = userTimezone === 'auto'
            ? showEnd
            : new Date(showEnd.toLocaleString('en-US', { timeZone: userTimezone }));
        
        // Get hours and minutes in user's timezone
        const userStartHour = userStartTime.getHours();
        const userStartMinute = userStartTime.getMinutes();
        const userEndHour = userEndTime.getHours();
        const userEndMinute = userEndTime.getMinutes();
        
        const startTimeInMinutes = userStartHour * 60 + userStartMinute;
        const endTimeInMinutes = userEndHour * 60 + userEndMinute;
        
        // Check if show is currently playing in station's timezone
        const isCurrentlyPlaying = nowInStationTz >= showStart && nowInStationTz < showEnd;
        
        if (isCurrentlyPlaying) {
            currentShows.push({
                ...show,
                isCurrent: true,
                timeString: `${formatTime(userStartHour, userStartMinute)} - ${formatTime(userEndHour, userEndMinute)}`,
                description: show.description
            });
        } 
        // Check if show is upcoming today
        else if (nowInStationTz < showStart) {
            const minutesUntil = Math.round((showStart - nowInStationTz) / (1000 * 60));
            upcomingShows.push({
                ...show,
                isCurrent: false,
                timeString: `${formatTime(userStartHour, userStartMinute)} - ${formatTime(userEndHour, userEndMinute)}`,
                minutesUntil: minutesUntil,
                startsIn: minutesUntil <= 120 ? `in ${minutesUntil} min` : null,
                description: show.description
            });
        }
    });
    
    // Sort upcoming shows by start time
    upcomingShows.sort((a, b) => a.minutesUntil - b.minutesUntil);
    
    // Render the shows
    renderShows();
}

// Format time in 12-hour format with AM/PM
function renderShows() {
    // Clear containers
    currentShowsContainer.innerHTML = '';
    upcomingShowsContainer.innerHTML = '';
    
    // Show current shows
    if (currentShows.length > 0) {
        currentShowsContainer.innerHTML = `
            <h2>Now Playing</h2>
            <div class="shows-grid">
                ${currentShows.map(show => `
                    <div class="show-card current" title="${show.description || 'No description available'}">
                        <h3>${show.show}</h3>
                        <p class="show-time">${show.timeString}</p>
                        <p class="show-host">Host: ${show.host}</p>
                        ${show.description ? `<p class="show-description">${show.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        currentShowsContainer.innerHTML = '<div class="no-shows">No shows currently playing</div>';
    }
    
    // Show upcoming shows
    if (upcomingShows.length > 0) {
        upcomingShowsContainer.innerHTML = `
            <h2>Upcoming Shows</h2>
            <div class="shows-grid">
                ${upcomingShows.map(show => `
                    <div class="show-card" title="${show.description || 'No description available'}">
                        <h3>${show.show}</h3>
                        <p class="show-time">${show.timeString} ${show.startsIn ? `<span class="starts-soon">${show.startsIn}</span>` : ''}</p>
                        <p class="show-host">Host: ${show.host}</p>
                        ${show.description ? `<p class="show-description">${show.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        upcomingShowsContainer.innerHTML = '<div class="no-shows">No upcoming shows scheduled</div>';
    }
    
    // Add event listeners for tooltips on mobile
    if ('ontouchstart' in window) {
        document.querySelectorAll('.show-card').forEach(card => {
            card.addEventListener('click', function() {
                this.classList.toggle('show-description-visible');
            });
        });
    }
}

// Cookie helper functions
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSchedule);
} else {
    initSchedule();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (scheduleInterval) clearInterval(scheduleInterval);
});
