/* ──── Radio Schedule Planner ──── */

// Global state
let nextId = 1;
let use12HourFormat = true; // Default to 12hr format
let currentSchedule = {
  id: 'default',
  name: 'My Schedule',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  holidays: [],
  playlists: []
};

const HOLIDAYS = [
  { id: 'new-years-day', name: "New Year's Day" },
  { id: 'valentines-day', name: "Valentine's Day" },
  { id: 'st-patricks-day', name: "St. Patrick's Day" },
  { id: 'easter', name: "Easter" },
  { id: 'independence-day', name: "Independence Day" },
  { id: 'halloween', name: "Halloween" },
  { id: 'thanksgiving', name: "Thanksgiving" },
  { id: 'christmas-eve', name: "Christmas Eve" },
  { id: 'christmas-day', name: "Christmas Day" },
  { id: 'new-years-eve', name: "New Year's Eve" }
];

// Helper functions
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function showNotification(message, type = 'info') {
  // Remove any existing notifications
  $('.notification').remove();
  
  const notification = $(`<div class="notification ${type}">${message}</div>`);
  $('body').append(notification);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.fadeOut(500, () => notification.remove());
  }, 3000);
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('radioSchedule', JSON.stringify(currentSchedule));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

function updateActiveDaysDisplay() {
  const display = $('#active-days-display');
  const daysText = display.find('.no-days');
  const daysList = currentSchedule.days.length > 0 
    ? currentSchedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
    : 'No days selected';
  
  if (currentSchedule.days.length > 0) {
    display.html(`Active for: ${currentSchedule.days.map(d => 
      `<span class="day-tag">${d.charAt(0).toUpperCase() + d.slice(1)}</span>`
    ).join(' ')}`);
  } else {
    display.html('Active for: <span class="no-days">No days selected</span>');
  }
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function format12h(time24) {
  if (!time24) return '';
  try {
    const [hours, minutes] = time24.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time24; // Return as-is if invalid
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (e) {
    console.error('Error formatting 12h time:', e);
    return time24;
  }
}

function formatTime(time24, use12hr) {
  if (!time24) return '';
  try {
    if (use12hr) {
      return format12h(time24);
    }
    // Ensure 24-hour format is properly formatted
    const [h, m] = time24.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return time24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  } catch (e) {
    console.error('Error formatting time:', e);
    return time24;
  }
}

function parseTimeInput(inputValue, use12hr) {
  if (!inputValue) return '';
  
  try {
    // Handle 12-hour format with AM/PM
    if (use12hr) {
      const match = inputValue.match(/^(\d{1,2}):?(\d{2})?\s*([AP]M?)?$/i);
      if (!match) return inputValue;
      
      let hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const period = (match[3] || '').toUpperCase();
      
      // Convert to 24-hour format
      if (period.includes('P') && hours < 12) {
        hours += 12;
      } else if (period.includes('A') && hours === 12) {
        hours = 0;
      }
      
      // Ensure valid time
      hours = Math.min(23, Math.max(0, hours));
      const validMinutes = Math.min(59, Math.max(0, minutes));
      
      return `${hours.toString().padStart(2, '0')}:${validMinutes.toString().padStart(2, '0')}`;
    }
    
    // Handle 24-hour format
    const match24 = inputValue.match(/^(\d{1,2}):?(\d{2})?$/);
    if (match24) {
      let hours = parseInt(match24[1]) || 0;
      const minutes = parseInt(match24[2]) || 0;
      hours = Math.min(23, Math.max(0, hours));
      const validMinutes = Math.min(59, Math.max(0, minutes));
      return `${hours.toString().padStart(2, '0')}:${validMinutes.toString().padStart(2, '0')}`;
    }
    
    return inputValue;
  } catch (e) {
    console.error('Error parsing time input:', e);
    return inputValue;
  }
}

// Initialize data
function initializeData() {
  // Initialize holiday select dropdown
  const holidaySelect = $('#holiday-select');
  holidaySelect.empty().append('<option value="">Add Holiday...</option>');
  HOLIDAYS.forEach(holiday => {
    holidaySelect.append(`<option value="${holiday.id}">${holiday.name}</option>`);
  });
  
  // Start with default playlists (will be loaded from Radio-Schedule.json if available)
  currentSchedule.playlists = [];
  nextId = 1;
  
  // Set default days (Mon-Fri)
  $('input[name="days"]').each(function() {
    const day = $(this).val();
    $(this).prop('checked', currentSchedule.days.includes(day));
  });
  
  // Try to load from localStorage
  try {
    const savedSchedule = localStorage.getItem('radioSchedule');
    if (savedSchedule) {
      const parsed = JSON.parse(savedSchedule);
      currentSchedule = {
        ...currentSchedule,
        ...parsed,
        days: Array.isArray(parsed.days) ? parsed.days : [],
        holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
        shows: Array.isArray(parsed.shows) ? parsed.shows : []
      };
      
      // Update nextId based on existing playlists
      if (currentSchedule.playlists.length > 0) {
        nextId = Math.max(...currentSchedule.playlists.map(p => p.id || 0), 0) + 1;
      }
      
      // Update UI with loaded data
      $('#schedule-name').val(currentSchedule.name);
      $('input[name="days"]').each(function() {
        const day = $(this).val();
        $(this).prop('checked', currentSchedule.days.includes(day));
      });
    }
  } catch (e) {
    console.error('Error loading schedule:', e);
    showNotification('Error loading saved schedule. Creating a new one.', 'error');
  }
  
  // Set default sort to name
  $('#sort-by').val('name');
  
  // Initialize UI
  updateScheduleUI();
  renderSchedule();
  
  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Time format toggle (display only - always saves in 24hr)
  $('#time-format-toggle').on('change', function() {
    use12HourFormat = $(this).is(':checked');
    localStorage.setItem('use12HourFormat', use12HourFormat);
    $('#time-format-label').text(use12HourFormat ? '12hr' : '24hr');
    
    // Update all time inputs
    $('input[type="time"], .time-input').each(function() {
      const $input = $(this);
      const currentValue = $input.val();
      if (currentValue) {
        // Trigger input event to reformat the time
        $input.trigger('input');
      }
    });
    
    renderSchedule(); // Re-render to update time display
  });
  
  // Load time format preference
  const savedFormat = localStorage.getItem('use12HourFormat');
  if (savedFormat !== null) {
    use12HourFormat = savedFormat === 'true';
    $('#time-format-toggle').prop('checked', use12HourFormat);
  }
  $('#time-format-label').text(use12HourFormat ? '12hr' : '24hr');
  
  // Day checkboxes
  $('input[name="days"]').on('change', function() {
    currentSchedule.days = [];
    $('input[name="days"]:checked').each(function() {
      currentSchedule.days.push($(this).val());
    });
    updateActiveSelections();
    saveToLocalStorage();
  });
  
  // Add holiday button
  $('#add-holiday').on('click', function() {
    const holidayId = $('#holiday-select').val();
    if (holidayId && !currentSchedule.holidays.includes(holidayId)) {
      currentSchedule.holidays.push(holidayId);
      $('#holiday-select').val(''); // Reset dropdown
      updateActiveSelections();
      saveToLocalStorage();
    }
  });
  
  // Remove tag (day or holiday)
  $(document).on('click', '.remove-tag', function() {
    const type = $(this).data('type');
    const value = $(this).data('value');
    
    if (type === 'day') {
      $(`input[name="days"][value="${value}"]`).prop('checked', false);
      currentSchedule.days = currentSchedule.days.filter(d => d !== value);
    } else if (type === 'holiday') {
      currentSchedule.holidays = currentSchedule.holidays.filter(h => h !== value);
    }
    updateActiveSelections();
    saveToLocalStorage();
  });
  
  // Schedule name
  $('#schedule-name').on('change', function() {
    currentSchedule.name = $(this).val().trim() || 'My Schedule';
    saveToLocalStorage();
  });
  
  // File operations
  $('#load-schedule').on('click', function() {
    $('#file-input').click();
  });
  
  $('#file-input').on('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        // Support both old format (shows) and new format (playlists)
        const playlists = data.playlists || data.shows || [];
        if (Array.isArray(playlists) && playlists.length > 0) {
          currentSchedule = {
            ...currentSchedule,
            name: data.name || 'My Schedule',
            days: data.days || [],
            holidays: data.holidays || [],
            playlists: playlists.map(playlist => ({
              ...playlist,
              id: nextId++,
              weight: Math.min(25, Math.max(1, playlist.weight || 5))
            }))
          };
          
          // Update UI
          $('#schedule-name').val(currentSchedule.name);
          $('input[name="days"]').prop('checked', false);
          currentSchedule.days.forEach(day => {
            $(`input[name="days"][value="${day}"]`).prop('checked', true);
          });
          
          renderSchedule();
          updateActiveSelections();
          showNotification('Schedule loaded successfully!', 'success');
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
        showNotification('Error loading schedule', 'error');
      }
    };
    reader.readAsText(file);
  });
  
  // Export button
  $('#export-json').on('click', function() {
    if (currentSchedule.days.length === 0 && currentSchedule.holidays.length === 0) {
      showNotification('Please select at least one day or holiday before exporting.', 'error');
      return;
    }
    
    const data = {
      name: currentSchedule.name,
      days: currentSchedule.days,
      holidays: currentSchedule.holidays,
      playlists: currentSchedule.playlists.map(({id, ...rest}) => rest) // Remove id from playlists
    };
    
    // Build filename with better formatting: name_days_holidays.json
    let filenameParts = [];
    
    // Add name part
    const namePart = currentSchedule.name.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
    if (namePart) {
      filenameParts.push(namePart);
    }
    
    // Add days as a group (sorted, abbreviated)
    const sortedDays = [...currentSchedule.days].sort();
    if (sortedDays.length > 0) {
      const dayAbbrevs = sortedDays.map(day => day.substring(0, 3));
      filenameParts.push(dayAbbrevs.join(''));
    }
    
    // Add holidays as a group (sorted, abbreviated)
    const sortedHolidays = [...currentSchedule.holidays].sort();
    if (sortedHolidays.length > 0) {
      const holidayAbbrevs = sortedHolidays.map(holidayId => {
        const holiday = HOLIDAYS.find(h => h.id === holidayId);
        if (holiday) {
          // Use first 3-4 chars of holiday name
          return holiday.name.replace(/[^\w]/gi, '').substring(0, 4).toLowerCase();
        }
        return '';
      }).filter(h => h);
      if (holidayAbbrevs.length > 0) {
        filenameParts.push('hol_' + holidayAbbrevs.join(''));
      }
    }
    
    // Format: name_days_holidays.json (e.g., "schedule_montue.json" or "schedule_satsun_hol_xmas.json")
    const filename = filenameParts.join('_') + '.json';
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Schedule exported as ${filename}`, 'success');
  });
  
  // New schedule button
  $('#new-schedule').on('click', function() {
    if (confirm('Are you sure you want to create a new schedule? This will clear all current playlists.')) {
      currentSchedule.playlists = [];
      currentSchedule.name = 'My Schedule';
      currentSchedule.holidays = [];
      currentSchedule.days = [];
      nextId = 1;
      
      $('#schedule-name').val('My Schedule');
      $('input[name="days"]').prop('checked', false);
      
      renderSchedule();
      updateActiveSelections();
      saveToLocalStorage();
    }
  });
  
  // Sort by dropdown
  $('#sort-by').on('change', renderSchedule);
  
  // Add playlist button
  $('#add-at-end').on('click', addNewPlaylist);
  
  // Delete playlist button
  $(document).on('click', '.delete-playlist', function() {
    const id = $(this).closest('tr').data('id');
    currentSchedule.playlists = currentSchedule.playlists.filter(playlist => playlist.id !== id);
    saveToLocalStorage();
    renderSchedule();
  });
  
  // Time increment/decrement buttons (15 minute increments)
  $(document).on('click', '.time-btn', function(e) {
    e.preventDefault();
    const $input = $(this).siblings('input');
    const minutes = $(this).hasClass('inc') ? 15 : -15;
    const time = timeToMinutes($input.val() || '00:00');
    const newTime = (time + minutes + (24 * 60)) % (24 * 60);
    const newTimeStr = minutesToTime(newTime);
    $input.val(newTimeStr).trigger('input');
  });
  
  // Weight controls
  $(document).on('click', '.weight-btn', function(e) {
    e.preventDefault();
    const $input = $(this).siblings('.weight-input');
    const change = $(this).hasClass('inc') ? 1 : -1;
    let value = parseInt($input.val()) || 1;
    value = Math.min(25, Math.max(1, value + change));
    $input.val(value).trigger('change');
  });

  // Handle direct weight input
  $(document).on('change', '.weight-input', function() {
    const $input = $(this);
    let value = parseInt($input.val()) || 1;
    value = Math.min(25, Math.max(1, value));
    $input.val(value);
    
    const id = $input.closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(p => p.id === id);
    if (playlist) {
      playlist.weight = value;
      saveToLocalStorage();
    }
  });
  
  // Handle playlist description changes
  $(document).on('change', '.playlist-description', function() {
    const id = $(this).closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(p => p.id === id);
    if (playlist) {
      playlist.description = $(this).val();
      saveToLocalStorage();
    }
  });
  
  // Handle time changes
  $(document).on('change', '.time-start, .time-end', function() {
    const id = $(this).closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(p => p.id === id);
    if (playlist) {
      if ($(this).hasClass('time-start')) {
        playlist.start = $(this).val();
      } else {
        playlist.end = $(this).val();
      }
      saveToLocalStorage();
    }
  });
  
  // Handle weight changes
  $(document).on('change', '.weight-input', function() {
    const id = $(this).closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(p => p.id === id);
    if (playlist) {
      playlist.weight = Math.min(25, Math.max(1, parseInt($(this).val()) || 5));
      $(this).val(playlist.weight);
      saveToLocalStorage();
    }
  });
}

function addHoliday() {
  const holidayId = $('#holiday-select').val();
  if (!holidayId) return;
  
  if (!currentSchedule.holidays.includes(holidayId)) {
    currentSchedule.holidays.push(holidayId);
    updateScheduleUI();
    saveToLocalStorage();
    showNotification('Holiday added to schedule', 'success');
  } else {
    showNotification('This holiday is already added', 'info');
  }
  
  // Reset the dropdown
  $('#holiday-select').val('');
}

function updateActiveDays() {
  currentSchedule.days = [];
  $('input[name="days"]:checked').each(function() {
    currentSchedule.days.push($(this).val());
  });
  updateScheduleUI();
  saveToLocalStorage();
}

function createDefaultSchedule() {
  currentSchedule = {
    id: 'default',
    name: 'My Schedule',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    holidays: [],
    shows: [
      { id: 1, name: 'Morning Show', start: '06:00', end: '10:00', weight: 10, order: 0 },
      { id: 2, name: 'Midday Mix', start: '10:00', end: '14:00', weight: 8, order: 1 },
      { id: 3, name: 'Afternoon Drive', start: '14:00', end: '18:00', weight: 12, order: 2 },
      { id: 4, name: 'Evening Show', start: '18:00', end: '22:00', weight: 8, order: 3 },
      { id: 5, name: 'Late Night', start: '22:00', end: '02:00', weight: 6, order: 4 }
    ]
  };
  nextId = 6;
  updateScheduleUI();
  renderSchedule();
  saveToLocalStorage();
}

function updateScheduleUI() {
  // Update checkboxes
  $('input[name="days"]').each(function() {
    $(this).prop('checked', currentSchedule.days.includes($(this).val()));
  });
  
  // Update schedule name
  if ($('#schedule-name').val() !== currentSchedule.name) {
    $('#schedule-name').val(currentSchedule.name);
  }
  
  // Update active selections display
  updateActiveSelections();
}

function updateActiveSelections() {
  const container = $('#active-selections');
  container.empty();
  
  // Add day tags
  currentSchedule.days.forEach(day => {
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    container.append(`
      <span class="selection-tag day-tag">
        ${dayName}
        <span class="remove-tag" data-type="day" data-value="${day}" title="Remove">&times;</span>
      </span>
    `);
  });
  
  // Add holiday tags
  currentSchedule.holidays.forEach(holidayId => {
    const holiday = HOLIDAYS.find(h => h.id === holidayId) || { id: holidayId, name: holidayId };
    container.append(`
      <span class="selection-tag holiday-tag">
        ${holiday.name}
        <span class="remove-tag" data-type="holiday" data-value="${holidayId}" title="Remove">&times;</span>
      </span>
    `);
  });
  
  // Show message if no selections
  if (container.children().length === 0) {
    container.append('<span class="no-selection">No days or holidays selected</span>');
  }
  
  // Update active days display
  updateActiveDaysDisplay();
}

// Render schedule
function renderSchedule() {
  const tbody = $('#schedule tbody');
  tbody.empty();
  
  // Sort playlists based on current sort option
  const sortBy = $('#sort-by').val();
  let sortedPlaylists = [...currentSchedule.playlists];
  
  switch (sortBy) {
    case 'name':
      sortedPlaylists.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      break;
    case 'weight':
      sortedPlaylists.sort((a, b) => (b.weight || 0) - (a.weight || 0));
      break;
    case 'weight-asc':
      sortedPlaylists.sort((a, b) => (a.weight || 0) - (b.weight || 0));
      break;
    default: // 'start'
      sortedPlaylists.sort((a, b) => {
        // Handle overnight playlists (end time < start time)
        const aIsOvernight = timeToMinutes(a.end) <= timeToMinutes(a.start);
        const bIsOvernight = timeToMinutes(b.end) <= timeToMinutes(b.start);
        
        if (aIsOvernight && !bIsOvernight) return 1;
        if (!aIsOvernight && bIsOvernight) return -1;
        
        return timeToMinutes(a.start) - timeToMinutes(b.start) || (a.order - b.order);
      });
  }
  
  // Update order to match current sort
  sortedPlaylists.forEach((playlist, index) => {
    playlist.order = index;
  });
  
  sortedPlaylists.forEach((p, i) => {
    const startMin = timeToMinutes(p.start);
    const endMin = timeToMinutes(p.end);
    let duration = endMin - startMin;
    
    // Handle overnight playlists (end time is next day)
    if (endMin < startMin) {
      duration = (24 * 60 - startMin) + endMin;
    }
    
    const durationStr = formatDuration(duration);

    // Overlap with previous programme
    const prev = sortedPlaylists[i-1];
    let overlap = 0;
    if (prev) {
      const prevEnd = timeToMinutes(prev.end);
      overlap = Math.max(0, prevEnd - startMin);
      
      // Handle overnight playlists for overlap calculation
      if (prevEnd < timeToMinutes(prev.start)) {
        // Previous playlist ends the next day
        overlap = Math.max(0, (24 * 60 - timeToMinutes(prev.start)) + timeToMinutes(p.start));
      }
    }
    
    const overlapStr = formatDuration(overlap);
    const weight = p.weight || 3; // Default weight if not set
    
    // Check if overnight (end < start)
    const isOvernight = timeToMinutes(p.end) < timeToMinutes(p.start);
    const overnightClass = isOvernight ? 'overnight-playlist' : '';
    const overnightLabel = isOvernight ? ' (overnight)' : '';
    
    const row = `
      <tr data-id="${p.id}" class="${overnightClass}">
        <td><input type="text" class="playlist-name" value="${escapeHtml(p.name)}" placeholder="Playlist name"></td>
        <td><input type="text" class="playlist-description" value="${escapeHtml(p.description || '')}" placeholder="Description (shown on schedule page)"></td>
        <td class="time-cell">
          <div class="time-control">
            <div class="time-control-group">
              <button type="button" class="time-btn dec" title="15 minutes earlier">-</button>
              <input type="time" class="time-start" value="${p.start}" step="900" list="time-options" 
                     title="Start time${overnightLabel}" data-format="${use12HourFormat ? '12' : '24'}">
              <button type="button" class="time-btn inc" title="15 minutes later">+</button>
            </div>
            ${use12HourFormat ? `<div class="time-12h">${format12h(p.start)}</div>` : ''}
          </div>
        </td>
        <td class="time-cell">
          <div class="time-control">
            <div class="time-control-group">
              <button type="button" class="time-btn dec" title="15 minutes earlier">-</button>
              <input type="time" class="time-end" value="${p.end}" step="900" list="time-options" 
                     title="End time${overnightLabel}" data-format="${use12HourFormat ? '12' : '24'}">
              <button type="button" class="time-btn inc" title="15 minutes later">+</button>
            </div>
            ${use12HourFormat ? `<div class="time-12h">${format12h(p.end)}${isOvernight ? ' (+1 day)' : ''}</div>` : ''}
          </div>
        </td>
        <td>
          <div class="weight-control">
            <button type="button" class="weight-btn weight-dec" title="Decrease weight">-</button>
            <input type="number" class="weight-input" min="1" max="25" value="${Math.min(25, Math.max(1, p.weight || 10))}">
            <button type="button" class="weight-btn weight-inc" title="Increase weight">+</button>
          </div>
        </td>
        <td>
          <button type="button" class="btn delete-playlist" title="Delete playlist">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.append(row);
  });
  
  // Save to localStorage after rendering
  saveToLocalStorage();

  /* ---------- Event listeners (re‑bind after every render) ---------- */

  // Playlist name changes
  $(".playlist-name").off('change').on('change', function() {
    const id = $(this).closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(x => x.id === id);
    if (playlist) {
      playlist.name = $(this).val();
      saveToLocalStorage();
    }
  });
  
  // Playlist description changes
  $(".playlist-description").off('change').on('change', function() {
    const id = $(this).closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(x => x.id === id);
    if (playlist) {
      playlist.description = $(this).val();
      saveToLocalStorage();
    }
  });

  // Time input handling - use blur instead of change to allow free typing
  $(".time-start, .time-end").off('blur change').on('blur change', function() {
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const field = $(this).hasClass('time-start') ? 'start' : 'end';
    const playlist = currentSchedule.playlists.find(x => x.id === id);
    
    if (playlist) {
      let timeValue = $(this).val();
      
      // Validate and format time input
      // If user typed something like "9:30" or "930", convert to "09:30"
      if (timeValue && !timeValue.match(/^\d{2}:\d{2}$/)) {
        // Try to parse various formats
        const cleaned = timeValue.replace(/[^\d]/g, '');
        if (cleaned.length >= 3) {
          const hours = parseInt(cleaned.substring(0, cleaned.length - 2)) || 0;
          const mins = parseInt(cleaned.substring(cleaned.length - 2)) || 0;
          if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
            timeValue = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
            $(this).val(timeValue);
          }
        }
      }
      
      // Only update if valid time format
      if (timeValue.match(/^\d{2}:\d{2}$/)) {
        playlist[field] = timeValue;
        
        // Auto-adjust end time if it's before start time (for the same day)
        if (field === 'start' && timeToMinutes(playlist.end) < timeToMinutes(playlist.start)) {
          playlist.end = playlist.start;
          tr.find('.time-end').val(playlist.end);
        }
        
        // Update the display
        tr.find(`.${field}-12h`).text(format12h(playlist[field]));
        saveToLocalStorage();
        renderSchedule();
      } else {
        // Invalid format, restore previous value
        $(this).val(playlist[field]);
      }
    }
  });
  
  // Allow typing without immediate validation
  $(".time-start, .time-end").off('input').on('input', function() {
    // Just allow typing, validation happens on blur
  });

  // ▲ / ▼ arrow helpers (15‑min steps) - weight controls handled separately
  $(".time-btn.inc, .time-btn.dec").off('click').on('click', function() {
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const playlist = currentSchedule.playlists.find(x => x.id === id);
    if (!playlist) return;
    
    // Handle time adjustment
    const input = $(this).siblings('input');
    const isStart = input.hasClass('time-start');
    const isInc = $(this).hasClass('inc');
    const field = isStart ? 'start' : 'end';
    
    let minutes = timeToMinutes(playlist[field]);
    minutes += isInc ? 15 : -15;
    
    // Handle day wrap-around
    if (minutes >= 24 * 60) minutes = 0;
    if (minutes < 0) minutes = 23 * 60 + 45; // 23:45
    
    playlist[field] = minutesToTime(minutes);
    input.val(playlist[field]);
    
    // Auto-adjust end time if it's before start time
    if (!isStart && timeToMinutes(playlist.end) < timeToMinutes(playlist.start)) {
      playlist.end = playlist.start;
      tr.find('.time-end').val(playlist.end);
    }
    
    saveToLocalStorage();
    renderSchedule();
  });

  // Weight input changes
  $(".weight-input").off('change').on('change', function() {
    const id = $(this).closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(x => x.id === id);
    if (playlist) {
      let weight = parseInt($(this).val(), 10);
      weight = Math.min(25, Math.max(1, isNaN(weight) ? 3 : weight));
      playlist.weight = weight;
      $(this).val(weight);
      saveToLocalStorage();
      
      // If sorted by weight, re-render to update order
      const sortBy = $('#sort-by').val();
      if (sortBy === 'weight' || sortBy === 'weight-asc') {
        renderSchedule();
      }
    }
  });

  // Move-up / move-down arrows
  $(".move-up, .move-down").off('click').on('click', function() {
    const tr = $(this).closest('tr');
    const idx = tr.index();
    const isUp = $(this).hasClass('move-up');
    
    if ((isUp && idx === 0) || (!isUp && idx === currentSchedule.playlists.length - 1)) return;
    
    const id = tr.data('id');
    const current = currentSchedule.playlists.find(item => item.id === id);
    const targetIdx = isUp ? idx - 1 : idx + 1;
    const targetId = $(`#schedule tbody tr`).eq(targetIdx).data('id');
    const targetPlaylist = currentSchedule.playlists.find(x => x.id === targetId);
    
    if (current && targetPlaylist) {
      // Swap orders
      [current.order, targetPlaylist.order] = [targetPlaylist.order, current.order];
      saveToLocalStorage();
      renderSchedule();
    }
  });

  // Add row after this row
  $(".add-row").off('click').on('click', function() {
    const tr = $(this).closest('tr');
    const currentPlaylist = currentSchedule.playlists.find(p => p.id === tr.data('id'));
    
    if (currentPlaylist) {
      // Calculate default end time (30 minutes after start)
      const startTime = timeToMinutes(currentPlaylist.start);
      const defaultEndTime = (startTime + 30) % (24 * 60);
      
      const newPlaylist = {
        id: nextId++,
        name: "New Playlist",
        description: '',
        start: currentPlaylist.start,
        end: minutesToTime(defaultEndTime),
        weight: 10, // Default weight to 10 (middle of 1-25)
        order: currentPlaylist.order + 1
      };
      
      // Update orders of subsequent playlists
      currentSchedule.playlists.forEach(p => { 
        if (p.order > currentPlaylist.order) p.order++;
      });
      
      currentSchedule.playlists.push(newPlaylist);
      saveToLocalStorage();
      renderSchedule();
      
      // Focus the new playlist's name input
      $(`tr[data-id="${newPlaylist.id}"] .playlist-name`).focus().select();
    }
  });

  // Delete this row
  $(".delete-row").off('click').on('click', function() {
    if (currentSchedule.playlists.length <= 1) {
      alert('You must have at least one playlist in the schedule.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this playlist?')) {
      const tr = $(this).closest('tr');
      const id = tr.data('id');
      const playlistToDelete = currentSchedule.playlists.find(p => p.id === id);
      
      if (playlistToDelete) {
        // Update orders of subsequent playlists
        currentSchedule.playlists.forEach(p => {
          if (p.order > playlistToDelete.order) p.order--;
        });
        
        // Remove the playlist
        currentSchedule.playlists = currentSchedule.playlists.filter(p => p.id !== id);
        saveToLocalStorage();
        renderSchedule();
      }
    }
  });
}

// Initialize the application when the DOM is ready
$(document).ready(function() {
  // Add hidden file input for imports
  $('body').append('<input type="file" id="file-input" accept=".json" style="display: none;">');
  
  // Initialize data and event listeners
  initializeData();
  setupEventListeners();
  
  // Make table rows sortable
  $("#schedule tbody").sortable({
    items: "tr:not(.ui-sortable-helper)",
    update: function() {
      // Update the order of playlists when dragged
      const newOrder = [];
      $("#schedule tbody tr").each(function(index) {
        const id = $(this).data('id');
        const playlist = currentSchedule.playlists.find(p => p.id === id);
        if (playlist) {
          playlist.order = index;
          newOrder.push(playlist);
        }
      });
      currentSchedule.playlists = newOrder;
      saveToLocalStorage();
      renderSchedule();
    },
    handle: 'td:not(:last-child)',
    helper: 'clone',
    opacity: 0.8,
    cursor: 'move',
    placeholder: 'sortable-placeholder',
    forcePlaceholderSize: true
  }).disableSelection();
  
  // Try to load Radio-Schedule.json as default
  loadDefaultSchedule();
});

// Load default schedule from Radio-Schedule.json
function loadDefaultSchedule() {
  fetch('Radio-Schedule.json')
    .then(response => {
      if (!response.ok) return null;
      return response.json();
    })
    .then(data => {
      if (data && data.schedule && Array.isArray(data.schedule)) {
        // Convert old format to new format
        const playlists = data.schedule.map((item, index) => ({
          id: index + 1,
          name: item.show || item.name || 'Untitled Playlist',
          start: item.start || '00:00',
          end: item.end || '01:00',
          weight: 10,
          order: index
        }));
        
        // Only use if we don't have existing data
        if (currentSchedule.playlists.length === 0) {
          currentSchedule.name = 'Radio Schedule';
          currentSchedule.days = (data.days || []).map(d => d.toLowerCase());
          currentSchedule.playlists = playlists;
          nextId = playlists.length + 1;
          
          // Update UI
          $('#schedule-name').val(currentSchedule.name);
          $('input[name="days"]').each(function() {
            const day = $(this).val();
            $(this).prop('checked', currentSchedule.days.includes(day));
          });
          
          renderSchedule();
          updateActiveSelections();
        }
      }
    })
    .catch(error => {
      console.log('No default schedule found or error loading:', error);
    });
}

let isAddingPlaylist = false; // Guard to prevent double-add

function addNewPlaylist() {
  if (isAddingPlaylist) return; // Prevent double calls
  isAddingPlaylist = true;
  
  // Calculate default start time (end of last playlist or 06:00)
  let startTime = '06:00';
  if (currentSchedule.playlists.length > 0) {
    const lastPlaylist = [...currentSchedule.playlists].sort((a, b) => b.order - a.order)[0];
    if (lastPlaylist && lastPlaylist.end) {
      startTime = lastPlaylist.end;
    }
  }
  
  // Calculate default end time (1 hour after start)
  const endTime = minutesToTime((timeToMinutes(startTime) + 60) % (24 * 60));
  
  const newPlaylist = {
    id: nextId++,
    name: 'New Playlist',
    description: '',
    start: startTime,
    end: endTime,
    weight: 10,
    order: currentSchedule.playlists.length
  };
  
  currentSchedule.playlists.push(newPlaylist);
  saveToLocalStorage();
  renderSchedule();
  
  // Scroll to the new row and focus the name input
  setTimeout(() => {
    const newRow = $(`tr[data-id="${newPlaylist.id}"]`);
    if (newRow.length) {
      $('html, body').animate({
        scrollTop: newRow.offset().top - 100
      }, 100);
      newRow.find('.playlist-name').focus().select();
    }
    isAddingPlaylist = false; // Reset guard
  }, 100);
}
