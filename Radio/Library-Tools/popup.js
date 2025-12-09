// Function to show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: title,
    message: message,
    priority: 1
  });
}

// Function to copy text to clipboard and show notification
async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Success', successMessage);
  } catch (error) {
    console.error('Failed to copy text:', error);
    showNotification('Error', 'Failed to copy to clipboard');
  }
}

// Function to execute content script and handle response
function executeContentScript(type) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].id) {
        resolve({ ok: false, error: 'No active tab found' });
        return;
      }

      // Execute the content script in the active tab
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content_script.js']
      }, () => {
        // Send message to get the data
        chrome.tabs.sendMessage(tabs[0].id, { type }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ 
              ok: false, 
              error: 'Failed to communicate with content script',
              details: chrome.runtime.lastError.message
            });
          } else {
            resolve(response || { ok: false, error: 'No response from content script' });
          }
        });
      });
    });
  });
}

// Copy Genre button handler
document.getElementById('copyGenreBtn').addEventListener('click', async () => {
  const result = await executeContentScript('getGenreString');
  if (result && result.ok) {
    await copyToClipboard(result.data, 'Genre copied to clipboard!');
  } else {
    showNotification('Error', result?.error || 'Failed to extract genre information');
  }
});

// Copy Comments button handler
document.getElementById('copyCommentBtn').addEventListener('click', async () => {
  const result = await executeContentScript('getCommentString');
  if (result && result.ok) {
    await copyToClipboard(result.data, 'Comments copied to clipboard!');
  } else {
    showNotification('Error', result?.error || 'Failed to extract comments');
  }
});