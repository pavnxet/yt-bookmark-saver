const assert = require('assert');
const Utils = require('../js/utils.js');

// Mock chrome
global.chrome = {
    storage: {
        sync: {
            data: {},
            get: function(keys, callback) {
                const result = {};
                keys.forEach(key => {
                    result[key] = this.data[key];
                });
                // Simulate async callback
                setTimeout(() => callback(result), 0);
            },
            set: function(items, callback) {
                Object.assign(this.data, items);
                setTimeout(() => callback(), 0);
            }
        }
    },
    runtime: {
        lastError: null
    }
};

// Test formatTime
console.log('Testing formatTime...');
assert.strictEqual(Utils.formatTime(0), '00:00');
assert.strictEqual(Utils.formatTime(61), '01:01');
assert.strictEqual(Utils.formatTime(3600), '1:00:00');
assert.strictEqual(Utils.formatTime(3661), '1:01:01');
console.log('formatTime passed!');

// Test storage
(async function() {
    console.log('Testing storage...');
    const videoId = 'testVideo';

    // Test empty
    let bookmarks = await Utils.getBookmarks(videoId);
    assert.deepStrictEqual(bookmarks, []);

    // Test add
    await Utils.addBookmark(videoId, 10, 'Note 1');
    bookmarks = await Utils.getBookmarks(videoId);
    assert.strictEqual(bookmarks.length, 1);
    assert.strictEqual(bookmarks[0].time, 10);

    // Test add another (sorted)
    await Utils.addBookmark(videoId, 5, 'Note 2');
    bookmarks = await Utils.getBookmarks(videoId);
    assert.strictEqual(bookmarks.length, 2);
    assert.strictEqual(bookmarks[0].time, 5);
    assert.strictEqual(bookmarks[1].time, 10);

    // Test remove
    const idToRemove = bookmarks[0].id;
    await Utils.removeBookmark(videoId, idToRemove);
    bookmarks = await Utils.getBookmarks(videoId);
    assert.strictEqual(bookmarks.length, 1);
    assert.strictEqual(bookmarks[0].time, 10);

    console.log('storage passed!');
})().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
