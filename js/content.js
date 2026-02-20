// js/content.js

(function() {
  const Utils = window.YTBookmarkUtils;

  let currentVideoId = new URLSearchParams(window.location.search).get('v');
  let playerControls = null;
  let progressBar = null;
  let observer = null;

  // Initialize UI injection
  function init() {
    // Update video ID
    currentVideoId = new URLSearchParams(window.location.search).get('v');
    if (!currentVideoId) return;

    // Disconnect existing observer if any
    if (observer) {
        observer.disconnect();
    }

    // Wait for player controls to appear
    observer = new MutationObserver((mutations, obs) => {
        const controls = document.querySelector('.ytp-left-controls');
        const progress = document.querySelector('.ytp-progress-bar');
        const video = document.querySelector('video');

        if (controls && progress && video) {
            playerControls = controls;
            progressBar = progress;
            injectButton();
            renderDots();
            // We keep observing to handle DOM updates (YouTube does this often)
            // But we need to be careful not to spam injections.
            // injectButton checks if button exists.
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
  }

  // Inject Bookmark Button into Player Controls
  function injectButton() {
    if (document.querySelector('.ytp-bookmark-btn')) return;

    if (!playerControls) return;

    const btn = document.createElement('button');
    btn.className = 'ytp-button ytp-bookmark-btn';
    btn.title = 'Add Bookmark (Alt+B)';
    btn.innerHTML = `
      <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
        <path d="M10,28 L10,8 L26,8 L26,28 L18,20 L10,28 Z" fill="#fff"></path>
      </svg>
    `;
    btn.addEventListener('click', addNewBookmark);

    // Append to controls
    playerControls.appendChild(btn);
  }

  // Render Bookmark Dots on Progress Bar
  async function renderDots() {
    if (!currentVideoId || !progressBar) return;

    // Wait for video duration
    const video = document.querySelector('video');
    if (!video || isNaN(video.duration)) {
        // Retry shortly if duration not ready
        setTimeout(renderDots, 500);
        return;
    }

    // Clean up existing dots
    const existingDots = document.querySelectorAll('.bt-yt-bookmark-dot');
    existingDots.forEach(dot => dot.remove());

    const bookmarks = await Utils.getBookmarks(currentVideoId);
    const duration = video.duration;

    bookmarks.forEach(bookmark => {
        const dot = document.createElement('div');
        dot.className = 'bt-yt-bookmark-dot';
        // Calculate position percentage
        const percent = (bookmark.time / duration) * 100;
        dot.style.left = `${percent}%`;
        dot.title = `${Utils.formatTime(bookmark.time)} - ${bookmark.note || 'Bookmark'}`;

        dot.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent seek bar default behavior if needed
            e.preventDefault();
            video.currentTime = bookmark.time;
        });

        progressBar.appendChild(dot);
    });
  }

  // Add a new bookmark at current time
  async function addNewBookmark() {
    const video = document.querySelector('video');
    if (!video) return;

    const time = video.currentTime;
    const note = `Bookmark at ${Utils.formatTime(time)}`;

    await Utils.addBookmark(currentVideoId, time, note);
    renderDots(); // Refresh UI
  }

  // Listen for messages from background or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NEW_VIDEO') {
        console.log('[Content] New video detected:', message.videoId);
        currentVideoId = message.videoId;
        init(); // Re-initialize for new video page structure
        renderDots();
    } else if (message.type === 'JUMP_TO_TIMESTAMP') {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = message.timestamp;
            video.play();
        }
    } else if (message.type === 'REFRESH_BOOKMARKS') {
        renderDots();
    }
  });

  // Global Keyboard Shortcut (Alt+B)
  document.addEventListener('keydown', (e) => {
    // Check if user is typing in an input field
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable) {
        return;
    }

    if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        addNewBookmark();
    }
  });

  // Initial setup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
