// Array of different titles to show as animation
const titles = [
    "24m20ck 24d10", "Z4m20ck 24d10", "Z4m20ck R4d10", "Z4mR0ck R4d10",
    "Z4mR0ck R4di0", "ZamR0ck R4di0", "ZamR0ck R4dio", "ZamRock R4dio",
    "ZamRock Radio", "ZamRock Radio.", "ZamRock Radio..", "ZamRock Radio...",
    "ZamRock Radio..!", "ZamRock Radio.!", "ZamRock Radio!", "ZamRock Radio;!",
    "ZamRock Radio ;!", "ZamRock Radio ;P", "ZamRock Radio", "ZamRock Radio",
    "ZamRock R4dio", "ZamR0ck R4dio", "ZamR0ck R4di0", "Z4mR0ck R4di0",
    "Z4mR0ck R4d10", "Z4m20ck R4d10", "Z4m20ck 24d10", "24m20ck 24d10"
];

// Function to animate the title
function animateTitle() {
    let index = 0;
    const titleElement = document.querySelector('h1');
    
    if (!titleElement) return;
    
    setInterval(() => {
        titleElement.textContent = titles[index];
        index = (index + 1) % titles.length;
    }, 100);
}

// Function to set random background image
function setRandomBackground() {
    const bgCount = 21; // Number of background images
    const randomNum = Math.floor(Math.random() * bgCount) + 1;
    const bgImage = `url('img/website_bg/website_bg_${String(randomNum).padStart(3, '0')}.jpg')`;
    document.body.style.backgroundImage = bgImage;
}

// Mobile menu toggle
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// Close mobile menu when clicking outside
function handleClickOutside(event) {
    const navMenu = document.querySelector('.nav-menu');
    const menuButton = document.querySelector('.mobile-menu-toggle');
    
    if (navMenu && menuButton && 
        !navMenu.contains(event.target) && 
        !menuButton.contains(event.target)) {
        navMenu.classList.remove('active');
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Start title animation
    animateTitle();
    
    // Set initial random background
    setRandomBackground();
    
    // Change background every 30 seconds
    setInterval(setRandomBackground, 30000);
    
    // Add click outside listener for mobile menu
    document.addEventListener('click', handleClickOutside);
    
    // Add active class to current nav item
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        if (link.getAttribute('href') === currentPage || 
            (currentPage === '' && link.getAttribute('href') === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
