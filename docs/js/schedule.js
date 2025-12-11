// Schedule data
let scheduleData = [];
let currentShows = [];
let upcomingShows = [];
let userTimezone = 'America/Denver'; // Default to MT
let currentTime = new Date();
let scheduleInterval;

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
    // Set up mobile menu toggle
    setupMobileMenu();
    
    // Try to get timezone from cookie or use browser's timezone
    const timezoneCookie = getCookie('user_timezone');
    if (timezoneCookie) {
        userTimezone = timezoneCookie;
        timezoneSelect.value = userTimezone;
    } else {
        try {
            const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (detectedTz) {
                userTimezone = detectedTz;
                timezoneSelect.value = userTimezone;
            }
        } catch (e) {
            console.error('Error detecting timezone:', e);
        }
    }
    
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

// Update the schedule display
function updateSchedule() {
    if (!scheduleData.length) return;
    
    const now = currentTime;
    const currentDay = daysOfWeek[now.getDay()];
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    
    // Reset current and upcoming shows
    currentShows = [];
    upcomingShows = [];
    
    // Process each show in the schedule
    scheduleData.forEach(show => {
        const [startHour, startMinute] = show.start.split(':').map(Number);
        const [endHour, endMinute] = show.end.split(':').map(Number);
        
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        
        // Check if show is currently playing
        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
            currentShows.push({
                ...show,
                isCurrent: true,
                timeString: `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`
            });
        }
        // Check if show is upcoming today
        else if (currentTimeInMinutes < startTimeInMinutes) {
            upcomingShows.push({
                ...show,
                isCurrent: false,
                timeString: `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`,
                minutesUntil: startTimeInMinutes - currentTimeInMinutes
            });
        }
        // Handle shows that started yesterday and end today
        else if (endTimeInMinutes < startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
            currentShows.push({
                ...show,
                isCurrent: true,
                timeString: `Overnight until ${formatTime(endHour, endMinute)}`
            });
        }
        // Handle shows that start late and end the next day
        else if (startTimeInMinutes > endTimeInMinutes && currentTimeInMinutes >= startTimeInMinutes) {
            currentShows.push({
                ...show,
                isCurrent: true,
                timeString: `Overnight until ${formatTime(endHour, endMinute)}`
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
