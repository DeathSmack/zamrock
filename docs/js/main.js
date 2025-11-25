// Wait for the DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('radioStream');
    const playButton = document.getElementById('playButton');
    const volumeSlider = document.getElementById('volumeSlider');

    // Set initial volume
    audio.volume = 0.5;
    let isPlaying = false;

    // Function to handle play/pause
    const togglePlay = () => {
        if (audio.paused) {
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Playback failed:', error);
                    playButton.textContent = 'Click to Play';
                    // Add a one-time click handler to start on next click
                    const startOnClick = () => {
                        audio.play()
                            .then(() => {
                                isPlaying = true;
                                playButton.textContent = 'Stop';
                            })
                            .catch(e => console.error('Still failed:', e));
                    };
                    document.addEventListener('click', startOnClick, { once: true });
                });
            }
            
            isPlaying = true;
            playButton.textContent = 'Stop';
        } else {
            audio.pause();
            isPlaying = false;
            playButton.textContent = 'Play';
        }
    };

    // Play button click
    playButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
    });

    // Spacebar to play/pause
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            togglePlay();
        }
    });

    // Volume control
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value / 100;
        });
    }

    // Handle audio events
    audio.addEventListener('play', () => {
        isPlaying = true;
        playButton.textContent = 'Stop';
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        playButton.textContent = 'Play';
    });

    // Try to start automatically (browsers may block this)
    const tryAutoPlay = () => {
        const promise = audio.play();
        if (promise !== undefined) {
            promise.catch(() => {
                // Auto-play was prevented, show play button
                playButton.textContent = 'Play';
            });
        }
    };

    // Try to start after a short delay
    setTimeout(tryAutoPlay, 1000);
});

// Handle menu toggle
function toggleMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.toggle('open');
    }
}

// Close menu when clicking outside
document.addEventListener('click', (event) => {
    const menu = document.getElementById('menu');
    const toggleBtn = document.querySelector('.toggle-menu');
    
    if (menu && !menu.contains(event.target) && event.target !== toggleBtn) {
        menu.classList.remove('open');
    }
});
