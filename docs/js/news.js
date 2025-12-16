// news.js – Handles fetching and displaying Mastodon posts

'use strict';

/**
 * Formats a date string for display.
 *
 * @param {string} dateString – ISO‑8601 date string.
 * @returns {string} – Human‑readable date.
 */
function formatDate(dateString) {
  const options = {
    year:    'numeric',
    month:   'long',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Creates a news card element with a Mastodon embed.
 *
 * @param {Object} post – Post object returned by Mastodon's API.
 * @returns {HTMLElement} – The card element.
 */
function createNewsCard(post) {
  const card = document.createElement('div');
  card.className = 'news-card';

  // Loading indicator
  const loading = document.createElement('div');
  loading.className = 'loading-embed';
  loading.textContent = 'Loading post...';

  // Mastodon embed iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'mastodon-embed';
  iframe.src = `${post.url}/embed`;
  iframe.width = '100%';
  iframe.height = '300';
  iframe.style.border = '0';
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');

  // Show loading indicator until iframe is ready
  iframe.onload = function () {
    loading.style.display = 'none';

    // Inject dark‑theme style into the iframe
    const style = document.createElement('style');
    style.textContent = `
      .mastodon-embed {
        background: #2e3440 !important;
        color: #d8dee9 !important;
      }
      .mastodon-embed .button {
        background: #81a1c1 !important;
        color: #2e3440 !important;
      }
      .mastodon-embed .button:hover {
        background: #88c0d0 !important;
      }
    `;
    // Guard against missing iframe document
    if (iframe.contentDocument && iframe.contentDocument.head) {
      iframe.contentDocument.head.appendChild(style);
    }
  };

  card.appendChild(loading);
  card.appendChild(iframe);

  return card;
}

/**
 * Loads Mastodon news posts and renders them into the given container.
 *
 * @param {number}   limit       – Number of posts to fetch (default 4).
 * @param {string}   containerId – ID of the container element (default 'newsContainer').
 */
async function loadNews(limit = 4, containerId = 'newsContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<div class="loading">Loading news...</div>';

  try {
    // Use AllOrigins as a CORS proxy
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const apiUrl =
      `https://musicworld.social/api/v1/accounts/114289974100154452/statuses?limit=${limit}&exclude_replies=true&exclude_reblogs=true`;

    const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const posts = JSON.parse(data.contents);

    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML =
        '<div class="no-news">No news available at the moment.</div>';
      return;
    }

    // Render news cards
    container.innerHTML = '';
    container.className = 'news-grid';

    posts.forEach((post) => {
      const card = createNewsCard(post);
      container.appendChild(card);
    });

    // Load Mastodon embed script if it hasn't been loaded yet
    if (!window.MastodonEmbed) {
      const script = document.createElement('script');
      script.src = 'https://mastodon.social/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Refresh embeds if script already exists
      window.MastodonEmbed?.();
    }
  } catch (error) {
    console.error('Error loading news:', error);
    container.innerHTML = `
      <div class="error">
        <p>
          Failed to load news. You broke it...
          <br>Press that reload button or go directly to our news feed
          <a href="https://musicworld.social/@ZamRock" style="color: #ffcc00; font-weight: bold; text-decoration: underline;">
            here
          </a>.
        </p>
        <p><small>Error: ${error.message}</small></p>
      </div>`;
  }
}

// Expose globally so you can call it from HTML or other scripts.
window.loadNews = loadNews;
