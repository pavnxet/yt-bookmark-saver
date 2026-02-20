# YouTube Timestamp Bookmarker

A robust, privacy-focused extension for Chrome and Brave that allows you to save, manage, and export timestamps directly from the YouTube interface.

## Features

-   **Bookmark Timestamps:** Add bookmarks with a single click or keyboard shortcut (`Alt+B`).
-   **Visual Dots:** See your bookmarks as dots directly on the YouTube progress bar.
-   **Quick Navigation:** Click a dot or use the popup list to jump to a specific time.
-   **Data Persistence:** Bookmarks are saved securely using your browser's sync storage (syncs across devices if enabled).
-   **Export:** Copy all bookmarks for a video to your clipboard in a "Chapter" format (e.g., `01:23 - Key Moment`).
-   **Brave Optimized:** Built with privacy in mind, using local assets and stateless background workers to comply with Brave Shields.
-   **In-Page Debugging:** Includes a built-in logger to diagnose issues without opening DevTools.

## Installation

This extension is currently in developer mode (unpacked).

1.  **Clone or Download** this repository to your local machine.
2.  Open your browser (Chrome or Brave).
3.  Navigate to `chrome://extensions`.
4.  Enable **Developer mode** (toggle in the top-right corner).
5.  Click **Load unpacked**.
6.  Select the directory where you saved this project.

## Usage

### Adding a Bookmark
*   **Button:** Click the "Bookmark" icon (flag symbol) added to the YouTube player controls (next to the volume/time).
*   **Shortcut:** Press `Alt + B` on your keyboard while watching a video.

### Managing Bookmarks
1.  Click the extension icon in your browser toolbar to open the **Popup**.
2.  You will see a list of bookmarks for the current video.
3.  **Play:** Click the timestamp (e.g., `04:20`) to jump the video to that time.
4.  **Delete:** Click the `✕` button next to a bookmark to remove it.
5.  **Copy All:** Click the clipboard icon (📋) in the popup header to copy all timestamps to your clipboard.

### Debugging
If the extension isn't working as expected (e.g., buttons not appearing):
1.  Look for the floating **🐛 Logs** button in the bottom-right corner of the YouTube page.
2.  Click it to open the debug window.
3.  You can drag the window around and view real-time logs of what the extension is doing (e.g., "Player controls found", "Bookmark added").
4.  Use the **🚫** button to clear logs or **✕** to close the window.

## Privacy & Permissions

*   **Storage:** Used to save your bookmarks locally/synced.
*   **Tabs/Scripting:** Used to detect YouTube navigation and inject the interface.
*   **Host Permissions:** Restricts the extension to run only on `*.youtube.com`.

No data is sent to external servers.

## Development

*   **Logic:** `js/content.js` handles the UI injection and interaction. `js/utils.js` handles storage and formatting.
*   **Performance:** The extension uses a lightweight polling mechanism (1s interval) to detect the player, minimizing CPU usage compared to heavy DOM observers.
