/* ──── Radio Schedule Planner ──── */

// Global state
let nextId = 1;
let use12HourFormat = true; // Default to 12hr format

// Time format conversion utilities
const TimeUtils = {
  // Parse 12h time string to minutes since midnight
  parse12hTime: function(timeStr) {
    if (!timeStr) return 0;
    
    const match = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*([ap]m?)?$/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const period = (match[3] || '').toLowerCase();
    
    // Convert to 24h
    if (period.includes('p') && hours < 12) hours += 12;
    if (period.includes('a') && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  },
  
  // Format minutes since midnight to 12h time string
  format12h: function(minutes) {
    if (minutes === null || minutes === undefined) return '';
    
    let hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12h format
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM
    
    return `${hours}:${mins.toString().padStart(2, '0')} ${period}`;
  },
  
  // Format minutes since midnight to 24h time string
  format24h: function(minutes) {
    if (minutes === null || minutes === undefined) return '';
    
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },
  
  // Parse time input (supports both 12h and 24h formats)
  parseTimeInput: function(input, is12h) {
    if (!input) return null;
    
    // Try parsing as 12h format if enabled
    if (is12h) {
      const minutes12h = this.parse12hTime(input);
      if (minutes12h !== null) return minutes12h;
    }
    
    // Try parsing as 24h format
    const match24h = input.match(/^(\d{1,2}):?(\d{2})?$/);
    if (match24h) {
      let hours = parseInt(match24h[1]) || 0;
      const minutes = parseInt(match24h[2]) || 0;
      return (hours * 60 + minutes) % (24 * 60); // Ensure within 24h
    }
    
    return null; // Invalid format
  },
  
  // Format time for display based on current format preference
  formatTimeForDisplay: function(minutes, force24h = false) {
    if (minutes === null || minutes === undefined) return '';
    return (use12HourFormat && !force24h) ? this.format12h(minutes) : this.format24h(minutes);
  }
};
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
  if (minutes === null || minutes === undefined) return '';
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

// Time formatting functions now handled by TimeUtils

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
  // Time format toggle
  $('input[name="time-format"]').on('change', function() {
    use12HourFormat = $(this).val() === '12';
    localStorage.setItem('use12HourFormat', use12HourFormat);
    // Re-render the schedule to update all time displays
    renderSchedule();
  });
  
  // Load saved time format preference
  const savedFormat = localStorage.getItem('use12HourFormat');
  if (savedFormat !== null) {
    use12HourFormat = savedFormat === 'true';
    $(`input[name="time-format"][value="${use12HourFormat ? '12' : '24'}"]`).prop('checked', true);
  }
  
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
  
  // Time input handling
  $(document).on('change', 'input[type="time"]', function() {
    const $input = $(this);
    const id = $input.closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(p => p.id === id);
    if (!playlist) return;

    // Always parse as 24h since we're using native time input
    let time24 = $input.val();
    
    // Convert to 24h format if needed
    if (use12HourFormat) {
      time24 = TimeUtils.parseTimeInput(time24, true);
    }
    
    if ($input.hasClass('time-start')) {
      playlist.start = time24;
    } else if ($input.hasClass('time-end')) {
      playlist.end = time24;
    }
    
    saveToLocalStorage();
    // Update just the time display without full re-render
    updateTimeDisplays();
  });
  
  // Update time displays without re-rendering the whole schedule
  function updateTimeDisplays() {
    $('input[type="time"]').each(function() {
      const $input = $(this);
      const id = $input.closest('tr').data('id');
      const playlist = currentSchedule.playlists.find(p => p.id === id);
      if (!playlist) return;
      
      const time24 = $input.hasClass('time-start') ? playlist.start : playlist.end;
      
      // Update the input value
      $input.val(time24);
      
      // Update the display below
      const $display = $input.closest('.time-control').find('.time-format-display');
      if ($display.length) {
        $display.text(use12HourFormat ? TimeUtils.format12h(time24) : time24);
      }
    });
  }
  
  // Handle weight changes
  $(document).on('change', '.weight-input', function() {
    const id = $(this).closest('tr').data('id');
    const playlist = currentSchedule.playlists.find(p => p.id === id);
    if (playlist) {
      let weight = parseInt($(this).val()) || 5;
      weight = Math.min(25, Math.max(1, weight));
      playlist.weight = weight;
      $(this).val(weight);
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
          <div class="time-display">
            <input type="time" class="time-picker" value="${p.start}">
            <div class="time-format-display">${TimeUtils.format12h(p.start)}</div>
          </div>
        </td>
        <td class="time-cell">
          <div class="time-display">
            <input type="time" class="time-picker" value="${p.end}">
            <div class="time-format-display">${TimeUtils.format12h(p.end)}</div>
          </div>
        </td>
        <td class="weight-cell">
          <input type="number" class="weight-input" min="1" max="25" value="${Math.min(25, Math.max(1, p.weight || 10))}" onchange="this.value = Math.min(25, Math.max(1, parseInt(this.value) || 1));">
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

  // Update time displays based on current format
  $('.time-format-display').each(function() {
    const $display = $(this);
    const time24 = $display.siblings('.time-picker').val();
    if (time24) {
      $display.text(use12HourFormat ? TimeUtils.format12h(time24) : time24);
    }
  });

  // Initialize time pickers
  $('.time-picker').each(function() {
    const $input = $(this);
    const time24 = $input.val();
    if (time24) {
      $input.val(time24);
      // Update the display
      $input.siblings('.time-format-display').text(
        use12HourFormat ? TimeUtils.format12h(time24) : time24
      );
    }
    
    $input.off('change').on('change', function() {
      const tr = $(this).closest('tr');
      const id = tr.data('id');
      const playlist = currentSchedule.playlists.find(x => x.id === id);
      if (!playlist) return;

      const time24 = $(this).val();
      if (time24) {
        if ($(this).hasClass('time-start')) {
          playlist.start = time24;
        } else {
          playlist.end = time24;
        }
        // Update the display
        $(this).siblings('.time-format-display').text(
          use12HourFormat ? TimeUtils.format12h(time24) : time24
        );
        saveToLocalStorage();
      }
    });
  });

  // ... (rest of the code remains the same)

  // Remove any existing drag handles
  $('.drag-handle').remove();
  
  // Load default schedule
  loadDefaultSchedule().then(response => {
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
