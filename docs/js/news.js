let isLoading = false;
let lastPostId = null;

const buffer = [];      // cache fetched posts
const displayCount = 2; // posts shown per click
const prefetchPages = 6; // pages fetched at once
const pageLimit = 2;    // posts per API call

function createNewsCard(post) {
  const card = document.createElement('article');
  card.className = 'news-card';

  card.innerHTML = `
    <div class="news-header">
      <img src="${post.account.avatar_static}" alt="" class="avatar" loading="lazy">
      <div>
        <strong>${post.account.display_name || post.account.username}</strong><br>
        <small>${new Date(post.created_at).toLocaleString()}</small>
      </div>
    </div>

    <div class="news-content">
      ${post.content}
    </div>

    ${post.media_attachments.length ? `
      <div class="news-media">
        ${post.media_attachments.map(m =>
          `<img src="${m.preview_url}" loading="lazy">`
        ).join('')}
      </div>
    ` : ''}

    <div class="news-footer">
      <a href="${post.url}" target="_blank" rel="noopener">
        View on Mastodon
      </a>
    </div>
  `;

  return card;
}

async function fetchPosts(limit, maxId) {
  const proxy = 'https://corsproxy.io/?url=';
  let api =
    'https://musicworld.social/api/v1/accounts/114289974100154452/statuses' +
    `?limit=${limit}&exclude_replies=true&exclude_reblogs=true`;

  if (maxId) api += `&max_id=${maxId}`;

  const res = await fetch(proxy + encodeURIComponent(api));
  if (!res.ok) throw new Error('Network error');

  return res.json();
}

async function prefetch() {
  if (isLoading) return;
  isLoading = true;

  try {
    for (let i = 0; i < prefetchPages; i++) {
      const posts = await fetchPosts(pageLimit, lastPostId);

      if (!posts.length) {
  document.getElementById('newsContainer').innerHTML = '<div class="no-news">No more posts.</div>';
  document.getElementById('loadMoreNews')?.remove();
  return;
}

      buffer.push(...posts);
      lastPostId = posts[posts.length - 1].id;
    }
  } catch (err) {
    console.error(err);
    document.getElementById('newsContainer').innerHTML = `
      <div class="error">
        Failed to load news 😿<br>
        <small>${err.message}</small>
      </div>`;
  } finally {
    isLoading = false;
  }
}

async function displayNext() {
  const container = document.getElementById('newsContainer');
  if (!container) return;

  if (container.querySelector('.loading')) {
    container.innerHTML = '';
  }

  if (buffer.length < displayCount * 2) await prefetch();

  for (let i = 0; i < displayCount; i++) {
    const post = buffer.shift();
    if (!post) {
      document.getElementById('loadMoreNews')?.remove();
      return;
    }
    container.appendChild(createNewsCard(post));
  }
}


function setupLazyLoad() {
  const container = document.getElementById('newsContainer');
  if (!container) return;

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      displayNext();
      observer.disconnect();
    }
  }, {
    rootMargin: '200px'
  });

  observer.observe(container);
}

function addLoadMoreButton() {
  if (document.getElementById('loadMoreNews')) return;

  const btn = document.createElement('button');
  btn.id = 'loadMoreNews';
  btn.className = 'btn load-more';
  btn.textContent = 'Load More';
  btn.onclick = displayNext;

  document.querySelector('.news-section')?.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
  setupLazyLoad();
  addLoadMoreButton();
});
