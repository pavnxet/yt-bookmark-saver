// js/background.js

/**
 * Background Service Worker (Watchdog)
 * Handles navigation updates and signals the content script.
 */

// Listen for tab updates to detect YouTube video navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the update is a completion of the page load or navigation
  // and if the URL is a YouTube watch page.
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    try {
      const urlObj = new URL(tab.url);
      const videoId = urlObj.searchParams.get('v');

      if (videoId) {
        console.log(`[Watchdog] New video detected: ${videoId}`);

        // Send signal to content script
        // We use a simple sendMessage. Content script should be listening.
        chrome.tabs.sendMessage(tabId, {
          type: 'NEW_VIDEO',
          videoId: videoId
        }).catch(err => {
          // It's possible the content script is not yet ready or the tab is closed
          console.log('[Watchdog] Message delivery failed (content script might not be ready):', err);
        });
      }
    } catch (e) {
      console.error('[Watchdog] Error parsing URL:', e);
    }
  }
});

// Brave Optimization:
// We avoid keeping state in memory. All state is stored in chrome.storage.
// This service worker is event-driven and will wake up on navigation.
