// Array of different titles for animation
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

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Start title animation
    animateTitle();
    
    // Add any other initialization code here
    console.log('ZamRock Radio initialized');
});

// Mobile menu toggle
function toggleMenu() {
    const nav = document.querySelector('.nav-menu');
    if (nav) {
        nav.classList.toggle('active');
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
