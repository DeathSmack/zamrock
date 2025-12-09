// content_script.js

// Scrape the main genre and subgenres
function scrapeGenre() {
  try {
    // First try to find the main genre in the first section
    let mainGenre = '';
    const genreSections = document.querySelectorAll('div.flex.flex-col.gap-4.max-sm\\:w-full.items-center.w-full');
    
    // Get the first genre from the first section
    if (genreSections.length > 0) {
      const firstGenre = genreSections[0].querySelector('span.ps-2');
      if (firstGenre) {
        mainGenre = firstGenre.textContent.trim();
      }
    }

    // If we still don't have a main genre, try alternative selectors
    if (!mainGenre) {
      const altMainGenre = document.querySelector('div.flex.items-center.justify-between.w-full.p-2.rounded-lg.bg-gray-100.dark\\:bg-gray-800 span.ps-2');
      if (altMainGenre) {
        mainGenre = altMainGenre.textContent.trim();
      }
    }

    // Get all subgenres from the second genre section
    let subgenres = [];
    if (genreSections.length > 1) {
      subgenres = Array.from(genreSections[1].querySelectorAll('span.ps-2'))
        .map(el => el.textContent.trim())
        .filter(Boolean)
        .slice(0, 5); // Get first 5 subgenres
    }

    // Format as 'main:sub1|sub2|sub3|sub4|sub5' or just subgenres if no main genre
    return mainGenre ? `${mainGenre}:${subgenres.join('|')}` : subgenres.join('|');
  } catch (error) {
    console.error('Error scraping genre:', error);
    return 'Error: Could not extract genre information';
  }
}

// Scrape the AI descriptive text (comments)
function scrapeComments() {
  try {
    // Find the AI descriptive text section
    const aiSection = document.querySelector('p.text-2xl.font-bold.mb-4.flex.items-center');
    if (!aiSection) return 'No AI description found';
    
    // Get the parent container that holds the description
    const parentContainer = aiSection.closest('div.flex.flex-col.items-center');
    if (!parentContainer) return 'Parent container not found';
    
    // Find the description text - it's in a span inside a flex container
    const descriptionContainer = parentContainer.querySelector('div.flex.flex-col.gap-3.items-start');
    if (!descriptionContainer) return 'Description text not found';
    
    // Get the first span that contains the actual description
    const descriptionSpan = descriptionContainer.querySelector('span:first-child');
    if (!descriptionSpan) return 'No description text found';
    
    // Return the cleaned-up text
    return descriptionSpan.textContent.trim();
  } catch (error) {
    console.error('Error scraping comments:', error);
    return 'Error: Could not extract comments';
  }
}

// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getGenreString') {
    sendResponse({ ok: true, data: scrapeGenre() });
  } else if (request.type === 'getCommentString') {
    sendResponse({ ok: true, data: scrapeComments() });
  }
  return true; // Required for async response
});
