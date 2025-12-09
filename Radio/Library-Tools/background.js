// background.js – MV3 service worker

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'copy-genre') {
    // Get the active tab and send a message to the content script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {type: 'getGenreString'}, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message to tab:', chrome.runtime.lastError);
          }
        });
      }
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: message.title || 'Notification',
      message: message.message || ''
    });
  }
  
  // Return true to indicate we will send a response asynchronously
  return true;
});