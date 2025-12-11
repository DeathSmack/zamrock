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

// Update the schedule display
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
        const [startHour, startMinute] = show.start.split(':').map(Number);
        const [endHour, endMinute] = show.end.split(':').map(Number);
        
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        
        // Check all possible cases where a show could be current
        const isStandardShow = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
        const isOvernightShow = (endTimeInMinutes < startTimeInMinutes) && 
                              (currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes);
        
        if (isStandardShow || isOvernightShow) {
            currentShows.push({
                ...show,
                isCurrent: true,
                timeString: isOvernightShow 
                    ? `Overnight until ${formatTime(endHour, endMinute)}`
                    : `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`
            });
        } 
        // Check if show is upcoming today
        else if (currentTimeInMinutes < startTimeInMinutes) {
            const minutesUntil = startTimeInMinutes - currentTimeInMinutes;
            upcomingShows.push({
                ...show,
                isCurrent: false,
                timeString: `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`,
                minutesUntil: minutesUntil,
                startsIn: minutesUntil <= 60 ? `in ${minutesUntil} min` : null
            });
        }
    });
    
    // Sort upcoming shows by start time
    upcomingShows.sort((a, b) => {
        const aStart = parseInt(a.start.replace(':', ''));
        const bStart = parseInt(b.start.replace(':', ''));
        return aStart - bStart;
    });
    
    // Render the shows
    renderShows();
}

// Format time in 12-hour format with AM/PM
function formatTime(hours, minutes) {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Render the shows in the UI
function renderShows() {
    // Render current shows
    if (currentShows.length > 0) {
        currentShowsContainer.innerHTML = `
            <div class="show-list">
                ${currentShows.map(show => `
                    <div class="show-card current">
                        <div class="show-time">${show.timeString}</div>
                        <div class="show-name">${show.show}</div>
                        <div class="show-host">${show.host || 'Automated Playlist'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        currentShowsContainer.innerHTML = '<div class="no-shows">No shows currently playing. Check back later!</div>';
    }
    
    // Render upcoming shows
    if (upcomingShows.length > 0) {
        upcomingShowsContainer.innerHTML = `
            <div class="show-list">
                ${upcomingShows.slice(0, 6).map(show => `
                    <div class="show-card">
                        <div class="show-time">${show.timeString}</div>
                        <div class="show-name">${show.show}</div>
                        <div class="show-host">${show.host || 'Automated Playlist'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        upcomingShowsContainer.innerHTML = '<div class="no-shows">No upcoming shows scheduled for today.</div>';
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
