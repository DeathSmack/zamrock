/* ────────────────────────
   Schedule table – 12‑hr view + Add / Delete
   ──────────────────────── */

/* ---------- Data --------------------------------------------------- */
let shows = [
  {id:1, name:"The Morning Coffee Mix",          start:"06:00", end:"10:30"},
  {id:2, name:"Acid Trip, Psychedelic Sounds",   start:"09:30", end:"13:30"},
  {id:3, name:"Cloud Pants, Ethereal Soundscapes",start:"12:15", end:"15:15"},
  {id:4, name:"ZamDelic Trance, Psychedelic Trance",start:"14:00", end:"17:00"},
  {id:5, name:"Blues in Every Tongue",           start:"15:45", end:"18:00"},
  {id:6, name:"The Funky Truth, Funk Grooves",   start:"16:45", end:"19:00"},
  {id:7, name:"Afrobeat Legacy",                 start:"18:00", end:"21:30"},
  {id:8, name:"Zamrock Rising",                  start:"20:00", end:"22:00"},
  {id:9, name:"ZamRock Classics",                start:"20:45", end:"22:00"},
  {id:10, name:"Artist of the Month",             start:"21:30", end:"22:00"},
  {id:11, name:"The Catnip Sessions",             start:"21:45", end:"22:00"}
];
shows.forEach((s,i)=>s.order=i);
let nextId = Math.max(...shows.map(s=>s.id)) + 1;

/* ---------- Helpers ------------------------------------------------- */
function timeToMinutes(t){const [h,m]=t.split(':').map(Number);return h*60+m;}
function minutesToTime(m){const h=Math.floor(m/60).toString().padStart(2,'0');
                           const min=(m%60).toString().padStart(2,'0');return `${h}:${min}`;}
function formatDuration(m){const h=Math.floor(m/60);const min=m%60;return `${h}h ${min}m`;}

/* 12‑hour (AM/PM) formatter */
function format12h(t){const [hRaw,min] = t.split(':').map(Number);
                      const period = hRaw>=12?'PM':'AM';
                      const h = hRaw%12||12;
                      return `${h}:${min.toString().padStart(2,'0')} ${period}`;}

/* ---------- Render --------------------------------------------------- */
function renderSchedule(){
  const tbody = $("#schedule tbody");
  tbody.empty();

  shows.sort((a,b)=>a.order-b.order);

  shows.forEach((s,i)=>{
    const startMin   = timeToMinutes(s.start);
    const endMin     = timeToMinutes(s.end);
    const duration   = endMin-startMin;
    const durationStr = formatDuration(duration);

    // Overlap with previous programme
    const prev = shows[i-1];
    let overlap = 0;
    if(prev){
      const prevEnd = timeToMinutes(prev.end);
      overlap = Math.max(0, prevEnd-startMin);
    }
    const overlapStr = formatDuration(overlap);

    const tr = $("<tr>").attr("data-id", s.id);

    tr.append($("<td>").text(i+1));

    /* ── Row‑move arrows ── */
    const upBtn   = $('<button class="move-up">&#x25B2;</button>');
    const downBtn = $('<button class="move-down">&#x25BC;</button>');
    const moveCtrls = $('<div class="move-controls">')
                       .append(upBtn).append(downBtn);
    tr.append($("<td>").append(moveCtrls));

    tr.append($("<td>").text(s.name));

    /* ── Start field + 12‑hr display ── */
    const startInput = $("<input type='time' class='start'>")
                        .val(s.start).data('id',s.id);
    const start12h   = $('<span class="time-12h start-12h"></span>')
                        .text(format12h(s.start));
    const startCtrls = $('<div class="time-controls">')
                        .append('<button class="dec start-dec">&#x25BC;</button>')
                        .append('<button class="inc start-inc">&#x25B2;</button>');
    tr.append($("<td>").append(startInput).append(start12h).append(startCtrls));

    /* ── End field + 12‑hr display ── */
    const endInput = $("<input type='time' class='end'>")
                      .val(s.end).data('id',s.id);
    const end12h   = $('<span class="time-12h end-12h"></span>')
                      .text(format12h(s.end));
    const endCtrls = $('<div class="time-controls">')
                      .append('<button class="dec end-dec">&#x25BC;</button>')
                      .append('<button class="inc end-inc">&#x25B2;</button>');
    tr.append($("<td>").append(endInput).append(end12h).append(endCtrls));

    tr.append($("<td>").text(durationStr));
    tr.append($("<td>").text(overlapStr));

    /* ── Actions (Add / Delete) ── */
    const addBtn   = $('<button class="add-row" title="Add after this row">&#x2795;</button>');   // +
    const deleteBtn= $('<button class="delete-row" title="Delete this row">&#x1F5D1;</button>'); // 🗑️
    const actCell  = $('<td class="actions-cell">')
                      .append(addBtn).append(deleteBtn);
    tr.append(actCell);

    tbody.append(tr);
  });

  /* ---------- Time input change ---------- */
  $(".start, .end").off('change').on('change', function(){
    const id = $(this).data('id');
    const s  = shows.find(item=>item.id===id);
    if($(this).hasClass('start')) s.start = $(this).val();
    else s.end   = $(this).val();

    // update 12‑hr display
    $(this).closest('td').find('.time-12h').text(format12h($(this).val()));
    renderSchedule();
  });

  /* ---------- Time increment/decrement ---------- */
  $(".inc").off('click').on('click', function(){
    const id  = $(this).closest('tr').data('id');
    const field = $(this).hasClass('start-inc') ? 'start' :
                  $(this).hasClass('end-inc')   ? 'end'   : null;
    if(!field) return;
    const step = 15;
    const s = shows.find(it=>it.id===id);
    let minutes = timeToMinutes(s[field]) + step;
    minutes = Math.max(0, Math.min(23*60+59, minutes));
    s[field] = minutesToTime(minutes);
    $(this).closest('td').find(`.${field}-12h`).text(format12h(s[field]));
    renderSchedule();
  });
  $(".dec").off('click').on('click', function(){
    const id  = $(this).closest('tr').data('id');
    const field = $(this).hasClass('start-dec') ? 'start' :
                  $(this).hasClass('end-dec')   ? 'end'   : null;
    if(!field) return;
    const step = 15;
    const s = shows.find(it=>it.id===id);
    let minutes = timeToMinutes(s[field]) - step;
    minutes = Math.max(0, Math.min(23*60+59, minutes));
    s[field] = minutesToTime(minutes);
    $(this).closest('td').find(`.${field}-12h`).text(format12h(s[field]));
    renderSchedule();
  });

  /* ---------- Row move arrows ---------- */
  $(".move-up").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const idx = tr.index();
    if(idx===0) return;
    const id = tr.data('id');
    const s = shows.find(it=>it.id===id);
    const prevId = $("#schedule tbody tr").eq(idx-1).data('id');
    const prev = shows.find(it=>it.id===prevId);
    [s.order, prev.order] = [prev.order, s.order];
    renderSchedule();
  });
  $(".move-down").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const idx = tr.index();
    if(idx===shows.length-1) return;
    const id = tr.data('id');
    const s = shows.find(it=>it.id===id);
    const nextId = $("#schedule tbody tr").eq(idx+1).data('id');
    const next = shows.find(it=>it.id===nextId);
    [s.order, next.order] = [next.order, s.order];
    renderSchedule();
  });

  /* ---------- Add / Delete actions ---------- */
  $(".add-row").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const idx = tr.index();
    const curId = tr.data('id');

    // create new show
    const newShow = {
      id: nextId++,
      name: "New Show",
      start: "00:00",
      end:   "00:30",
      order: shows[idx].order + 1
    };

    // bump orders of following rows
    shows.forEach(s=>{ if(s.order>shows[idx].order) s.order++; });

    shows.push(newShow);
    renderSchedule();
  });

  $(".delete-row").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    shows = shows.filter(s=>s.id!==id);

    // re‑number orders
    shows.forEach((s,i)=>s.order=i);
    renderSchedule();
  });
}

/* ---------- Initialise + sortable -------------------------------- */
$(function(){
  renderSchedule();

  $("#schedule tbody").sortable({
    items:"tr",
    update:function(event, ui){
      $(this).children('tr').each(function(idx){
        const id   = $(this).data('id');
        const show = shows.find(item=>item.id===id);
        show.order = idx;
      });
      renderSchedule();
    }
  }).disableSelection();

  // global “Add at End” button
  $("#add-at-end").on('click', function(){
    const last = shows[shows.length-1];
    const newShow = {
      id: nextId++,
      name:"New Show",
      start:"00:00",
      end:"00:30",
      order:last.order+1
    };
    shows.push(newShow);
    renderSchedule();
  });
});
