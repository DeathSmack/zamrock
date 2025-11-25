// Title animation
const titleElement = document.querySelector('h1');
const originalTitle = "ZamRock Radio";
const titleFrames = [
    "24m20ck 24d10",
    "Z4m20ck 24d10",
    "Z4m20ck R4d10",
    "Z4mR0ck R4d10",
    "Z4mR0ck R4di0",
    "ZamR0ck R4di0",
    "ZamR0ck R4dio",
    "ZamRock R4dio",
    "ZamRock Radio",
    "ZamRock Radio.",
    "ZamRock Radio..",
    "ZamRock Radio...",
    "ZamRock Radio..!",
    "ZamRock Radio.!",
    "ZamRock Radio!",
    "ZamRock Radio;!",
    "ZamRock Radio ;!",
    "ZamRock Radio ;P",
    "ZamRock Radio",
    "ZamRock Radio",
    "ZamRock R4dio",
    "ZamR0ck R4dio",
    "ZamR0ck R4di0",
    "Z4mR0ck R4di0",
    "Z4mR0ck R4d10",
    "Z4m20ck R4d10",
    "Z4m20ck 24d10",
    "24m20ck 24d10"
];

let titleIndex = 0;

function animateTitle() {
    titleIndex = (titleIndex + 1) % titleFrames.length;
    if (titleElement) {
        titleElement.textContent = titleFrames[titleIndex];
    }
    document.title = originalTitle; // Keep tab title consistent
    const delay = Math.floor(Math.random() * 500) + 200; // 200-700ms
    setTimeout(animateTitle, delay);
}
// Start the title animation after a delay
setTimeout(animateTitle, 1000);

// Background images array (relative paths from docs/index.html)
const backgroundImages = [
    'img/website_bg/website_bg_001.jpg?raw=true',
    'img/website_bg/website_bg_002.jpg?raw=true',
    'img/website_bg/website_bg_003.jpg?raw=true',
    'img/website_bg/website_bg_004.jpg?raw=true',
    'img/website_bg/website_bg_005.jpg?raw=true',
    'img/website_bg/website_bg_006.jpg?raw=true',
    'img/website_bg/website_bg_007.jpg?raw=true',
    'img/website_bg/website_bg_008.jpg?raw=true',
    'img/website_bg/website_bg_009.jpg?raw=true',
    'img/website_bg/website_bg_010.jpg?raw=true',
    'img/website_bg/website_bg_011.jpg?raw=true',
    'img/website_bg/website_bg_012.jpg?raw=true',
    'img/website_bg/website_bg_013.jpg?raw=true',
    'img/website_bg/website_bg_014.jpg?raw=true',
    'img/website_bg/website_bg_015.jpg?raw=true',
    'img/website_bg/website_bg_016.jpg?raw=true',
    'img/website_bg/website_bg_017.jpg?raw=true',
    'img/website_bg/website_bg_018.jpg?raw=true',
    'img/website_bg/website_bg_019.jpg?raw=true',
    'img/website_bg/website_bg_020.jpg?raw=true'
];

function setRandomBackground() {
    if (backgroundImages.length === 0) return;
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    document.body.style.backgroundImage = `url('${randomImage}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
}

// Set initial background and rotate every 20 seconds
document.addEventListener('DOMContentLoaded', () => {
    setRandomBackground();
    setInterval(setRandomBackground, 20000);
});

// Menu toggle
function toggleMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.toggle('open');
        if (!menu.classList.contains('open')) {
            document.querySelectorAll('.submenu').forEach(s => s.classList.remove('active'));
        }
    }
}

// Submenu toggle
function toggleSubMenu(element) {
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    const submenu = element.nextElementSibling;
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('active');
    }
}

// Close submenus when clicking outside
document.addEventListener('click', (event) => {
    const menu = document.getElementById('menu');
    const toggleBtn = document.querySelector('.toggle-menu');
    if (!menu.contains(event.target) && event.target !== toggleBtn) {
        menu.classList.remove('open');
        document.querySelectorAll('.submenu').forEach(s => s.classList.remove('active'));
    }
});

// Audio player controls
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('radioStream');
    const playButton = document.getElementById('playButton');

    if (audio && playButton) {
        // Attempt to auto-play muted
        audio.play().catch(() => { /* ignore errors */ });

        // Toggle play/stop
        playButton.addEventListener('click', () => {
            if (audio.paused) {
                audio.muted = false;
                audio.play().then(() => {
                    playButton.textContent = 'Stop';
                }).catch(() => {
                    // fallback if needed
                });
            } else {
                audio.pause();
                playButton.textContent = 'Play';
            }
        });
    }
});