// js/content.js

(function() {
  const Utils = window.YTBookmarkUtils;

  let currentVideoId = new URLSearchParams(window.location.search).get('v');
  let playerControls = null;
  let progressBar = null;
  let pollingInterval = null;

  // Logger Logic
  const Logger = {
    logs: [],
    MAX_LOGS: 50,

    init: function() {
        this.createUI();
        this.hookConsole();
    },

    createUI: function() {
        // Create Toggle Button
        const toggleBtn = document.createElement('div');
        toggleBtn.id = 'bt-yt-debug-btn';
        toggleBtn.textContent = '🐛 Logs';
        toggleBtn.title = 'Click to show debug logs';
        toggleBtn.addEventListener('click', () => {
            const win = document.getElementById('bt-yt-log-window');
            if (win.style.display === 'none') {
                win.style.display = 'flex';
            } else {
                win.style.display = 'none';
            }
        });
        document.body.appendChild(toggleBtn);

        // Create Log Window
        const logWindow = document.createElement('div');
        logWindow.id = 'bt-yt-log-window';
        logWindow.style.display = 'none'; // hidden by default

        // Header (Draggable)
        const header = document.createElement('div');
        header.className = 'bt-yt-log-header';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = 'Extension Logs';
        header.appendChild(titleSpan);

        // Controls Container
        const controls = document.createElement('div');

        // Clear Button
        const clearBtn = document.createElement('span');
        clearBtn.textContent = '🚫';
        clearBtn.title = 'Clear Logs';
        clearBtn.style.cursor = 'pointer';
        clearBtn.style.marginRight = '10px';
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent drag start
            document.getElementById('bt-yt-log-content').innerHTML = '';
        });
        controls.appendChild(clearBtn);

        // Close Button
        const closeBtn = document.createElement('span');
        closeBtn.textContent = '✕';
        closeBtn.title = 'Close';
        closeBtn.style.cursor = 'pointer';
        closeBtn.addEventListener('click', () => {
            logWindow.style.display = 'none';
        });
        controls.appendChild(closeBtn);

        header.appendChild(controls);

        // Content Area
        const content = document.createElement('div');
        content.id = 'bt-yt-log-content';

        logWindow.appendChild(header);
        logWindow.appendChild(content);
        document.body.appendChild(logWindow);

        this.makeDraggable(logWindow, header);
    },

    makeDraggable: function(el, handle) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = el.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            handle.style.cursor = 'grabbing';
            e.preventDefault(); // prevent text selection
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.style.left = `${initialLeft + dx}px`;
            el.style.top = `${initialTop + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            handle.style.cursor = 'grab';
        });
    },

    log: function(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.className = `bt-yt-log-line ${type}`;
        line.textContent = `[${timestamp}] ${msg}`;

        const content = document.getElementById('bt-yt-log-content');
        if (content) {
            content.appendChild(line);
            if (content.children.length > this.MAX_LOGS) {
                content.removeChild(content.firstChild);
            }
            content.scrollTop = content.scrollHeight;
        }

        // Also log to console
        if (type === 'error') {
            console.error('[YT-Ext]', msg);
        } else {
            console.log('[YT-Ext]', msg);
        }
    },

    hookConsole: function() {
        // Capture window errors
        window.addEventListener('error', (event) => {
            this.log(`Global Error: ${event.message} at ${event.filename}:${event.lineno}`, 'error');
        });
        window.addEventListener('unhandledrejection', (event) => {
            this.log(`Unhandled Promise: ${event.reason}`, 'error');
        });
    }
  };


  // Main Extension Logic (Modified to use Logger)

  function init() {
    Logger.log('Initializing extension logic...');

    // Update video ID
    currentVideoId = new URLSearchParams(window.location.search).get('v');
    Logger.log(`Current Video ID: ${currentVideoId}`);

    // Clear any existing interval
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    if (!currentVideoId) {
        Logger.log('No video ID found. Waiting for navigation...', 'warn');
        return;
    }

    // Polling Mechanism to replace MutationObserver
    Logger.log('Starting Polling (1000ms)...');

    // Initial check
    checkAndInject();

    pollingInterval = setInterval(checkAndInject, 1000);
  }

  function checkAndInject() {
    // Stop if we left the page (though init is called on nav)
    // Actually, background script handles navigation triggers.

    const controls = document.querySelector('.ytp-left-controls');
    const progress = document.querySelector('.ytp-progress-bar');
    const video = document.querySelector('video');

    if (controls && progress && video) {
        let needsInjection = false;

        // Check if we lost reference or they were removed from DOM
        if (!playerControls || !document.contains(playerControls)) {
             playerControls = controls;
             needsInjection = true;
        }
        if (!progressBar || !document.contains(progressBar)) {
             progressBar = progress;
             needsInjection = true;
        }

        // Also check if button is missing (e.g. re-render)
        if (!document.querySelector('.ytp-bookmark-btn')) {
            needsInjection = true;
        }

        if (needsInjection) {
             Logger.log('Controls found/updated. Injecting UI...');
             injectButton();
             renderDots();
        }
    }
  }

  // Inject Bookmark Button into Player Controls
  function injectButton() {
    if (document.querySelector('.ytp-bookmark-btn')) return;

    if (!playerControls) {
        Logger.log('Cannot inject button: playerControls missing', 'error');
        return;
    }

    Logger.log('Injecting bookmark button...');
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
    try {
        playerControls.appendChild(btn);
        Logger.log('Button injected successfully.');
    } catch (e) {
        Logger.log(`Failed to inject button: ${e.message}`, 'error');
    }
  }

  // Render Bookmark Dots on Progress Bar
  async function renderDots() {
    if (!currentVideoId || !progressBar) return;

    // Wait for video duration
    const video = document.querySelector('video');
    if (!video || isNaN(video.duration)) {
        // Retry shortly if duration not ready (next poll will catch it if we fail)
        return;
    }

    // Clean up existing dots
    const existingDots = document.querySelectorAll('.bt-yt-bookmark-dot');
    existingDots.forEach(dot => dot.remove());

    try {
        const bookmarks = await Utils.getBookmarks(currentVideoId);
        Logger.log(`Rendering ${bookmarks.length} dots.`);
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
                Logger.log(`Jumped to ${bookmark.time}s`);
            });

            progressBar.appendChild(dot);
        });
    } catch (e) {
        Logger.log(`Error rendering dots: ${e.message}`, 'error');
    }
  }

  // Add a new bookmark at current time
  async function addNewBookmark() {
    const video = document.querySelector('video');
    if (!video) {
        Logger.log('Cannot add bookmark: No video element found.', 'error');
        return;
    }

    const time = video.currentTime;
    const note = `Bookmark at ${Utils.formatTime(time)}`;

    Logger.log(`Adding bookmark at ${time}s...`);
    try {
        await Utils.addBookmark(currentVideoId, time, note);
        Logger.log('Bookmark added.');
        renderDots(); // Refresh UI
    } catch (e) {
        Logger.log(`Failed to add bookmark: ${e.message}`, 'error');
    }
  }

  // Listen for messages from background or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Logger.log(`Message received: ${message.type}`);
    if (message.type === 'NEW_VIDEO') {
        Logger.log(`[Content] New video detected: ${message.videoId}`);
        currentVideoId = message.videoId;
        init(); // Re-initialize for new video page structure
        renderDots();
    } else if (message.type === 'JUMP_TO_TIMESTAMP') {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = message.timestamp;
            video.play();
            Logger.log(`Jumped to timestamp: ${message.timestamp}`);
        } else {
             Logger.log('Cannot jump: video element not found', 'error');
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

  // Handle window resize (dots position depends on bar width potentially, though % handles it)
  // But if youtube redraws... polling handles it.

  // Start Logger
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Logger.init();
        init();
    });
  } else {
    Logger.init();
    init();
  }

})();
