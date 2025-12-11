// Schedule data - This would typically come from an API in a production environment
const scheduleData = [
  { time: '00:00', show: 'Late Night Vibes', dj: 'DJ Nocturne', genre: 'Ambient/Chill' },
  { time: '02:00', show: 'Early Riser', dj: 'Morning Star', genre: 'Jazz/Fusion' },
  { time: '06:00', show: 'Breakfast Beats', dj: 'MC Sunrise', genre: 'Funk/Soul' },
  { time: '09:00', show: 'Morning Mix', dj: 'The Selector', genre: 'Variety' },
  { time: '12:00', show: 'Lunchtime Lounge', dj: 'Chef Beats', genre: 'Downtempo' },
  { time: '15:00', show: 'Afternoon Delight', dj: 'Sunny D', genre: 'Reggae' },
  { time: '18:00', show: 'Evening Session', dj: 'The Professor', genre: 'Rock/Indie' },
  { time: '21:00', show: 'Prime Time', dj: 'The Maestro', genre: 'Electronic' },
];

// Sample now playing data - in a real app, this would come from your radio server
const nowPlayingData = {
  'Late Night Vibes': 'Tycho - Dive',
  'Early Riser': 'Nujabes - Aruarian Dance',
  'Breakfast Beats': 'Vulfpeck - Back Pocket',
  'Morning Mix': 'Tame Impala - The Less I Know The Better',
  'Lunchtime Lounge': 'Khruangbin - White Gloves',
  'Afternoon Delight': 'Bob Marley - Three Little Birds',
  'Evening Session': 'Tame Impala - Let It Happen',
  'Prime Time': 'Daft Punk - Around the World'
};

let userTimezone = 'auto';
let currentTime = new Date();

// Initialize the schedule
function initSchedule() {
  // Try to get timezone from cookie
  const timezoneCookie = getCookie('user_timezone');
  if (timezoneCookie) {
    userTimezone = timezoneCookie;
    document.getElementById('timezone').value = userTimezone;
  } else {
    // Try to detect user's timezone
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTz) {
        userTimezone = detectedTz;
        document.getElementById('timezone').value = userTimezone;
      }
    } catch (e) {
      console.error('Error detecting timezone:', e);
    }
  }

  updateCurrentTime();
  renderSchedule();
  
  // Update time every minute
  setInterval(updateCurrentTime, 60000);
  
  // Update schedule highlight every 30 seconds
  setInterval(renderSchedule, 30000);
}

// Update the displayed current time
function updateCurrentTime() {
  const now = new Date();
  const timeOptions = {
    timeZone: userTimezone === 'auto' ? undefined : userTimezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  
  const dateOptions = {
    timeZone: userTimezone === 'auto' ? undefined : userTimezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const timeStr = now.toLocaleTimeString('en-US', timeOptions);
  const dateStr = now.toLocaleDateString('en-US', dateOptions);
  
  document.getElementById('current-time').textContent = `${dateStr} • ${timeStr}`;
  currentTime = now;
}

// Update timezone from dropdown
function updateTimezone(timezone) {
  userTimezone = timezone;
  setCookie('user_timezone', timezone, 365);
  updateCurrentTime();
  renderSchedule();
}

// Render the schedule with current time highlighting
function renderSchedule() {
  const scheduleContainer = document.getElementById('schedule-entries');
  if (!scheduleContainer) return;
  
  // Clear existing entries
  scheduleContainer.innerHTML = '';
  
  // Get current time in user's timezone
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  
  // Find current and next show
  let currentShowIndex = -1;
  
  scheduleData.forEach((show, index) => {
    const [showHours, showMinutes] = show.time.split(':').map(Number);
    const showTimeInMinutes = showHours * 60 + showMinutes;
    
    if (showTimeInMinutes <= currentTimeInMinutes) {
      currentShowIndex = index;
    }
  });
  
  // If it's past the last show of the day, show the first one as upcoming
  if (currentShowIndex === -1) {
    currentShowIndex = scheduleData.length - 1;
  }
  
  // Render shows
  scheduleData.forEach((show, index) => {
    const showElement = document.createElement('div');
    showElement.className = `schedule-entry ${index === currentShowIndex ? 'current' : ''}`;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'time-col';
    timeElement.textContent = show.time;
    
    const showElementName = document.createElement('div');
    showElementName.className = 'show-col';
    showElementName.innerHTML = `<span class="show-name">${show.show}</span>`;
    
    const djElement = document.createElement('div');
    djElement.className = 'dj-col';
    djElement.innerHTML = `<span class="dj-name">${show.dj}</span>`;
    
    const nowPlayingElement = document.createElement('div');
    nowPlayingElement.className = 'now-playing';
    nowPlayingElement.innerHTML = `
      <div class="now-playing-track">${nowPlayingData[show.show] || 'Tune in...'}</div>
      <div class="genre">${show.genre}</div>
    `;
    
    showElement.appendChild(timeElement);
    showElement.appendChild(showElementName);
    showElement.appendChild(djElement);
    showElement.appendChild(nowPlayingElement);
    
    scheduleContainer.appendChild(showElement);
  });
  
  // Scroll current show into view
  const currentShowElement = document.querySelector('.schedule-entry.current');
  if (currentShowElement) {
    currentShowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// Add event listener for timezone change
document.getElementById('timezone')?.addEventListener('change', (e) => {
  updateTimezone(e.target.value);
});
