/* ──── Schedule table – Enhanced with Load/Save, Weights, and Sorting ──── */

/* ---------- Data & State ------------------------------- */
let nextId = 1;
let currentSchedule = {
  id: 'default',
  name: 'My Schedule',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  holidays: [],
  shows: []
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

// Initialize with default data if localStorage is empty
function initializeData() {
  const defaultShows = [
    {id:1, name:"The Morning Coffee Mix", start:"06:00", end:"10:30", weight: 5, order: 0},
    {id:2, name:"Acid Trip, Psychedelic Sounds", start:"09:30", end:"13:30", weight: 4, order: 1},
    {id:3, name:"Cloud Pants, Ethereal Soundscapes", start:"12:15", end:"15:15", weight: 3, order: 2},
    {id:4, name:"ZamDelic Trance, Psychedelic Trance", start:"14:00", end:"17:00", weight: 4, order: 3},
    {id:5, name:"Blues in Every Tongue", start:"15:45", end:"18:00", weight: 3, order: 4},
    {id:6, name:"The Funky Truth, Funk Grooves", start:"16:45", end:"19:00", weight: 4, order: 5},
    {id:7, name:"Afrobeat Legacy", start:"18:00", end:"21:30", weight: 5, order: 6},
    {id:8, name:"Zamrock Rising", start:"20:00", end:"22:00", weight: 4, order: 7},
    {id:9, name:"ZamRock Classics", start:"20:45", end:"22:00", weight: 5, order: 8},
    {id:10, name:"Artist of the Month", start:"21:30", end:"22:00", weight: 4, order: 9}
  ];
  
  // Initialize holiday select dropdown
  const holidaySelect = $('#holiday-select');
  holidaySelect.empty().append('<option value="">Add Holiday...</option>');
  HOLIDAYS.forEach(holiday => {
    holidaySelect.append(`<option value="${holiday.id}">${holiday.name}</option>`);
  });

  // Try to load from localStorage
  const savedSchedule = localStorage.getItem('radioSchedule');
  if (savedSchedule) {
    try {
      const parsed = JSON.parse(savedSchedule);
      currentSchedule = {
        ...currentSchedule,
        ...parsed,
        days: Array.isArray(parsed.days) ? parsed.days : [],
        holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
        shows: Array.isArray(parsed.shows) ? parsed.shows : []
      };
      
      // Update nextId based on existing shows
      if (currentSchedule.shows.length > 0) {
        nextId = Math.max(...currentSchedule.shows.map(s => s.id || 0), 0) + 1;
      }
    } catch (e) {
      console.error('Error loading schedule:', e);
      showNotification('Error loading saved schedule. Creating a new one.', 'error');
    }
  }
  
  // Initialize UI
  updateScheduleUI();
  renderSchedule();
  
  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Day checkboxes
  $('input[name="days"]').on('change', function() {
    updateActiveDays();
    saveToLocalStorage();
  });
  
  // Add holiday button
  $('#add-holiday').on('click', addHoliday);
  
  // Remove holiday tag
  $(document).on('click', '.remove-tag', function() {
    const type = $(this).data('type');
    const value = $(this).data('value');
    
    if (type === 'day') {
      $(`input[name="days"][value="${value}"]`).prop('checked', false);
      updateActiveDays();
    } else if (type === 'holiday') {
      currentSchedule.holidays = currentSchedule.holidays.filter(h => h !== value);
      updateScheduleUI();
      saveToLocalStorage();
    }
  });
  
  // Schedule name
  $('#schedule-name').on('change', function() {
    currentSchedule.name = $(this).val().trim() || 'Untitled Schedule';
    saveToLocalStorage();
  });
  
  // File operations
  $('#load-schedule').on('click', triggerFileInput);
  $('#export-json').on('click', exportSchedule);
  $('#new-schedule').on('click', createNewSchedule);
  
  // Sort by dropdown
  $('#sort-by').on('change', renderSchedule);
  
  // Add show button
  $('#add-show').on('click', addNewShow);
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

// Update active selections (days and holidays)
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
}

function updateActiveDaysDisplay() {
  const container = $('#active-days-display');
  const days = currentSchedule.days.map(day => 
    `<span class="day-tag">${day.charAt(0).toUpperCase() + day.slice(1)}</span>`
  );
  
  const holidays = currentSchedule.holidays.map(holidayId => {
    const holiday = HOLIDAYS.find(h => h.id === holidayId) || { id: holidayId, name: holidayId };
    return `<span class="holiday-tag">${holiday.name}</span>`;
  });
  
  if (days.length === 0 && holidays.length === 0) {
    container.html('Active for: <span class="no-days">No days selected</span>');
  } else {
    container.html('Active for: ' + [...days, ...holidays].join(' '));
  }
}

function triggerFileInput() {
  const fileInput = $('<input type="file" accept=".json" style="display: none;">');
  
  fileInput.on('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      loadScheduleFromFile(file);
    }
  });
  
  fileInput.trigger('click');
}

function loadScheduleFromFile(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Handle different file formats
      if (Array.isArray(data)) {
        // Simple array format - just shows
        currentSchedule = {
          ...currentSchedule,
          shows: data.map(show => ({
            id: show.id || nextId++,
            name: show.name || 'Untitled Show',
            start: show.start || '00:00',
            end: show.end || '01:00',
            weight: Math.min(25, Math.max(1, parseInt(show.weight, 10) || 10)),
            order: show.order || 0
          }))
        };
      } else if (data.shows || data.schedule) {
        // Full schedule format with days and holidays, or legacy format
        currentSchedule = {
          id: data.id || 'schedule-' + Date.now(),
          name: data.name || 'Imported Schedule',
          days: Array.isArray(data.days) ? data.days : [],
          holidays: Array.isArray(data.holidays) ? data.holidays : [],
          shows: (Array.isArray(data.shows) ? data.shows : 
                 (Array.isArray(data.schedule) ? data.schedule : [])).map((item, index) => ({
            id: item.id || nextId++,
            name: item.show || item.name || `Show ${index + 1}`,
            start: item.start || '00:00',
            end: item.end || '01:00',
            weight: Math.min(25, Math.max(1, parseInt(item.weight, 10) || 10)),
            order: item.order || index
          }))
        };
      } else {
        throw new Error('Unsupported file format');
      }
      
      // Update nextId to be higher than any existing ID
      if (currentSchedule.shows && currentSchedule.shows.length > 0) {
        nextId = Math.max(...currentSchedule.shows.map(s => s.id || 0), 0) + 1;
      } else {
        nextId = 1;
        currentSchedule.shows = [];
      }
      
      // Ensure days and holidays are valid arrays
      if (!Array.isArray(currentSchedule.days)) currentSchedule.days = [];
      if (!Array.isArray(currentSchedule.holidays)) currentSchedule.holidays = [];
      
      // Update UI and save
      updateScheduleUI();
      renderSchedule();
      saveToLocalStorage();
      
      showNotification(`Loaded schedule "${currentSchedule.name}" with ${currentSchedule.shows.length} shows`, 'success');
      
    } catch (error) {
      console.error('Error parsing schedule file:', error);
      showNotification(`Error loading file: ${error.message}`, 'error');
    }
  };
  
  reader.onerror = function() {
    showNotification('Error reading file. Please try again.', 'error');
  };
  
  try {
    reader.readAsText(file);
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
}

function exportSchedule() {
  try {
    // Update shows from UI before exporting
    updateShowsFromUI();
    
    // Create a clean export object
    const exportData = {
      id: currentSchedule.id || 'schedule-' + Date.now(),
      name: currentSchedule.name || 'Untitled Schedule',
      days: [...currentSchedule.days],
      holidays: [...currentSchedule.holidays],
      lastUpdated: new Date().toISOString(),
      shows: currentSchedule.shows.map(show => ({
        id: show.id,
        name: show.name,
        start: show.start,
        end: show.end,
        weight: show.weight,
        order: show.order
      }))
    };
    
    // Generate filename based on schedule name and active days/holidays
    let filename = (currentSchedule.name || 'schedule').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Add active days to filename if any
    if (currentSchedule.days.length > 0) {
      filename += '-' + currentSchedule.days.join('-');
    }
    
    // Add first holiday to filename if any
    if (currentSchedule.holidays.length > 0) {
      filename += '-' + currentSchedule.holidays[0];
      if (currentSchedule.holidays.length > 1) {
        filename += `-and-${currentSchedule.holidays.length - 1}-more`;
      }
    }
    
    filename += '.json';
    
    // Create and trigger download
    const dataStr = 'data:text/json;charset=utf-8,' + 
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
    
    showNotification(`Exported "${currentSchedule.name}" successfully!`, 'success');
    
  } catch (error) {
    console.error('Error exporting schedule:', error);
    showNotification(`Error exporting schedule: ${error.message}`, 'error');
  }
}

function addNewShow() {
  // Calculate default start time (end of last show or 00:00)
  let startTime = '00:00';
  if (currentSchedule.shows.length > 0) {
    const lastShow = [...currentSchedule.shows].sort((a, b) => b.order - a.order)[0];
    if (lastShow) {
      const endTime = timeToMinutes(lastShow.end);
      startTime = minutesToTime(endTime);
    }
  }
  
  // Calculate default end time (1 hour after start)
  const endTime = minutesToTime((timeToMinutes(startTime) + 60) % (24 * 60));
  
  const newShow = {
    id: nextId++,
    name: 'New Show',
    start: startTime,
    end: endTime,
    weight: 10,
    order: currentSchedule.shows.length
  };
  
  currentSchedule.shows.push(newShow);
  saveToLocalStorage();
  renderSchedule();
  
  // Scroll to the new row and focus the name input
  const newRow = $(`tr[data-id="${newShow.id}"]`);
  if (newRow.length) {
    $('html, body').animate({
      scrollTop: newRow.offset().top - 100
    }, 500);
    newRow.find('.show-name').focus().select();
  }
  
  return newShow;
}

/* ---------- Render ------------------------------- */
function renderSchedule() {
  const tbody = $('#schedule tbody');
  tbody.empty();
  
  // Update shows from UI before rendering
  updateShowsFromUI();
  
  // Sort shows based on current sort option
  const sortBy = $('#sort-by').val();
  let sortedShows = [...currentSchedule.shows];
  
  switch (sortBy) {
    case 'weight':
      sortedShows.sort((a, b) => (b.weight || 0) - (a.weight || 0));
      break;
    case 'weight-asc':
      sortedShows.sort((a, b) => (a.weight || 0) - (b.weight || 0));
      break;
    default: // 'start'
      sortedShows.sort((a, b) => {
        // Handle overnight shows (end time < start time)
        const aIsOvernight = timeToMinutes(a.end) <= timeToMinutes(a.start);
        const bIsOvernight = timeToMinutes(b.end) <= timeToMinutes(b.start);
        
        if (aIsOvernight && !bIsOvernight) return 1;
        if (!aIsOvernight && bIsOvernight) return -1;
        
        return timeToMinutes(a.start) - timeToMinutes(b.start) || (a.order - b.order);
      });
  }
  
  // Update order to match current sort
  sortedShows.forEach((show, index) => {
    show.order = index;
  });
  
  sortedShows.forEach((s, i) => {
    const startMin = timeToMinutes(s.start);
    const endMin = timeToMinutes(s.end);
    let duration = endMin - startMin;
    
    // Handle overnight shows (end time is next day)
    if (endMin < startMin) {
      duration = (24 * 60 - startMin) + endMin;
    }
    
    const durationStr = formatDuration(duration);

    // Overlap with previous programme
    const prev = sortedShows[i-1];
    let overlap = 0;
    if (prev) {
      const prevEnd = timeToMinutes(prev.end);
      overlap = Math.max(0, prevEnd - startMin);
      
      // Handle overnight shows for overlap calculation
      if (prevEnd < timeToMinutes(prev.start)) {
        // Previous show ends the next day
        overlap = Math.max(0, (24 * 60 - timeToMinutes(prev.start)) + timeToMinutes(s.start));
      }
    }
    
    const overlapStr = formatDuration(overlap);
    const weight = s.weight || 3; // Default weight if not set
    
    const tr = $("<tr>").attr("data-id", s.id);
    tr.append($("<td>").text(i + 1));
    tr.append($("<td>").html('<div class="move-controls"><button class="move-up" title="Move up">▲</button><button class="move-down" title="Move down">▼</button></div>'));
    
    // Show name column (editable)
    const nameCell = $("<td>").append(
      $("<input>").attr({
        type: "text",
        class: "show-name",
        value: s.name
      })
    );
    tr.append(nameCell);

    // Start column
    tr.append($("<td>").html(`
      <input type="time" class="time-input start" value="${s.start}">
      <span class="time-12h start-12h">${format12h(s.start)}</span>
      <div class="time-controls"><button class="dec start-dec" title="Decrease time">▼</button><button class="inc start-inc" title="Increase time">▲</button></div>
    `));

    // End column
    tr.append($("<td>").html(`
      <input type="time" class="time-input end" value="${s.end}">
      <span class="time-12h end-12h">${format12h(s.end)}</span>
      <div class="time-controls"><button class="dec end-dec" title="Decrease time">▼</button><button class="inc end-inc" title="Increase time">▲</button></div>
    `));

    tr.append($("<td>").text(durationStr));
    
    // Weight column
    tr.append($("<td>").html(`
      <input type="number" class="weight-input" value="${weight}" min="1" max="25">
      <div class="weight-controls">
        <button class="weight-dec" title="Decrease weight">-</button>
        <button class="weight-inc" title="Increase weight">+</button>
      </div>
    `));
    
    tr.append($("<td>").text(overlapStr));
    
    // Actions column
    tr.append($("<td class=\"actions\">").html(`
      <button class="add-row" title="Add row below">+</button>
      <button class="delete-row" title="Delete row">🗑️</button>
    `));
    
    tbody.append(tr);
  });
  
  // Save to localStorage after rendering
  saveToLocalStorage();

  /* ---------- Event listeners (re‑bind after every render) ---------- */

  // Show name changes
  $(".show-name").off('change').on('change', function() {
    const id = $(this).closest('tr').data('id');
    const show = currentSchedule.shows.find(x => x.id === id);
    if (show) {
      show.name = $(this).val();
      saveToLocalStorage();
    }
  });

  // 24‑hr → 12‑hr updates
  $(".time-input").off('change').on('change', function() {
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const field = $(this).hasClass('start') ? 'start' : 'end';
    const show = currentSchedule.shows.find(x => x.id === id);
    
    if (show) {
      show[field] = $(this).val();
      
      // Auto-adjust end time if it's before start time (for the same day)
      if (field === 'start' && timeToMinutes(show.end) < timeToMinutes(show.start)) {
        show.end = show.start;
      }
      
      // Update the display
      tr.find(`.${field}-12h`).text(format12h(show[field]));
      saveToLocalStorage();
      renderSchedule();
    }
  });

  // ▲ / ▼ arrow helpers (30‑min steps) and weight controls
  $(".inc, .dec, .weight-inc, .weight-dec").off('click').on('click', function() {
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const show = currentSchedule.shows.find(x => x.id === id);
    if (!show) return;
    
    const isStart = $(this).hasClass('start-inc') || $(this).hasClass('start-dec');
    const isInc = $(this).hasClass('inc') || $(this).hasClass('weight-inc');
    const isWeight = $(this).hasClass('weight-inc') || $(this).hasClass('weight-dec');
    
    if (isWeight) {
      // Handle weight adjustment
      show.weight = Math.min(25, Math.max(1, (show.weight || 3) + (isInc ? 1 : -1)));
      tr.find('.weight-input').val(show.weight);
    } else {
      // Handle time adjustment
      const field = isStart ? 'start' : 'end';
      let minutes = timeToMinutes(show[field]);
      minutes += isInc ? 30 : -30;
      
      // Handle day wrap-around
      if (minutes >= 24 * 60) minutes = 0;
      if (minutes < 0) minutes = 23 * 60 + 30; // 23:30
      
      show[field] = minutesToTime(minutes);
      
      // Update the display
      tr.find(`.time-input.${field}`).val(show[field]);
      tr.find(`.${field}-12h`).text(format12h(show[field]));
      
      // Auto-adjust end time if it's before start time
      if (!isStart && timeToMinutes(show.end) < timeToMinutes(show.start)) {
        show.end = show.start;
        tr.find('.time-input.end').val(show.end);
        tr.find('.end-12h').text(format12h(show.end));
      }
    }
    
    saveToLocalStorage();
    renderSchedule();
  });

  // Weight input changes
  $(".weight-input").off('change').on('change', function() {
    const id = $(this).closest('tr').data('id');
    const show = currentSchedule.shows.find(x => x.id === id);
    if (show) {
      let weight = parseInt($(this).val(), 10);
      weight = Math.min(25, Math.max(1, isNaN(weight) ? 3 : weight));
      show.weight = weight;
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
    
    if ((isUp && idx === 0) || (!isUp && idx === currentSchedule.shows.length - 1)) return;
    
    const id = tr.data('id');
    const current = currentSchedule.shows.find(x => x.id === id);
    const targetIdx = isUp ? idx - 1 : idx + 1;
    const targetId = $(`#schedule tbody tr`).eq(targetIdx).data('id');
    const targetShow = currentSchedule.shows.find(x => x.id === targetId);
    
    if (current && targetShow) {
      // Swap orders
      [current.order, targetShow.order] = [targetShow.order, current.order];
      saveToLocalStorage();
      renderSchedule();
    }
  });

  // Add row after this row
  $(".add-row").off('click').on('click', function() {
    const tr = $(this).closest('tr');
    const currentShow = currentSchedule.shows.find(s => s.id === tr.data('id'));
    
    if (currentShow) {
      // Calculate default end time (30 minutes after start)
      const startTime = timeToMinutes(currentShow.start);
      const defaultEndTime = (startTime + 30) % (24 * 60);
      
      const newShow = {
        id: nextId++,
        name: "New Show",
        start: currentShow.start,
        end: minutesToTime(defaultEndTime),
        weight: 10, // Default weight to 10 (middle of 1-25)
        order: currentShow.order + 1
      };
      
      // Update orders of subsequent shows
      currentSchedule.shows.forEach(s => { 
        if (s.order > currentShow.order) s.order++;
      });
      
      currentSchedule.shows.push(newShow);
      saveToLocalStorage();
      renderSchedule();
      
      // Focus the new show's name input
      $(`tr[data-id="${newShow.id}"] .show-name`).focus().select();
    }
  });

  // Delete this row
  $(".delete-row").off('click').on('click', function() {
    if (currentSchedule.shows.length <= 1) {
      alert('You must have at least one show in the schedule.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this show?')) {
      const tr = $(this).closest('tr');
      const id = tr.data('id');
      const showToDelete = currentSchedule.shows.find(s => s.id === id);
      
      if (showToDelete) {
        // Update orders of subsequent shows
        currentSchedule.shows.forEach(s => {
          if (s.order > showToDelete.order) s.order--;
        });
        
        // Remove the show
        currentSchedule.shows = currentSchedule.shows.filter(s => s.id !== id);
        saveToLocalStorage();
        renderSchedule();
      }
    }
  });
}

/* ---------- File Operations ------------------------------- */
function loadScheduleFromFile(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Handle different file formats
      if (Array.isArray(data)) {
        // Simple array format - just shows
        currentSchedule = {
          ...currentSchedule,
          shows: data.map(show => ({
            id: show.id || nextId++,
            name: show.name || 'Untitled Show',
            start: show.start || '00:00',
            end: show.end || '01:00',
            weight: Math.min(25, Math.max(1, parseInt(show.weight, 10) || 10)),
            order: show.order || 0
          }))
        };
      } else if (data.shows || data.schedule) {
        // Full schedule format with days and holidays, or legacy format
        currentSchedule = {
          id: data.id || 'schedule-' + Date.now(),
          name: data.name || 'Imported Schedule',
          days: Array.isArray(data.days) ? data.days : [],
          holidays: Array.isArray(data.holidays) ? data.holidays : [],
          shows: (Array.isArray(data.shows) ? data.shows : 
                 (Array.isArray(data.schedule) ? data.schedule : [])).map((item, index) => ({
            id: item.id || nextId++,
            name: item.show || item.name || `Show ${index + 1}`,
            start: item.start || '00:00',
            end: item.end || '01:00',
            weight: Math.min(25, Math.max(1, parseInt(item.weight, 10) || 10)),
            order: item.order || index
          }))
        };
      } else {
        throw new Error('Unsupported file format');
      }
      
      // Update nextId to be higher than any existing ID
      if (currentSchedule.shows && currentSchedule.shows.length > 0) {
        nextId = Math.max(...currentSchedule.shows.map(s => s.id || 0), 0) + 1;
      } else {
        nextId = 1;
        currentSchedule.shows = [];
      }
      
      // Ensure days and holidays are valid arrays
      if (!Array.isArray(currentSchedule.days)) currentSchedule.days = [];
      if (!Array.isArray(currentSchedule.holidays)) currentSchedule.holidays = [];
      
      // Update UI and save
      updateScheduleUI();
      renderSchedule();
      saveToLocalStorage();
      
      showNotification(`Loaded schedule "${currentSchedule.name}" with ${currentSchedule.shows.length} shows`, 'success');
      
    } catch (error) {
      console.error('Error parsing schedule file:', error);
      showNotification(`Error loading file: ${error.message}`, 'error');
    }
  };
  
  reader.onerror = function() {
    showNotification('Error reading file. Please try again.', 'error');
  };
  
  try {
    reader.readAsText(file);
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
}

function exportSchedule() {
  try {
    // Update shows from UI before exporting
    updateShowsFromUI();
    
    // Create a clean export object
    const exportData = {
      id: currentSchedule.id || 'schedule-' + Date.now(),
      name: currentSchedule.name || 'Untitled Schedule',
      days: [...currentSchedule.days],
      holidays: [...currentSchedule.holidays],
      lastUpdated: new Date().toISOString(),
      shows: currentSchedule.shows.map(show => ({
        id: show.id,
        name: show.name,
        start: show.start,
        end: show.end,
        weight: show.weight,
        order: show.order
      }))
    };
    
    // Generate filename based on schedule name and active days/holidays
    let filename = (currentSchedule.name || 'schedule').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Add active days to filename if any
    if (currentSchedule.days.length > 0) {
      filename += '-' + currentSchedule.days.join('-');
    }
    
    // Add first holiday to filename if any
    if (currentSchedule.holidays.length > 0) {
      filename += '-' + currentSchedule.holidays[0];
      if (currentSchedule.holidays.length > 1) {
        filename += `-and-${currentSchedule.holidays.length - 1}-more`;
      }
    }
    
    filename += '.json';
    
    // Create and trigger download
    const dataStr = 'data:text/json;charset=utf-8,' + 
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
    
    showNotification(`Exported "${currentSchedule.name}" successfully!`, 'success');
    
  } catch (error) {
    console.error('Error exporting schedule:', error);
    showNotification(`Error exporting schedule: ${error.message}`, 'error');
  }
}

function addNewShow() {
  // Calculate default start time (end of last show or 00:00)
  let startTime = '00:00';
  if (currentSchedule.shows.length > 0) {
    const lastShow = [...currentSchedule.shows].sort((a, b) => b.order - a.order)[0];
    if (lastShow) {
      const endTime = timeToMinutes(lastShow.end);
      startTime = minutesToTime(endTime);
    }
  }
  
  // Calculate default end time (1 hour after start)
  const endTime = minutesToTime((timeToMinutes(startTime) + 60) % (24 * 60));
  
  const newShow = {
    id: nextId++,
    name: 'New Show',
    start: startTime,
    end: endTime,
    weight: 10,
    order: currentSchedule.shows.length
  };
  
  currentSchedule.shows.push(newShow);
  saveToLocalStorage();
  renderSchedule();
  
  // Scroll to the new row and focus the name input
  const newRow = $(`tr[data-id="${newShow.id}"]`);
  if (newRow.length) {
    $('html, body').animate({
      scrollTop: newRow.offset().top - 100
    }, 500);
    newRow.find('.show-name').focus().select();
  }
  
  return newShow;
}

/* ---------- Initialization & Event Handlers ---------- */
$(function() {
  // Initialize data
  initializeData();
  
  // Set up jQuery UI sortable
  $("#schedule tbody").sortable({
    items: "tr",
    update: function(event, ui) {
      $(this).children('tr').each(function(idx) {
        const id = $(this).data('id');
        const show = currentSchedule.shows.find(item => item.id === id);
        if (show) show.order = idx;
      });
      saveToLocalStorage();
      renderSchedule();
    }
  }).disableSelection();

  // Day/Event selection
  $('#day-select').on('change', function() {
    const day = $(this).val();
    currentDay = day;
    
    if (day === '') {
      // Custom day/event
      $('#custom-day').show().focus();
      const customName = localStorage.getItem('customDayName') || '';
      if (customName) {
        $('#custom-day').val(customName);
      }
    } else {
      $('#custom-day').hide();
      // Load schedule for selected day
      const savedShows = localStorage.getItem(`schedule_${day}`);
      if (savedShows) {
        shows = JSON.parse(savedShows);
        nextId = Math.max(...shows.map(s => s.id), 0) + 1;
        renderSchedule();
      } else {
        // Create a new empty schedule for this day
        shows = [{
          id: 1,
          name: 'New Show',
          start: '00:00',
          end: '01:00',
          weight: 3,
          order: 0
        }];
        nextId = 2;
        renderSchedule();
      }
    }
    
    saveToLocalStorage();
  });
  
  // Custom day/event name input
  $('#custom-day').on('change keyup', function() {
    if (currentDay === '') {
      saveToLocalStorage();
    }
  });
  
  // Sort by selection
  $('#sort-by').on('change', function() {
    renderSchedule();
  });
  
  // Load schedule button
  $('#load-schedule').on('click', function() {
    // Create a file input element
    const fileInput = $('<input type="file" accept=".json" style="display: none;">');
    
    fileInput.on('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        loadScheduleFromFile(file);
      }
    });
    
    // Trigger the file dialog
    $('body').append(fileInput);
    fileInput.trigger('click');
    fileInput.remove();
  });
  
  // Save schedule button
  $('#save-schedule').on('click', function() {
    saveToLocalStorage();
    alert('Schedule saved!');
  });
  
  // New schedule button
  $('#new-schedule').on('click', createNewSchedule);
  
  // Export JSON button
  $('#export-json').on('click', exportSchedule);
  
  // Global "Add at End" button
  $("#add-at-end").on('click', function() {
    const last = currentSchedule.shows.length > 0 
      ? currentSchedule.shows[currentSchedule.shows.length - 1] 
      : { order: -1, end: '00:00' };
    
    // Calculate default end time (30 minutes after start)
    const endTime = timeToMinutes(last.end);
    const defaultEndTime = (endTime + 30) % (24 * 60);
    
    const newShow = {
      id: nextId++,
      name: "New Show",
      start: last.start,
      end: minutesToTime(defaultEndTime),
      weight: 10, // Default weight to 10 (middle of 1-25)
      order: currentSchedule.shows.length > 0 ? last.order + 1 : 0
    };
    
    // Update orders of subsequent shows
    currentSchedule.shows.forEach(s => { 
      if (s.order > last.order) s.order++;
    });
    
    currentSchedule.shows.push(newShow);
    saveToLocalStorage();
    renderSchedule();
    
    // Scroll to the new row and focus the name input
    const newRow = $(`tr[data-id="${newShow.id}"]`);
    $('html, body').animate({
      scrollTop: newRow.offset().top - 100
    }, 500);
    newRow.find('.show-name').focus().select();
  });
  
  // Initialize the UI
  if (currentDay === '') {
    $('#custom-day').show();
  }
  
  // Initial render
  renderSchedule();
});

/* ---------- Event listeners (re‑bind after every render) ---------- */

// Show name changes
$(".show-name").off('change').on('change', function() {
  const id = $(this).closest('tr').data('id');
  const show = shows.find(x => x.id === id);
  if (show) {
    show.name = $(this).val();
    saveToLocalStorage();
  }
});

// 24‑hr → 12‑hr updates
$(".time-input").off('change').on('change', function() {
  const tr = $(this).closest('tr');
  const id = tr.data('id');
  const field = $(this).hasClass('start') ? 'start' : 'end';
  const show = shows.find(x => x.id === id);
  
  if (show) {
    show[field] = $(this).val();
    
    // Auto-adjust end time if it's before start time (for the same day)
    if (field === 'start' && timeToMinutes(show.end) < timeToMinutes(show.start)) {
      show.end = show.start;
    }
    
    // Update the display
    tr.find(`.${field}-12h`).text(format12h(show[field]));
    saveToLocalStorage();
    renderSchedule();
  }
});

// ▲ / ▼ arrow helpers (30‑min steps) and weight controls
$(".inc, .dec, .weight-inc, .weight-dec").off('click').on('click', function() {
  const tr = $(this).closest('tr');
  const id = tr.data('id');
  const show = shows.find(x => x.id === id);
  if (!show) return;
  
  const isStart = $(this).hasClass('start-inc') || $(this).hasClass('start-dec');
  const isInc = $(this).hasClass('inc') || $(this).hasClass('weight-inc');
  const isWeight = $(this).hasClass('weight-inc') || $(this).hasClass('weight-dec');
  
  if (isWeight) {
    // Handle weight adjustment
    show.weight = Math.min(10, Math.max(1, (show.weight || 3) + (isInc ? 1 : -1)));
    tr.find('.weight-input').val(show.weight);
  } else {
    // Handle time adjustment
    const field = isStart ? 'start' : 'end';
    let minutes = timeToMinutes(show[field]);
    minutes += isInc ? 30 : -30;
    
    // Handle day wrap-around
    if (minutes >= 24 * 60) minutes = 0;
    if (minutes < 0) minutes = 23 * 60 + 30; // 23:30
    
    show[field] = minutesToTime(minutes);
    
    // Update the display
    tr.find(`.time-input.${field}`).val(show[field]);
    tr.find(`.${field}-12h`).text(format12h(show[field]));
    
    // Auto-adjust end time if it's before start time
    if (!isStart && timeToMinutes(show.end) < timeToMinutes(show.start)) {
      show.end = show.start;
      tr.find('.time-input.end').val(show.end);
      tr.find('.end-12h').text(format12h(show.end));
    }
  }
  
  saveToLocalStorage();
  renderSchedule();
});

// Weight input changes
$("#schedule").on('change', '.weight-input', function() {
  const id = $(this).closest('tr').data('id');
  const show = currentSchedule.shows.find(x => x.id === id);
  if (show) {
    let weight = parseInt($(this).val(), 10);
    // Ensure weight is between 1 and 25
    weight = Math.min(25, Math.max(1, isNaN(weight) ? 10 : weight));
    show.weight = weight;
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
  
  if ((isUp && idx === 0) || (!isUp && idx === shows.length - 1)) return;
  
  const id = tr.data('id');
  const current = shows.find(x => x.id === id);
  const targetIdx = isUp ? idx - 1 : idx + 1;
  const targetId = $(`#schedule tbody tr`).eq(targetIdx).data('id');
  const targetShow = shows.find(x => x.id === targetId);
  
  if (current && targetShow) {
    // Swap orders
    [current.order, targetShow.order] = [targetShow.order, current.order];
    saveToLocalStorage();
    renderSchedule();
  }
});

// Add row after this row
$("#schedule").on('click', '.add-row', function() {
  const tr = $(this).closest('tr');
  const currentShow = currentSchedule.shows.find(s => s.id === tr.data('id'));
  
  if (currentShow) {
    // Calculate default end time (30 minutes after start)
    const startTime = timeToMinutes(currentShow.start);
    const defaultEndTime = (startTime + 30) % (24 * 60);
    
    const newShow = {
      id: nextId++,
      name: "New Show",
      start: currentShow.start,
      end: minutesToTime(defaultEndTime),
      weight: 10, // Default weight to 10 (middle of 1-25)
      order: currentShow.order + 1
    };
    
    // Update orders of subsequent shows
    currentSchedule.shows.forEach(s => { 
      if (s.order > currentShow.order) s.order++;
    });
    
    currentSchedule.shows.push(newShow);
    saveToLocalStorage();
    renderSchedule();
    
    // Focus the new show's name input
    $(`tr[data-id="${newShow.id}"] .show-name`).focus().select();
  }
});

// Delete this row
$("#schedule").on('click', '.delete-row', function() {
  if (currentSchedule.shows.length <= 1) {
    alert('You must have at least one show in the schedule.');
    return;
  }
  
  if (confirm('Are you sure you want to delete this show?')) {
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const showToDelete = currentSchedule.shows.find(s => s.id === id);
    
    if (showToDelete) {
      // Update orders of subsequent shows
      currentSchedule.shows.forEach(s => {
        if (s.order > showToDelete.order) s.order--;
      });
      
      // Remove the show
      currentSchedule.shows = currentSchedule.shows.filter(s => s.id !== id);
      saveToLocalStorage();
      renderSchedule();
    }
  }
});
