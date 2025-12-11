// news.js - Handles fetching and displaying Mastodon posts

// Function to format date
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Function to create a news card with Mastodon embed
function createNewsCard(post) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    // Create iframe for Mastodon embed
    const iframe = document.createElement('iframe');
    iframe.className = 'mastodon-embed';
    iframe.src = `${post.url}/embed`;
    iframe.width = '100%';
    iframe.height = '300';
    iframe.style.border = '0';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.setAttribute('data-lang', 'en');
    
    // Add loading indicator
    const loading = document.createElement('div');
    loading.className = 'loading-embed';
    loading.textContent = 'Loading post...';
    
    // Handle iframe load
    iframe.onload = function() {
        loading.style.display = 'none';
        // Force dark theme
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
        iframe.contentDocument.head.appendChild(style);
    };
    
    card.appendChild(loading);
    card.appendChild(iframe);
    
    return card;
}

// Function to load news from Mastodon with CORS proxy
async function loadNews(limit = 3, containerId = 'newsContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Loading news...</div>';
    
    try {
        // Using CORS proxy for GitHub Pages
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const apiUrl = `https://musicworld.social/api/v1/accounts/114289974100154452/statuses?limit=${limit}&exclude_replies=true&exclude_reblogs=true`;
        const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const posts = JSON.parse(data.contents);
        
        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML = '<div class="no-news">No news available at the moment.</div>';
            return;
        }
        
        // Clear loading message
        container.innerHTML = '';
        container.className = 'news-grid';
        
        // Create and append news cards
        posts.forEach(post => {
            const card = createNewsCard(post);
            container.appendChild(card);
        });
        
        // Load Mastodon embed script if not already loaded
        if (!window.MastodonEmbed) {
            const script = document.createElement('script');
            script.src = 'https://mastodon.social/embed.js';
            script.async = true;
            document.body.appendChild(script);
        } else {
            // Refresh embeds if script was already loaded
            window.MastodonEmbed?.();
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = `
            <div class="error">
                <p>Failed to load news. Please check your connection and try again.</p>
                <p><small>Error: ${error.message}</small></p>
            </div>`;
    }
}

// Make loadNews available globally
window.loadNews = loadNews;