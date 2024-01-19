const body = document.querySelector('body');
const backgrounds = [
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_006.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_015.jpg?raw=true',
  'https://github.com/DeathSmack/zamrock/blob/main/graphics/website_bg/website_bg_005.jpg?raw=true',
  // Add as many paths to images as you want
];
const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
body.style.background = `url(${randomBackground}) no-repeat center center fixed`;
body.style.backgroundSize = 'cover';
