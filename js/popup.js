document.addEventListener('DOMContentLoaded', () => {
  const Utils = window.YTBookmarkUtils;
  const listElement = document.getElementById('bookmarks-list');
  const emptyState = document.getElementById('empty-state');
  const copyBtn = document.getElementById('copy-btn');
  let currentVideoId = null;

  async function initialize() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab || !tab.url || !tab.url.includes('youtube.com/watch')) {
      emptyState.textContent = 'Not a YouTube video page.';
      emptyState.classList.remove('hidden');
      copyBtn.disabled = true;
      return;
    }

    try {
      const url = new URL(tab.url);
      currentVideoId = url.searchParams.get('v');
    } catch (e) {
      console.error(e);
      emptyState.textContent = 'Invalid URL.';
      emptyState.classList.remove('hidden');
      return;
    }

    if (!currentVideoId) {
      emptyState.textContent = 'No video ID found.';
      emptyState.classList.remove('hidden');
      return;
    }

    renderBookmarks(currentVideoId, tab.id);

    // Copy Handler
    copyBtn.addEventListener('click', async () => {
        const bookmarks = await Utils.getBookmarks(currentVideoId);
        if (!bookmarks || bookmarks.length === 0) return;

        // Format: MM:SS - Note
        const text = bookmarks.map(b => `${Utils.formatTime(b.time)} - ${b.note || 'Bookmark'}`).join('\n');

        try {
            await navigator.clipboard.writeText(text);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅';
            setTimeout(() => copyBtn.textContent = originalText, 1000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard.');
        }
    });
  }

  async function renderBookmarks(videoId, tabId) {
    const bookmarks = await Utils.getBookmarks(videoId);
    listElement.innerHTML = '';

    if (!bookmarks || bookmarks.length === 0) {
        emptyState.textContent = 'No bookmarks yet.';
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    bookmarks.forEach(bookmark => {
        const item = document.createElement('div');
        item.className = 'bookmark-item';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'bookmark-time';
        timeSpan.textContent = Utils.formatTime(bookmark.time);
        timeSpan.title = 'Click to jump';

        // Play functionality
        timeSpan.addEventListener('click', () => {
            chrome.tabs.sendMessage(tabId, {
                type: 'JUMP_TO_TIMESTAMP',
                timestamp: bookmark.time
            }).catch(err => {
                console.log('Content script not ready or error:', err);
                // Retry or show error
            });
        });

        const noteSpan = document.createElement('span');
        noteSpan.className = 'bookmark-note';
        noteSpan.textContent = bookmark.note || 'Bookmark';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '✕'; // Using 'X' symbol
        deleteBtn.title = 'Delete';

        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Delete bookmark?')) {
                await Utils.removeBookmark(videoId, bookmark.id);
                renderBookmarks(videoId, tabId);
                // Notify content script
                chrome.tabs.sendMessage(tabId, {
                    type: 'REFRESH_BOOKMARKS'
                }).catch(err => console.log('Content script not ready', err));
            }
        });

        item.appendChild(timeSpan);
        item.appendChild(noteSpan);
        item.appendChild(deleteBtn);
        listElement.appendChild(item);
    });
  }

  initialize();
});
