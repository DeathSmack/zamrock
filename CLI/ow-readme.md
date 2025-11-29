
# ZamRock CLI: Your Immersive Terminal Audio Experience

ZamRock CLI is a command-line masterpiece designed to elevate your listening experience of ZamRock radio directly within your terminal.  It's more than just playback; it's an interactive, dynamic hub blending real-time audio, community features, and personalized controls.

**Key Features:**

* **Command-Driven Control:**  Effortlessly pause/resume (`p`), manage timers (including the playful "Ramen Noodle Timer"), record segments on-demand (`a`), and search lyrics (`l`) – all with intuitive commands.
* **Community & Info at Your Fingertips (`i`):**  Directly access ZamRock's website, Matrix, Mastodon, Discord, and Revolt servers, keeping you connected to the vibrant community.
* **Real-Time Feedback & Visual Flair:**
    *  Constantly updated "Now Playing" display with stylized logo.
    *  Customizable typewriter effect (`t`) for output adds personality.
* **Robust Recording & Archiving:** Capture snippets of your favorite tracks with duration selection and dedicated storage options.
* **Seamless Integration:**  Built with `tmux` for persistent sessions, ensuring the interface remains active even in the background.  Asynchronous operations (lyric fetching, timer updates) enhance responsiveness. Modular design allows for future expansions and plugins.

**Technical Prowess:**

* **Colorized Output & ANSI Escape Codes:**  A visually appealing terminal experience.
* **Graceful Handling:**  `trap` statements ensure clean exits and manage interruptions (SIGINT, SIGTERM).
* **Input Management:**  Timeout mechanisms prevent script freezes and handle unresponsive input gracefully.

**Future Directions:**

* Advanced recording formats, cloud storage, and metadata display.
*  Potential web UI companion for a richer dashboard.
*  Plugin/extension system for customization and expanded functionality.
*  Machine learning integration for personalized music recommendations.


**Get Started:**

1. **Clone the Repository:**  `git clone <repository_url>`
2. **Installation & Dependencies:**  Follow the setup instructions (detailed in a separate `INSTALL.md` file) to ensure all required tools and libraries are installed.
3. **Run the CLI:**  `./zamrock_cli`  and dive into the interactive world of ZamRock in your terminal!

**Join the Community:** Connect with fellow ZamRock enthusiasts on our various platforms (links provided in the repository's `INFO.md`). We thrive on feedback and collaboration!
