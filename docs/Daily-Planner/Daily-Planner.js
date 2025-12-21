/* ──── Schedule table – 12‑hr view + Add / Delete ──── */

/* ---------- Data ------------------------------- */
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

/* ---------- Helpers ----------------------------- */
function timeToMinutes(t){const [h,m]=t.split(':').map(Number);return h*60+m;}
function minutesToTime(m){const h=Math.floor(m/60).toString().padStart(2,'0');
                           const min=(m%60).toString().padStart(2,'0');return `${h}:${min}`;}
function formatDuration(m){const h=Math.floor(m/60);const min=m%60;return `${h}h ${min}m`;}
function format12h(t){const [hRaw,min] = t.split(':').map(Number);
                      const period = hRaw>=12?'PM':'AM';
                      const h = hRaw%12||12;
                      return `${h}:${min.toString().padStart(2,'0')} ${period}`;}

/* ---------- Render ------------------------------- */
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
    tr.append($("<td>").html('<div class="move-controls"><button class="move-up">▲</button><button class="move-down">▼</button></div>'));
    tr.append($("<td>").text(s.name));

    // Start column
    tr.append($("<td>").html(`
      <input type="time" class="time-input start" value="${s.start}">
      <span class="time-12h start-12h">${format12h(s.start)}</span>
      <div class="time-controls"><button class="dec start-dec">▼</button><button class="inc start-inc">▲</button></div>
    `));

    // End column
    tr.append($("<td>").html(`
      <input type="time" class="time-input end" value="${s.end}">
      <span class="time-12h end-12h">${format12h(s.end)}</span>
      <div class="time-controls"><button class="dec end-dec">▼</button><button class="inc end-inc">▲</button></div>
    `));

    tr.append($("<td>").text(durationStr));
    tr.append($("<td>").text(overlapStr));
    tr.append($("<td>").html('<button class="add-row">+</button> <button class="delete-row">🗑️</button>'));
    tbody.append(tr);
  });

  /* ---------- Event listeners (re‑bind after every render) ---------- */

  // 24‑hr → 12‑hr updates
  $(".time-input").off('change').on('change', function(){
    const id = $(this).closest('tr').data('id');
    const field = $(this).hasClass('start') ? 'start' : 'end';
    shows.find(x=>x.id===id)[field] = $(this).val();
    $(this).siblings('.time-12h').text(format12h(shows.find(x=>x.id===id)[field]));
    renderSchedule();
  });

  // ▲ / ▼ arrow helpers (30‑min steps)
  $(".inc").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const show = shows.find(x=>x.id===id);
    const field = $(this).hasClass('start-inc') ? 'start' : 'end';
    let minutes = timeToMinutes(show[field]) + 30;
    minutes = Math.min(23*60+59, minutes);
    show[field] = minutesToTime(minutes);
    renderSchedule();
  });
  $(".dec").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const show = shows.find(x=>x.id===id);
    const field = $(this).hasClass('start-dec') ? 'start' : 'end';
    let minutes = timeToMinutes(show[field]) - 30;
    minutes = Math.max(0, minutes);
    show[field] = minutesToTime(minutes);
    renderSchedule();
  });

  // Move‑up / move‑down arrows
  $(".move-up").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const idx = tr.index();
    if(idx===0) return;
    const id = tr.data('id');
    const current = shows.find(x=>x.id===id);
    const prevId = $("#schedule tbody tr").eq(idx-1).data('id');
    const prevShow = shows.find(x=>x.id===prevId);
    [current.order, prevShow.order] = [prevShow.order, current.order];
    renderSchedule();
  });
  $(".move-down").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const idx = tr.index();
    if(idx===shows.length-1) return;
    const id = tr.data('id');
    const current = shows.find(x=>x.id===id);
    const nextId = $("#schedule tbody tr").eq(idx+1).data('id');
    const nextShow = shows.find(x=>x.id===nextId);
    [current.order, nextShow.order] = [nextShow.order, current.order];
    renderSchedule();
  });

  // Add row after this row
  $(".add-row").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const idx = tr.index();
    const newShow = {
      id: nextId++,
      name: "New Show",
      start: "00:00",
      end: "00:30",
      order: shows[idx].order + 1
    };
    shows.forEach(x=>{ if(x.order>shows[idx].order) x.order++; });
    shows.push(newShow);
    renderSchedule();
  });

  // Delete this row
  $(".delete-row").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    shows = shows.filter(x=>x.id!==id);
    shows.forEach((x,i)=>x.order=i);
    renderSchedule();
  });
}

/* ---------- Initialise & jQuery UI sortable ---------- */
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

  // Global “Add at End” button
  $("#add-at-end").on('click', function(){
    const last = shows[shows.length-1] || {order:-1};
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
