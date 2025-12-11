// news.js - Handles fetching and displaying Mastodon posts

// Function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Function to strip HTML tags from content
function stripHtml(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

// Function to create a news card
function createNewsCard(post) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    const content = stripHtml(post.content);
    const title = content.split('\n')[0] || 'Update';
    const body = content.length > 150 ? content.substring(0, 150) + '...' : content;
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title.substring(0, 50);
    
    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = formatDate(post.created_at);
    
    const contentEl = document.createElement('p');
    contentEl.textContent = body;
    
    const link = document.createElement('a');
    link.href = post.url || '#';
    link.textContent = 'Read more on Mastodon';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    card.appendChild(titleEl);
    card.appendChild(date);
    card.appendChild(contentEl);
    card.appendChild(link);
    
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
        const apiUrl = `https://musicworld.social/api/v1/accounts/114289974100154452/statuses?limit=${limit}`;
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