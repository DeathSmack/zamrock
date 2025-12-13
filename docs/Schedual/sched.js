const scheduleData = [{
        title: "Fresh Fish!",
        start: 6,
        end: 22,
        description: "Recently added tracks"
    },
    {
        title: "Acid Trip, A Journey Through Psychedelic Sounds",
        start: 6,
        end: 12,
        description: "Wake up to a psychedelic journey, perfect for a mind-bending start to the day."
    },
    {
        title: "The Morning Coffee Mix, Smooth Jams to Ease You In",
        start: 6,
        end: 9,
        description: "Smooth and mellow tunes to ease you into the morning with your coffee."
    },
    {
        title: "Afrobeat Legacy, A Vibrant Celebration of Music",
        start: 7,
        end: 13,
        description: "Celebrate the vibrant rhythms and timeless sounds of Afrobeat."
    },
    {
        title: "Blues in Every Tongue, An Exploration of the Blues",
        start: 8,
        end: 14,
        description: "Explore the blues from around the world, in every language imaginable."
    },
    {
        title: "Cloud Pants, Ethereal Soundscapes",
        start: 9,
        end: 15,
        description: "Dreamy and ethereal soundscapes for a relaxed and carefree vibe."
    },
    {
        title: "The Funky Truth, Get Down with Funky Grooves",
        start: 10,
        end: 16,
        description: "Get down with the funkiest grooves to energize your morning."
    },
    {
        title: "ZamDelic Trance, A Blend of Psychedelic Trance",
        start: 11,
        end: 17,
        description: "A heady mix of Zambian sounds and psychedelic trance to get you moving."
    },
    {
        title: "Zamrock Rising, Contemporary Zamrock Artists",
        start: 12,
        end: 22,
        description: "Showcasing the best of contemporary Zamrock artists."
    },
    {
        title: "ZamRock Classics, Timeless Zamrock Tracks",
        start: 12,
        end: 22,
        description: "A journey through the iconic sounds of classic Zamrock."
    },
    {
        title: "Artist of the Month, A Spotlight on Influential Artists",
        start: 13,
        end: 18,
        description: "Spotlighting a different influential artist each month."
    },
    {
        title: "The Catnip Sessions, Mellow Grooves",
        start: 18,
        end: 22,
        description: "A mix of our favorite Zamrock tracks."
    },
    {
        title: "Endless Mixtapes, Curated Collections",
        start: 22,
        end: 30,
        description: "Curated collection of private mixtapes for late-night listening."
    },
    {
        title: "Dublab Sessions, Exclusive Tracks",
        start: 22,
        end: 30,
        description: "Exclusive Dublab sessions for late-night listening."
    },
{
        title: "Country",
        start: 14,
        end: 16,
        description: "Old & Rare"
    }
];

const container = document.getElementById("scheduleContainer");
const timeAxis = document.getElementById("timeAxis");

const startTime = 6;
const endTime = 30;
const scheduleDuration = endTime - startTime;
const rowHeight = 100;

// Create time axis labels
for (let i = startTime; i <= endTime; i++) {
    const hour = i % 24;
    const timeLabel = document.createElement("div");
    timeLabel.classList.add("time-label");
    timeLabel.textContent = `${hour === 0 ? 24 : hour}:00`;
    timeAxis.appendChild(timeLabel);
}

// Function to check for overlaps
function isOverlapping(show, rowData) {
    return rowData.some(r => show.start < r.end && show.end > r.start);
}

// Modified row assignment logic to minimize overlaps
function findAvailableRow(show, rows) {
    for (let i = 0; i < rows.length; i++) {
        if (!isOverlapping(show, rows[i])) {
            return i;
        }
    }
    return rows.length; // No suitable row found, create a new one
}

// Create a data structure to track row occupancy
const rows = [
    []
];

// Function to get current time in Denver
function getCurrentDenverTime() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const denverTime = new Date(utc - (7 * 3600000)); // Denver is UTC-7
    return denverTime;
}

let currentShowElement = null; // Store the currently highlighted show

// Function to create and position a show block
function createShowBlock(show) {
    const showBlock = document.createElement("div");
    showBlock.classList.add("show");

    const startPercent = ((show.start - startTime) / scheduleDuration) * 100;
    const durationPercent = ((show.end - show.start) / scheduleDuration) * 100;

    // Find an available row with overlap prevention
    let row = findAvailableRow(show, rows);

    // If the row doesn't exist, create it
    if (!rows[row]) {
        rows[row] = [];
    }
    rows[row].push({
        start: show.start,
        end: show.end
    });

    showBlock.style.left = `${startPercent}%`;
    showBlock.style.width = `${durationPercent}%`;
    showBlock.style.top = `${row * rowHeight + 40}px`;
    showBlock.style.height = `${rowHeight - 4}px`; // ADJUSTED HEIGHT CALCULATION: rowHeight - (top margin + bottom margin)
    showBlock.style.margin = "2px"; // This is set in the CSS

    const startTimeFormatted = show.start % 24;
    const endTimeFormatted = show.end % 24;
    const timeDisplay = `${startTimeFormatted === 0 ? 24 : startTimeFormatted}:00 - ${endTimeFormatted === 0 ? 24 : endTimeFormatted}:00`;

    showBlock.innerHTML = `
        <div class="time">${timeDisplay}</div>
        <div class="title">${show.title}</div>
        <div class="description">${show.description}</div>
    `;

    container.appendChild(showBlock);
    return showBlock; // Return the created show block
}

// Function to find the currently playing show
function findCurrentShow(currentTime) {
    const currentHour = currentTime.getHours();
    for (let i = 0; i < scheduleData.length; i++) {
        const show = scheduleData[i];
        if (currentHour >= show.start && currentHour < show.end) {
            return show;
        }
    }
    return null; // No show found for the current time
}

// Function to highlight the currently playing show
function highlightCurrentShow() {
    const denverTime = getCurrentDenverTime();
    const currentShow = findCurrentShow(denverTime);

    // Remove highlight from previous show
    if (currentShowElement) {
        currentShowElement.classList.remove("current-show");
    }

    // Find and highlight the new current show
    if (currentShow) {
        //Find element with a matching title
        currentShowElement = Array.from(container.children).find(child => {
            return child.querySelector('.title').textContent === currentShow.title;
        });

        if (currentShowElement) {
            currentShowElement.classList.add("current-show");
        }

    }
}

// Function to create current time line
function createCurrentTimeLine() {
    const denverTime = getCurrentDenverTime();
    const currentHour = denverTime.getHours();
    const currentMinute = denverTime.getMinutes();

    const currentTimeDecimal = currentHour + (currentMinute / 60);
    const timePositionPercent = ((currentTimeDecimal - startTime) / scheduleDuration) * 100;

    const currentTimeLine = document.createElement("div");
    currentTimeLine.classList.add("current-time-line");
    currentTimeLine.style.left = `${timePositionPercent}%`;

    container.appendChild(currentTimeLine);
}

// Function to update the clock
function updateClock() {
    const localTime = new Date();
    const hours = localTime.getHours();
    const minutes = localTime.getMinutes();
    const seconds = localTime.getSeconds();

    document.getElementById('local-time').innerHTML = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Create show blocks and store references to them
const showElements = scheduleData.map(show => createShowBlock(show));

// Initial highlight and update interval
highlightCurrentShow();

// Set interval to update highlighting every minute (or desired interval)
setInterval(highlightCurrentShow, 60000);

// Add the current time line
createCurrentTimeLine();

// Set interval to update clock
setInterval(updateClock, 1000);
