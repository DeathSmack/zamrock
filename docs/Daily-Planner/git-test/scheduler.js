/* ──── Schedule table – 12‑hr view + Add / Delete ───────────────── */

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

/* Helpers */
function timeToMinutes(t){const [h,m]=t.split(':').map(Number);return h*60+m;}
function minutesToTime(m){const h=Math.floor(m/60).toString().padStart(2,'0');
                           const min=(m%60).toString().padStart(2,'0');return `${h}:${min}`;}
function formatDuration(m){const h=Math.floor(m/60);const min=m%60;return `${h}h ${min}m`;}
function format12h(t){const [hRaw,min] = t.split(':').map(Number);
                      const period = hRaw>=12?'PM':'AM';
                      const h = hRaw%12||12;
                      return `${h}:${min.toString().padStart(2,'0')} ${period}`;}

/* Render */
function renderSchedule(){
  const tbody = $("#schedule tbody");
  tbody.empty();
  shows.sort((a,b)=>a.order-b.order);
  shows.forEach((s,i)=>{
    const startMin   = timeToMinutes(s.start);
    const endMin     = timeToMinutes(s.end);
    const duration   = endMin-startMin;
    const durationStr = formatDuration(duration);
    const prev = shows[i-1];
    let overlap = 0;
    if(prev){
      const prevEnd = timeToMinutes(prev.end);
      overlap = Math.max(0, prevEnd-startMin);
    }
    const overlapStr = formatDuration(overlap);

    const tr = $("<tr>").attr("data-id", s.id);
    tr.append($("<td>").text(i+1));
    const upBtn   = $('<button class="move-up">&#x25B2;</button>');
    const downBtn = $('<button class="move-down">&#x25BC;</button>');
    const moveCtl = $('<td>').addClass("move-controls").append(upBtn, downBtn);
    tr.append(moveCtl);
    tr.append($("<td>").text(s.name));
    tr.append($("<td>").append(
      $('<input type="time" class="start-time">').val(s.start),
      $('<span class="start-12h time-12h"></span>').text(format12h(s.start)),
      $('<span class="time-controls"></span>').append(
        $('<button class="time-controls dec start-dec">&#x25BC;</button>'),
        $('<button class="time-controls inc start-inc">&#x25B2;</button>')
      )
    ));
    tr.append($("<td>").append(
      $('<input type="time" class="end-time">').val(s.end),
      $('<span class="end-12h time-12h"></span>').text(format12h(s.end)),
      $('<span class="time-controls"></span>').append(
        $('<button class="time-controls dec end-dec">&#x25BC;</button>'),
        $('<button class="time-controls inc end-inc">&#x25B2;</button>')
      )
    ));
    tr.append($("<td>").text(durationStr));
    tr.append($("<td>").text(overlapStr));
    const actions = $('<td>').append(
      $('<button class="add-row">+</button>'),
      $('<button class="delete-row">&#128465;</button>')
    );
    tr.append(actions);
    tbody.append(tr);
  });

  /* Time picker handlers */
  $("input[type='time']").off('change').on('change', function(){
    const tr = $(this).closest('tr');
    const id = tr.data('id');
    const s = shows.find(it=>it.id===id);
    const field = $(this).is('[class*="start"]') ? 'start' : 'end';
    s[field] = $(this).val();
    $(this).closest('td').find(`.${field}-12h`).text(format12h(s[field]));
    renderSchedule();
  });

  /* Increment / Decrement time (24‑hr) */
  $(".inc").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const idx = tr.index();
    const id = tr.data('id');
    const s = shows.find(it=>it.id===id);
    const field = $(this).hasClass('start-inc') ? 'start' : 'end';
    let mins = timeToMinutes(s[field]) + 15;
    mins = Math.max(0, Math.min(23*60+59, mins));
    s[field] = minutesToTime(mins);
    $(this).closest('td').find(`.${field}-12h`).text(format12h(s[field]));
    renderSchedule();
  });
  $(".dec").off('click').on('click', function(){
    const tr = $(this).closest('tr');
    const idx = tr.index();
    const id = tr.data('id');
    const s = shows.find(it=>it.id===id);
    const field = $(this).hasClass('start-dec') ? 'start' : 'end';
    let mins = timeToMinutes(s[field]) - 15;
    mins = Math.max(0, Math.min(23*60+59, mins));
    s[field] = minutesToTime(mins);
    $(this).closest('td').find(`.${field}-12h`).text(format12h(s[field]));
    renderSchedule();
  });

  /* Move arrows */
  $(".move-up").off('click').on('click',
