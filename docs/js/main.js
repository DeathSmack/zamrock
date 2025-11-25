// Title animation
const titleElement = document.querySelector('h1');
const originalTitle = document.title;
let titleIndex = 0;
const titleFrames = [
    'ZamRock Radio',
    'ZamRock Radio.',
    'ZamRock Radio..',
    'ZamRock Radio...',
    'ZamRock Radio....'
];

function animateTitle() {
    titleIndex = (titleIndex + 1) % titleFrames.length;
    const newTitle = titleFrames[titleIndex];
    if (titleElement) titleElement.textContent = newTitle;
    document.title = newTitle;
    setTimeout(animateTitle, 500);
}

// Initialize title animation
setTimeout(animateTitle, 500);

// Background images array with direct URLs
const backgroundImages = [
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/1.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/2.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/3.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/4.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/5.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/6.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/7.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/8.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/9.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/10.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/11.jpg',
    'https://raw.githubusercontent.com/DeathSmack/zamrock/main/img/website_bg/12.jpg'
];

// Function to set background image
function setRandomBackground() {
    if (backgroundImages.length === 0) return;
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    document.body.style.backgroundImage = `url('${randomImage}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
}

// Set initial background and start rotating every 20 seconds
document.addEventListener('DOMContentLoaded', function() {
    setRandomBackground();
    setInterval(setRandomBackground, 20000); // Change every 20 seconds
});

// Menu toggle functionality
function toggleMenu() {
    const menu = document.getElementById('menu');
    if (menu) menu.classList.toggle('open');
}

// Submenu toggle functionality
function toggleSubMenu(element) {
    if (!element) return;
    event.preventDefault();
    const submenu = element.nextElementSibling;
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('active');
    }
}

// Close submenus when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.matches('.menu a')) {
        const submenus = document.querySelectorAll('.submenu');
        submenus.forEach(submenu => {
            submenu.classList.remove('active');
        });
    }
});

// Initialize audio player
document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('radioStream');
    const playButton = document.getElementById('playButton');
    
    if (audio && playButton) {
        playButton.addEventListener('click', function() {
            if (audio.paused) {
                audio.play().catch(e => console.log('Audio play failed:', e));
                playButton.textContent = 'Stop';
            } else {
                audio.pause();
                playButton.textContent = 'Play';
            }
        });
    }
});