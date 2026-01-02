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
    
// Update the timezone change handler to ensure immediate updates
timezoneSelect.addEventListener('change', (e) => {
    userTimezone = e.target.value;
    setCookie('user_timezone', userTimezone, 365);
    updateCurrentTime();  // Update time display immediately
    updateSchedule();     // Update schedule with new timezone
});
    
    // Load schedule data - try new format first, then fall back to old format
    try {
        // Get current day
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getDay()];
        
        // Try to load day-specific schedule from Daily-Planner
        let scheduleLoaded = false;
        const dayFiles = [
            `${currentDay}.json`,
            `${currentDay.substring(0, 3)}.json`,
            'schedule_montue.json',
            'schedule_satsun.json',
            'schedule_weekend.json',
            'schedule_weekday.json'
        ];
        
        for (const filename of dayFiles) {
            try {
                const response = await fetch(`/Daily-Planner/${filename}`);
                if (response.ok) {
                    const data = await response.json();
                    // Check if this schedule applies to current day
                    if (data.playlists && Array.isArray(data.playlists)) {
                        // Convert new format to old format for compatibility
                        scheduleData = data.playlists.map(p => ({
                            show: p.name || 'Untitled',
                            start: p.start || '00:00',
                            end: p.end || '01:00',
                            host: 'Automated Playlist',
                            description: p.description || ''
                        }));
                        scheduleLoaded = true;
                        break;
                    }
                }
            } catch (e) {
                // Continue to next file
            }
        }
        
        // Fall back to old Radio-Schedule.json format
        if (!scheduleLoaded) {
            const response = await fetch('/Radio-Schedule.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            scheduleData = data.schedule || [];
        }
        
        if (scheduleData.length === 0) {
            throw new Error('No schedule data found');
        }
        updateSchedule();
    } catch (error) {
        console.error('Error loading schedule data:', error);
        currentShowsContainer.innerHTML = '<div class="error">Error loading schedule. Please try again later.</div>';
    }
    
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
        document.addEventListener('click', function(e) {
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
    
    // Get current time in station's timezone (MT)
    const stationTz = 'America/Denver';
    const now = new Date();
    
    // Create a date object for the station's current time
    const nowInStationTz = new Date(now.toLocaleString('en-US', { timeZone: stationTz }));
    const currentDay = daysOfWeek[nowInStationTz.getDay()];
    const currentTimeInMinutes = nowInStationTz.getHours() * 60 + nowInStationTz.getMinutes();
    
    // Reset current and upcoming shows
    currentShows = [];
    upcomingShows = [];
    
    // Process each show in the schedule
    scheduleData.forEach(show => {
        const [startHour, startMinute] = show.start.split(':').map(Number);
        const [endHour, endMinute] = show.end.split(':').map(Number);
        
        // Create date objects for the show times in station's timezone
        const showDate = new Date(nowInStationTz);
        showDate.setHours(startHour, startMinute, 0, 0);
        
        const endDate = new Date(nowInStationTz);
        endDate.setHours(endHour, endMinute, 0, 0);
        
        // Handle shows that cross midnight
        if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
            if (nowInStationTz < endDate) {
                // If we're before the end time of an overnight show, adjust the start date to yesterday
                showDate.setDate(showDate.getDate() - 1);
            } else {
                // Otherwise, adjust the end date to tomorrow
                endDate.setDate(endDate.getDate() + 1);
            }
        }
        
        // Convert to timestamps for comparison
        const showStartTime = showDate.getTime();
        const showEndTime = endDate.getTime();
        const currentTime = nowInStationTz.getTime();
        
        // Format times for display in user's timezone
        let displayStartTime = show.start;
        let displayEndTime = show.end;
        
        if (userTimezone !== 'auto') {
            try {
                const formatOptions = { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true,
                    timeZone: userTimezone
                };
                
                // Use the original date objects but format in user's timezone
                displayStartTime = showDate.toLocaleTimeString('en-US', formatOptions);
                displayEndTime = endDate.toLocaleTimeString('en-US', formatOptions);
            } catch (e) {
                console.error('Error converting time:', e);
            }
        }
        
        // Check if show is currently playing in station's timezone
        const isCurrentlyPlaying = currentTime >= showStartTime && currentTime < showEndTime;
        
        if (isCurrentlyPlaying) {
            currentShows.push({
                ...show,
                isCurrent: true,
                timeString: `${formatTime(displayStartTime)} - ${formatTime(displayEndTime)}`,
                description: show.description || 'No description available',
                sortTime: showStartTime
            });
        } 
        // Check if show is upcoming today
        else if (currentTime < showStartTime) {
            const minutesUntil = Math.ceil((showStartTime - currentTime) / (1000 * 60));
            upcomingShows.push({
                ...show,
                isCurrent: false,
                timeString: `${formatTime(displayStartTime)} - ${formatTime(displayEndTime)}`,
                minutesUntil: minutesUntil,
                startsIn: minutesUntil <= 120 ? `in ${minutesUntil} min` : null,
                description: show.description || 'No description available',
                sortTime: showStartTime
            });
        }
    });
    
    // Sort upcoming shows by start time
    upcomingShows.sort((a, b) => a.minutesUntil - b.minutesUntil);
    
    // Render the shows
    renderShows();
}

// Helper function to format time from "HH:MM AM/PM" to "HH:MM AM/PM"
function formatTime(timeStr) {
    if (typeof timeStr === 'string') {
        // If it's already in "HH:MM AM/PM" format, return as is
        if (timeStr.match(/^\d{1,2}:\d{2} [AP]M$/i)) {
            return timeStr;
        }
        // If it's in "HH:MM" format, convert to "HH:MM AM/PM"
        const [hours, minutes] = timeStr.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    return timeStr;
}

// Render the shows in the UI
function renderShows() {
    // Clear containers but keep the headers
    const currentShowsGrid = currentShowsContainer.querySelector('.shows-grid');
    const upcomingShowsGrid = upcomingShowsContainer.querySelector('.shows-grid');
    
    // Clear existing show cards but keep the headers
    if (currentShowsGrid) {
        currentShowsGrid.innerHTML = '';
    } else {
        currentShowsContainer.innerHTML = `
            <div class="shows-grid"></div>
        `;
    }
    
    if (upcomingShowsGrid) {
        upcomingShowsGrid.innerHTML = '';
    } else {
        upcomingShowsContainer.innerHTML = `
            <div class="shows-grid"></div>
        `;
    }
    
    // Get the grid containers
    const currentGrid = currentShowsContainer.querySelector('.shows-grid');
    const upcomingGrid = upcomingShowsContainer.querySelector('.shows-grid');
    
    // Show current shows
    if (currentShows.length > 0) {
        currentShows.forEach(show => {
            const showCard = document.createElement('div');
            showCard.className = 'show-card current';
            showCard.setAttribute('data-description', show.description);
            showCard.innerHTML = `
                <h3>${show.show}</h3>
                <p class="show-time">${show.timeString}</p>
                <p class="show-host">${show.host || 'Automated Playlist'}</p>
                <div class="show-description">${show.description}</div>
            `;
            currentGrid.appendChild(showCard);
        });
    } else {
        currentGrid.innerHTML = '<div class="no-shows">No shows currently playing. Check back later!</div>';
    }
    
    // Show upcoming shows
    if (upcomingShows.length > 0) {
        upcomingShows.slice(0, 6).forEach(show => {
            const showCard = document.createElement('div');
            showCard.className = 'show-card';
            showCard.setAttribute('data-description', show.description);
            showCard.innerHTML = `
                <h3>${show.show}</h3>
                <p class="show-time">${show.timeString} ${show.startsIn ? `<span class="starts-soon">${show.startsIn}</span>` : ''}</p>
                <p class="show-host">${show.host || 'Automated Playlist'}</p>
                <div class="show-description">${show.description}</div>
            `;
            upcomingGrid.appendChild(showCard);
        });
    } else {
        upcomingGrid.innerHTML = '<div class="no-shows">No upcoming playlists for hours, check back later!</div>';
    }
    
    // Initialize tooltips
    initTooltips();
}

function initTooltips() {
    const showCards = document.querySelectorAll('.show-card');
    const body = document.body;
    
    // Create overlay element if it doesn't exist
    let overlay = document.querySelector('.description-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'description-overlay';
        body.appendChild(overlay);
    }

    // For touch devices
    showCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't toggle if clicking on a link
            if (e.target.tagName === 'A') return;
            
            // Toggle the active class
            const isActive = this.classList.contains('show-description-visible');
            
            // Close all other open descriptions
            document.querySelectorAll('.show-card.show-description-visible').forEach(openCard => {
                if (openCard !== this) {
                    openCard.classList.remove('show-description-visible');
                }
            });
            
            // Toggle current card
            this.classList.toggle('show-description-visible', !isActive);
            
            // Toggle overlay
            if (!isActive) {
                overlay.style.display = 'block';
            } else {
                overlay.style.display = 'none';
            }
            
            // Prevent event bubbling
            e.stopPropagation();
        });
    });
    
    // Close description when clicking overlay
    overlay.addEventListener('click', function() {
        document.querySelectorAll('.show-card.show-description-visible').forEach(card => {
            card.classList.remove('show-description-visible');
        });
        this.style.display = 'none';
    });

    // Close description when clicking outside on desktop
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.show-card')) {
            document.querySelectorAll('.show-card.show-description-visible').forEach(card => {
                card.classList.remove('show-description-visible');
            });
            overlay.style.display = 'none';
        }
    });
}

// Cookie helper functions
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
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