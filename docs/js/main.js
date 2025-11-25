// Simple audio player with volume control
document.addEventListener('DOMContentLoaded', function() {
    const audio = new Audio('https://zamrock.deathsmack.com/listen/zamrock/radio.mp3');
    const playButton = document.getElementById('playButton');
    const volumeSlider = document.getElementById('volumeSlider');
    
    // Set initial volume
    audio.volume = 0.5;
    if (volumeSlider) volumeSlider.value = 50;

    // Play/Pause toggle
    function togglePlay() {
        if (audio.paused) {
            audio.play().then(() => {
                playButton.textContent = 'Stop';
            }).catch(e => {
                console.error('Playback failed:', e);
                playButton.textContent = 'Click to Play';
            });
        } else {
            audio.pause();
            playButton.textContent = 'Play';
        }
    }

    // Event listeners
    if (playButton) {
        playButton.addEventListener('click', togglePlay);
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value / 100;
        });
    }

    // Spacebar control
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            togglePlay();
        }
    });
});

// Simple menu toggle
function toggleMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('menu');
    if (menu) menu.classList.toggle('open');
}

// Close menu when clicking outside
document.addEventListener('click', (event) => {
    const menu = document.getElementById('menu');
    const toggleBtn = document.querySelector('.toggle-menu');
    if (menu && !menu.contains(event.target) && event.target !== toggleBtn) {
        menu.classList.remove('open');
    }
});
