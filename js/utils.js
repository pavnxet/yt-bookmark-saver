(function(global) {
  const Utils = {
    /**
     * Formats seconds into HH:MM:SS or MM:SS
     * @param {number} seconds
     * @returns {string}
     */
    formatTime: function(seconds) {
      seconds = Math.floor(seconds);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);

      const mStr = m.toString().padStart(2, '0');
      const sStr = s.toString().padStart(2, '0');

      if (h > 0) {
        // If hours exist, show H:MM:SS (YouTube style usually doesn't pad hour if < 10, but let's pad for consistency or check)
        // YouTube: 1:02:30.
        const hStr = h.toString();
        return `${hStr}:${mStr}:${sStr}`;
      } else {
        return `${mStr}:${sStr}`;
      }
    },

    /**
     * Get bookmarks for a video ID
     * @param {string} videoId
     * @returns {Promise<Array>}
     */
    getBookmarks: function(videoId) {
      return new Promise((resolve, reject) => {
        if (typeof chrome === 'undefined' || !chrome.storage) {
            // If chrome storage is not available (e.g. testing), return empty or reject?
            // For testing purposes, we might want to mock it.
            // But in production, this should fail.
            // We'll assume the caller handles it or we mock chrome in tests.
            reject('chrome.storage not available');
            return;
        }
        chrome.storage.sync.get([videoId], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result[videoId] || []);
          }
        });
      });
    },

    /**
     * Add a bookmark
     * @param {string} videoId
     * @param {number} time
     * @param {string} note
     * @returns {Promise<Array>}
     */
    addBookmark: async function(videoId, time, note = '') {
        const bookmarks = await this.getBookmarks(videoId);
        const newBookmark = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // unique ID
            time: time,
            note: note,
            createdAt: Date.now()
        };
        bookmarks.push(newBookmark);
        // Sort by time
        bookmarks.sort((a, b) => a.time - b.time);

        return new Promise((resolve, reject) => {
            chrome.storage.sync.set({ [videoId]: bookmarks }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(bookmarks);
                }
            });
        });
    },

    /**
     * Remove a bookmark
     * @param {string} videoId
     * @param {string} bookmarkId
     */
    removeBookmark: async function(videoId, bookmarkId) {
        let bookmarks = await this.getBookmarks(videoId);
        bookmarks = bookmarks.filter(b => b.id !== bookmarkId);

        return new Promise((resolve, reject) => {
            chrome.storage.sync.set({ [videoId]: bookmarks }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(bookmarks);
                }
            });
        });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
  } else {
    global.YTBookmarkUtils = Utils;
  }
})(typeof window !== 'undefined' ? window : this);
