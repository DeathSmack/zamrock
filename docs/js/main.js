document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('radioStream');
    const playButton = document.getElementById('playButton');
    const volumeSlider = document.getElementById('volumeSlider');

    // Set initial volume
    audio.volume = 0.5;

    // Toggle play/pause
    playButton.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                playButton.textContent = 'Stop';
            }).catch(error => {
                console.error('Playback failed:', error);
                playButton.textContent = 'Click to Play';
                // Add one-time click handler to start on next click
                const startOnClick = () => {
                    audio.play().then(() => {
                        playButton.textContent = 'Stop';
                        document.removeEventListener('click', startOnClick);
                    });
                };
                document.addEventListener('click', startOnClick, { once: true });
            });
        } else {
            audio.pause();
            playButton.textContent = 'Play';
        }
    });

    // Volume control
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value / 100;
        });
    }

    // Handle spacebar for play/pause
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            playButton.click();
        }
    });
});
