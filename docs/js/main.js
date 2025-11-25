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

// Background images array
const backgroundImages = [
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/1.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/2.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/3.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/4.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/5.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/6.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/7.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/8.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/9.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/graphics/website_bg/10.jpg'
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
        // Try to auto-play muted
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