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

// Function to set background image
function setRandomBackground() {
    if (backgroundImages.length === 0) return;
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    const img = new Image();
    img.onload = function() {
        document.body.style.backgroundImage = `url('${randomImage}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
    };
    img.src = randomImage;
}

// Set initial background and start rotating every 20 seconds
document.addEventListener('DOMContentLoaded', function() {
    setRandomBackground();
    setInterval(setRandomBackground, 20000); // Change every 20 seconds
});

// Menu toggle functionality
function toggleMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.toggle('open');
        // Close any open submenus when toggling main menu
        if (!menu.classList.contains('open')) {
            const submenus = document.querySelectorAll('.submenu');
            submenus.forEach(submenu => submenu.classList.remove('active'));
        }
    }
}

// Submenu toggle functionality
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
document.addEventListener('click', function(event) {
    const menu = document.getElementById('menu');
    const toggleBtn = document.querySelector('.toggle-menu');
    
    // If click is outside menu and not on toggle button
    if (!menu.contains(event.target) && event.target !== toggleBtn) {
        menu.classList.remove('open');
        const submenus = document.querySelectorAll('.submenu');
        submenus.forEach(submenu => submenu.classList.remove('active'));
    }
});

// Audio player functionality
document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('radioStream');
    const playButton = document.getElementById('playButton');
    
    if (audio && playButton) {
        // Try to start audio on first user interaction
        const startAudio = () => {
            audio.play().then(() => {
                playButton.textContent = 'Stop';
                // Remove the event listener after first interaction
                document.removeEventListener('click', startAudio);
                document.removeEventListener('keydown', startAudio);
            }).catch(e => {
                console.log('Audio play failed:', e);
            });
        };

        // Add event listeners for first interaction
        document.addEventListener('click', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });

        // Toggle play/pause on button click
        playButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling to document
            if (audio.paused) {
                audio.play().then(() => {
                    playButton.textContent = 'Stop';
                }).catch(e => {
                    console.log('Audio play failed:', e);
                });
            } else {
                audio.pause();
                playButton.textContent = 'Play';
            }
        });
    }
});
