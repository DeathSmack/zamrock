// Array of different titles to show as animation
var titles = ["24m20ck 24d10", "Z4m20ck 24d10", "Z4m20ck R4d10", "Z4mR0ck R4d10", "Z4mR0ck R4di0", "ZamR0ck R4di0", "ZamR0ck R4dio", "ZamRock R4dio","ZamRock Radio","ZamRock Radio.","ZamRock Radio..","ZamRock Radio...","ZamRock Radio..!","ZamRock Radio.!","ZamRock Radio!","ZamRock Radio;!","ZamRock Radio ;!","ZamRock Radio ;P","ZamRock Radio", "ZamRock Radio", "ZamRock R4dio", "ZamR0ck R4dio", "ZamR0ck R4di0", "Z4mR0ck R4di0", "Z4mR0ck R4d10", "Z4m20ck R4d10", "Z4m20ck 24d10", "24m20ck 24d10"];

// Function to change the title periodically with random interval
function animateTitle() {
    var currentIndex = 0;

    function changeTitle() {
        document.title = titles[currentIndex];
        currentIndex = (currentIndex + 1) % titles.length;

        var interval = Math.floor(Math.random() * 2000) + 500; // Generate random interval between 500 and 2000 milliseconds
        setTimeout(changeTitle, interval);
    }

    changeTitle();
}

// Set random background image from the array
var images = [
    "https://wallpapercave.com/dwp1x/wp1933959.jpg",
    "https://wallpapercave.com/dwp1x/wp1933958.jpg",
    "https://wallpapercave.com/dwp1x/wp1933952.jpg",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_001.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_002.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_003.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_004.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_005.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_006.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_007.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_008.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_009.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_010.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_011.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_012.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_013.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_014.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_015.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_016.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_017.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_018.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_019.jpg?raw=true",
    "https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_020.jpg?raw=true",
];

// Set initial random background
var randomIndex = Math.floor(Math.random() * images.length);
var backgroundImage = "url('" + images[randomIndex] + "')";
document.body.style.backgroundImage = backgroundImage;

// Change background every 30 seconds
setInterval(function() {
    randomIndex = Math.floor(Math.random() * images.length);
    backgroundImage = "url('" + images[randomIndex] + "')";
    document.body.style.backgroundImage = backgroundImage;
}, 30000);

// Toggle menu function
function toggleMenu() {
    document.getElementById('menu').classList.toggle('open');
    document.querySelector('.container').classList.toggle('open');
    // Close all active submenus when menu is closed
    var activeSubmenus = document.querySelectorAll('.submenu.active');
    for (var i = 0; i < activeSubmenus.length; i++) {
        activeSubmenus[i].classList.remove('active');
    }
}

// Toggle submenu function
function toggleSubMenu(link) {
    var submenu = link.nextElementSibling;
    var isActive = submenu.classList.contains('active');
    // Close all active submenus
    var activeSubmenus = document.querySelectorAll('.submenu.active');
    for (var i = 0; i < activeSubmenus.length; i++) {
        var activeSubmenu = activeSubmenus[i];
        if (activeSubmenu !== submenu) {
            activeSubmenu.classList.remove('active');
        }
    }
    if (isActive) {
        submenu.classList.remove('active');
    } else {
        submenu.classList.add('active');
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    var menu = document.getElementById('menu');
    var toggleBtn = document.querySelector('.toggle-menu');
    if (!menu.contains(event.target) && event.target !== toggleBtn) {
        menu.classList.remove('open');
        document.querySelector('.container').classList.remove('open');
        // Close all active submenus
        var activeSubmenus = document.querySelectorAll('.submenu.active');
        for (var i = 0; i < activeSubmenus.length; i++) {
            activeSubmenus[i].classList.remove('active');
        }
    }
});

// Start title animation when the page loads
window.onload = animateTitle;
