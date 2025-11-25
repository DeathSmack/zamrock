// ... (keep the existing title animation and background code) ...

// Audio player controls
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('radioStream');
    const playButton = document.getElementById('playButton');
    const volumeContainer = document.getElementById('volumeContainer');
    const volumeSlider = document.getElementById('volumeSlider');

    if (audio && playButton) {
        // Remove autoplay and muted attributes to prevent conflicts
        audio.removeAttribute('autoplay');
        audio.removeAttribute('muted');
        audio.volume = 0.5; // Default volume to 50%

        // Update button text based on audio state
        const updateButtonText = () => {
            playButton.textContent = audio.paused ? 'Play' : 'Stop';
        };

        // Handle play/pause
        const togglePlay = (e) => {
            if (e) e.stopPropagation();
            
            if (audio.paused) {
                // On first play, we need user interaction
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Play failed, trying with user gesture...');
                        // Show a message to the user that they need to interact
                        playButton.textContent = 'Click to play';
                        // Remove any existing listeners to prevent duplicates
                        document.removeEventListener('click', firstInteraction);
                        document.addEventListener('click', firstInteraction, { once: true });
                    });
                }
            } else {
                audio.pause();
            }
            updateButtonText();
        };

        // Handle first user interaction
        const firstInteraction = () => {
            audio.play().then(() => {
                updateButtonText();
                // Remove the muted attribute if it exists
                audio.muted = false;
            }).catch(e => console.error('Playback failed:', e));
        };

        // Initial setup
        updateButtonText();
        
        // Play button click
        playButton.addEventListener('click', togglePlay);

        // Spacebar to play/pause
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            }
        });

        // Volume control
        if (volumeSlider) {
            // Set initial volume slider position
            volumeSlider.value = audio.volume * 100;

            // Update volume when slider changes
            volumeSlider.addEventListener('input', (e) => {
                audio.volume = e.target.value / 100;
                // Unmute when adjusting volume
                audio.muted = false;
            });
        }

        // Show/hide volume control on hover
        if (volumeContainer) {
            playButton.addEventListener('mouseenter', () => {
                volumeContainer.style.display = 'block';
            });
            
            volumeContainer.addEventListener('mouseleave', () => {
                volumeContainer.style.display = 'none';
            });
        }

        // Handle audio events
        audio.addEventListener('play', updateButtonText);
        audio.addEventListener('pause', updateButtonText);
        audio.addEventListener('ended', updateButtonText);
    }
});

// ... (rest of your existing code) ...
