// Static header text
const headerElement = document.querySelector('h1');
const headerText = "ZamRock Radio";

// Array of titles for tab animation
const titles = [
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

let currentTitleIndex = 0;

// Function to animate tab title with random intervals
function animateTabTitle() {
    document.title = titles[currentTitleIndex];
    currentTitleIndex = (currentTitleIndex + 1) % titles.length;

    const interval = Math.floor(Math.random() * 2000) + 500;
    setTimeout(animateTabTitle, interval);
}

// Start the tab title animation
setTimeout(animateTabTitle, 1000);

// Keep header static
if (headerElement) {
    headerElement.textContent = headerText;
}

// Mobile menu toggle function
function toggleMenu(event) {
    if (event) event.preventDefault();
    const menu = document.querySelector('.nav-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// Close menu when clicking outside
window.addEventListener('click', (event) => {
    const menu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (menu && menuToggle && !menu.contains(event.target) && !menuToggle.contains(event.target)) {
        menu.style.display = 'none';
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    const menu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (window.innerWidth > 768) {
        if (menu) menu.style.display = '';
    } else if (menuToggle && menu) {
        menu.style.display = 'none';
    }
});

// Background images array with full URLs
const backgroundImages = [
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_001.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_002.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_003.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_004.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_005.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_006.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_007.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_008.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_009.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_010.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_011.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_012.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_013.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_014.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_015.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_016.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_017.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_018.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_019.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_020.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_021.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_022.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_023.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_024.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_025.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_026.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_027.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_028.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_029.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/docs/img/website_bg/website_bg_030.jpg'
];

function setRandomBackground() {
    if (backgroundImages.length === 0) return;
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    
    // Preload the image before setting it as background
    const img = new Image();
    img.onload = function() {
        // Only update the background if the image loads successfully
        document.body.style.backgroundImage = `url('${randomImage}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
    };
    img.src = randomImage;
}

// Initialize background rotation on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial background
    setRandomBackground();
    
    // Rotate background every 20 seconds
    const backgroundInterval = setInterval(setRandomBackground, 20000);
    
    // Cleanup interval when page is unloaded
    window.addEventListener('beforeunload', () => {
        clearInterval(backgroundInterval);
    });

    const audio = document.getElementById('radioStream');
    const playButton = document.getElementById('playButton');
    const volumeSlider = document.getElementById('volumeSlider');

    if (audio && playButton && volumeSlider) {
        // Initialize volume
        audio.volume = volumeSlider.value / 100;

        // Play/pause toggle
        playButton.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().then(() => {
                    playButton.textContent = 'Stop';
                }).catch(() => {
                    // handle errors if needed
                });
            } else {
                audio.pause();
                playButton.textContent = 'Play';
            }
        });

        // Adjust volume
        volumeSlider.addEventListener('input', () => {
            audio.volume = volumeSlider.value / 100;
        });
    }
});