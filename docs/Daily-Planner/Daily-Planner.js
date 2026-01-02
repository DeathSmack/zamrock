/* ──── Radio Schedule Planner ──── */

// Global state
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

// Initialize data
function initializeData() {
  // Initialize holiday select dropdown
  const holidaySelect = $('#holiday-select');
  holidaySelect.empty().append('<option value="">Add Holiday...</option>');
  HOLIDAYS.forEach(holiday => {
    holidaySelect.append(`<option value="${holiday.id}">${holiday.name}</option>`);
  });
  
  // Start with default shows
  currentSchedule.shows = [
    {id: 1, name: "The Morning Show", start: "06:00", end: "10:00", weight: 5, order: 0},
    {id: 2, name: "Midday Mix", start: "10:00", end: "14:00", weight: 4, order: 1},
    {id: 3, name: "Afternoon Drive", start: "14:00", end: "18:00", weight: 5, order: 2},
    {id: 4, name: "Evening Vibes", start: "18:00", end: "22:00", weight: 4, order: 3}
  ];
  nextId = 5;
  
  // Set default days (Mon-Fri)
  $('input[name="days"]').each(function() {
    const day = $(this).val();
    $(this).prop('checked', currentSchedule.days.includes(day));
  });
  
  renderSchedule();
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
    currentSchedule.days = [];
    $('input[name="days"]:checked').each(function() {
      currentSchedule.days.push($(this).val());
    });
    updateActiveSelections();
  });
  
  // Add holiday button
  $('#add-holiday').on('click', function() {
    const holidayId = $('#holiday-select').val();
    if (holidayId && !currentSchedule.holidays.includes(holidayId)) {
      currentSchedule.holidays.push(holidayId);
      updateActiveSelections();
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
  });
  
  // Schedule name
  $('#schedule-name').on('change', function() {
    currentSchedule.name = $(this).val().trim() || 'My Schedule';
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
        if (data.shows && Array.isArray(data.shows)) {
          currentSchedule = {
            ...currentSchedule,
            name: data.name || 'My Schedule',
            days: data.days || [],
            holidays: data.holidays || [],
            shows: data.shows.map(show => ({
              ...show,
              id: nextId++,
              weight: Math.min(25, Math.max(1, show.weight || 5))
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
    const data = {
      ...currentSchedule,
      shows: currentSchedule.shows.map(({id, ...rest}) => rest) // Remove id from shows
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSchedule.name.replace(/[^\w\s]/gi, '')}_schedule.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  // New schedule button
  $('#new-schedule').on('click', function() {
    if (confirm('Are you sure you want to create a new schedule? This will clear all current shows.')) {
      currentSchedule.shows = [];
      currentSchedule.name = 'My Schedule';
      currentSchedule.holidays = [];
      currentSchedule.days = [];
      
      $('#schedule-name').val('My Schedule');
      $('input[name="days"]').prop('checked', false);
      
      renderSchedule();
      updateActiveSelections();
    }
  });
  
  // Sort by dropdown
  $('#sort-by').on('change', renderSchedule);
  
  // Add show button
  $('#add-at-end').on('click', addNewShow);
  
  // Delete show button
  $(document).on('click', '.delete-show', function() {
    const id = $(this).closest('tr').data('id');
    currentSchedule.shows = currentSchedule.shows.filter(show => show.id !== id);
    renderSchedule();
  });
  
  // Time increment/decrement buttons
  $(document).on('click', '.time-btn', function() {
    const input = $(this).siblings('input');
    const minutes = $(this).hasClass('inc') ? 30 : -30;
    const time = timeToMinutes(input.val());
    const newTime = (time + minutes + (24 * 60)) % (24 * 60);
    input.val(minutesToTime(newTime));
    
    // Update the show data
    const id = input.closest('tr').data('id');
    const show = currentSchedule.shows.find(s => s.id === id);
    if (show) {
      if (input.hasClass('time-start')) {
        show.start = input.val();
      } else {
        show.end = input.val();
      }
    }
  });
  
  // Weight increment/decrement buttons
  $(document).on('click', '.weight-btn', function() {
    const input = $(this).siblings('input');
    const change = $(this).hasClass('weight-inc') ? 1 : -1;
    let weight = parseInt(input.val()) + change;
    weight = Math.min(25, Math.max(1, weight));
    input.val(weight);
    
    // Update the show data
    const id = input.closest('tr').data('id');
    const show = currentSchedule.shows.find(s => s.id === id);
    if (show) {
      show.weight = weight;
    }
  });
  
  // Handle show name changes
  $(document).on('change', '.show-name', function() {
    const id = $(this).closest('tr').data('id');
    const show = currentSchedule.shows.find(s => s.id === id);
    if (show) {
      show.name = $(this).val();
    }
  });
  
  // Handle time changes
  $(document).on('change', '.time-start, .time-end', function() {
    const id = $(this).closest('tr').data('id');
    const show = currentSchedule.shows.find(s => s.id === id);
    if (show) {
      if ($(this).hasClass('time-start')) {
        show.start = $(this).val();
      } else {
        show.end = $(this).val();
      }
    }
  });
  
  // Handle weight changes
  $(document).on('change', '.weight-input', function() {
    const id = $(this).closest('tr').data('id');
    const show = currentSchedule.shows.find(s => s.id === id);
    if (show) {
      show.weight = Math.min(25, Math.max(1, parseInt($(this).val()) || 5));
      $(this).val(show.weight);
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
    
    const row = `
      <tr data-id="${s.id}">
        <td><input type="text" class="show-name" value="${escapeHtml(s.name)}"></td>
        <td>
          <div class="time-control">
            <button type="button" class="time-btn dec" title="30 minutes earlier">-</button>
            <input type="time" class="time-start" value="${s.start}" step="300">
            <button type="button" class="time-btn inc" title="30 minutes later">+</button>
          </div>
        </td>
        <td>
          <div class="time-control">
            <button type="button" class="time-btn dec" title="30 minutes earlier">-</button>
            <input type="time" class="time-end" value="${s.end}" step="300">
            <button type="button" class="time-btn inc" title="30 minutes later">+</button>
          </div>
        </td>
        <td>
          <div class="weight-control">
            <button type="button" class="weight-btn weight-dec" title="Decrease weight">-</button>
            <input type="number" class="weight-input" min="1" max="25" value="${Math.min(25, Math.max(1, s.weight || 10))}">
            <button type="button" class="weight-btn weight-inc" title="Increase weight">+</button>
          </div>
        </td>
        <td>
          <button type="button" class="btn delete-show" title="Delete show">
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
  $(".time-start, .time-end").off('change').on('change', function() {
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const field = $(this).hasClass('time-start') ? 'start' : 'end';
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
    const current = currentSchedule.shows.find(item => item.id === id);
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
      // Update the order of shows when dragged
      const newOrder = [];
      $("#schedule tbody tr").each(function(index) {
        const id = $(this).data('id');
        const show = currentSchedule.shows.find(s => s.id === id);
        if (show) {
          show.order = index;
          newOrder.push(show);
        }
      });
      currentSchedule.shows = newOrder;
      renderSchedule();
    },
    handle: 'td:not(:last-child)',
    helper: 'clone',
    opacity: 0.8,
    cursor: 'move',
    placeholder: 'sortable-placeholder',
    forcePlaceholderSize: true
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

function addNewShow() {
  // Calculate default start time (end of last show or 06:00)
  let startTime = '06:00';
  if (currentSchedule.shows.length > 0) {
    const lastShow = [...currentSchedule.shows].sort((a, b) => b.order - a.order)[0];
    if (lastShow && lastShow.end) {
      startTime = lastShow.end;
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
  renderSchedule();
  
  // Scroll to the new row and focus the name input
  setTimeout(() => {
    const newRow = $(`tr[data-id="${newShow.id}"]`);
    if (newRow.length) {
      $('html, body').animate({
        scrollTop: newRow.offset().top - 100
      }, 100);
      newRow.find('.show-name').focus().select();
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
