body {
  background-color: #333333; /* Dark gray color for pre-load screen */
  background-size: cover;
  background-position: center;
  transition: background-image 4s ease-in-out;
  opacity: 0; /* Add opacity: 0 for initial fade-in effect */
}

.fade-in {
  opacity: 1;
}




const body = document.querySelector('body');
const backgrounds = [
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_001.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_002.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_003.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_004.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_005.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_006.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_007.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_008.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_009.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_010.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_011.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_012.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_013.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_014.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_015.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_016.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_017.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_018.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_019.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_020.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_021.jpg?raw=true',
  // Add as many paths to images as you want
];

let currentIndex = 0;
let nextIndex = 1;
const fadeDuration = 4000; // Changed fade duration to 4 seconds
const fadeDelay = 15000; // Changed image change delay to 15 seconds

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = resolve;
    img.onerror = reject;
  });
}

async function changeBackground() {
  const currentBackground = backgrounds[currentIndex];
  const nextBackground = backgrounds[nextIndex];

  await preloadImage(nextBackground);

  // Change to the next background image
  body.style.backgroundImage = `url(${nextBackground})`;

  currentIndex = nextIndex;
  nextIndex = (nextIndex + 1) % backgrounds.length;

  setTimeout(changeBackground, fadeDelay);
}

preloadImage(backgrounds[0]).then(() => {
  body.style.backgroundImage = `url(${backgrounds[0]})`;
  setTimeout(() => {
    body.classList.add('fade-in'); // Add fade-in class to fade in the first image
    body.style.opacity = 1; // Set opacity to 1 for initial fade-in effect

    setTimeout(changeBackground, fadeDelay);
  }, fadeDuration);
});
