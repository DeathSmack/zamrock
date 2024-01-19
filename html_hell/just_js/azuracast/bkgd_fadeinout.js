body {
  background-image: url('https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_006.jpg?raw=true');
  background-size: cover;
  background-position: center;
  transition: opacity 2s ease-in-out;
  opacity: 1;
}

.fade-out {
  opacity: 0;
}







const body = document.querySelector('body');
const backgrounds = [
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_006.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_015.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_005.jpg?raw=true',
  // Add as many paths to images as you want
];

let currentIndex = 0;
let nextIndex = 1;
const fadeDuration = 2000;
const fadeDelay = 5000;

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

  // Fade out the current background image
  body.classList.add('fade-out');
  setTimeout(() => {
    // Change to the next background image
    body.style.backgroundImage = `url(${nextBackground})`;

    // Remove the fade-out class and fade in the next background image
    body.classList.remove('fade-out');
  }, fadeDuration / 2);

  currentIndex = nextIndex;
  nextIndex = (nextIndex + 1) % backgrounds.length;

  setTimeout(changeBackground, fadeDelay);
}

preloadImage(backgrounds[0]).then(() => {
  body.style.backgroundImage = `url(${backgrounds[0]})`;
  setTimeout(changeBackground, fadeDelay);
});
