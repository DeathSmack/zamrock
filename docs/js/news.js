'use strict'

// Create a news card element with a Mastodon embed.
function createNewsCard(post) {
  const card = document.createElement('div')
  card.className = 'news-card'

  const loading = document.createElement('div')
  loading.className = 'loading-embed'
  loading.textContent = 'Loading post...'

  const iframe = document.createElement('iframe')
  iframe.className = 'mastodon-embed'
  iframe.src = `${post.url}/embed`
  iframe.width = '100%'
  iframe.height = '300'
  iframe.style.border = '0'
  iframe.setAttribute('allowfullscreen', '')
  iframe.setAttribute('loading', 'lazy')

  iframe.onload = function () {
    loading.style.display = 'none'

    const style = document.createElement('style')
    style.textContent = `
      .mastodon-embed { background:#2e3440 !important; color:#d8dee9 !important; }
      .mastodon-embed .button { background:#81a1c1 !important; color:#2e3440 !important; }
      .mastodon-embed .button:hover { background:#88c0d0 !important; }
    `
    if (iframe.contentDocument && iframe.contentDocument.head)
      iframe.contentDocument.head.appendChild(style)
  }

  card.appendChild(loading)
  card.appendChild(iframe)

  return card
}

// Load Mastodon news posts and render them into the given container.
async function loadNews(limit = 4, containerId = 'news-container') {
  const container = document.getElementById(containerId)
  if (!container) return

  container.innerHTML = '<div class="loading">Loading news...</div>'

  try {
    const proxyUrl = 'https://api.allorigins.win/get?url='
    const apiUrl =
      `https://musicworld.social/api/v1/accounts/114289974100154452/statuses?limit=${limit}&exclude_replies=true&exclude_reblogs=true`

    const response = await fetch(proxyUrl + encodeURIComponent(apiUrl))
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    const posts = JSON.parse(data.contents)

    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML =
        '<div class="no-news">No news available at the moment.</div>'
      return
    }

    container.innerHTML = ''
    container.className = 'news-grid'

    posts.forEach(post => {
      const card = createNewsCard(post)
      container.appendChild(card)
    })

    if (!window.MastodonEmbed) {
      const script = document.createElement('script')
      script.src = 'https://mastodon.social/embed.js'
      script.async = true
      document.body.appendChild(script)
    } else {
      window.MastodonEmbed?.()
    }
  } catch (error) {
    console.error('Error loading news:', error)
    container.innerHTML = `
      <div class="error">
        <p>
          Failed to load news. You broke it...
          <br>Press that reload button or go directly to our news feed
          <a href="https://musicworld.social/@ZamRock" style="color:#ffcc00;font-weight:bold;text-decoration:underline;">
            here
          </a>.
        </p>
        <p><small>Error: ${error.message}</small></p>
      </div>`
  }
}

// Expose globally so you can call it from HTML or other scripts.
window.loadNews = loadNews
