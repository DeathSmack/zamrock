let isLoading = false;
let loadedOnce = false;
let lastPostId = null;  // NEW: track pagination

async function loadNews(limit = 2, containerId = 'newsContainer', append = false) {
  if (isLoading) return;
  isLoading = true;

  const container = document.getElementById(containerId);
  if (!container) return;

  if (!append) {
    container.innerHTML = '<div class="loading">Loading news...</div>';
    lastPostId = null;  // reset when not appending
  }

  try {
    const proxy = 'https://corsproxy.io/?url=';
    let api =
      'https://musicworld.social/api/v1/accounts/114289974100154452/statuses' +
      `?limit=${limit}&exclude_replies=true&exclude_reblogs=true`;

    // ADD PAGINATION
    if (lastPostId) {
      api += `&max_id=${lastPostId}`;
    }

    const response = await fetch(proxy + encodeURIComponent(api));
    if (!response.ok) throw new Error('Network error');

    const posts = await response.json();

    if (!posts.length) {
      container.innerHTML = '<div class="no-news">No news available.</div>';
      return;
    }

    if (!append) {
      container.innerHTML = '';
      container.className = 'news-grid';
    }

    posts.forEach(post => container.appendChild(createNewsCard(post)));

    // UPDATE lastPostId for pagination
    lastPostId = posts[posts.length - 1].id;

    addLoadMoreButton(containerId);

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="error">
        Failed to load news 😿<br>
        <small>${err.message}</small>
      </div>`;
  } finally {
    isLoading = false;
    loadedOnce = true;
  }
}

// Lazy-load when visible
function setupLazyLoad() {
  const container = document.getElementById('newsContainer');
  if (!container) return;

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !loadedOnce) {
      loadNews(2);
      observer.disconnect();
    }
  }, {
    rootMargin: '200px'
  });

  observer.observe(container);
}

// Pagination button
function addLoadMoreButton(containerId) {
  if (document.getElementById('loadMoreNews')) return;

  const btn = document.createElement('button');
  btn.id = 'loadMoreNews';
  btn.className = 'btn load-more';
  btn.textContent = 'Load More';

  btn.onclick = () => loadNews(2, containerId, true);

  document.querySelector('.news-section')?.appendChild(btn);
}

// Init
document.addEventListener('DOMContentLoaded', setupLazyLoad);

// Expose for debugging if needed
window.loadNews = loadNews;