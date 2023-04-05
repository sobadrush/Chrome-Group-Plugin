console.log('background.js called...');

// 監聽 tab close
chrome.tabs.onRemoved.addListener((tabid, removed) => {
    console.log('tab closed');
});

// 監聽 tab windows close
chrome.windows.onRemoved.addListener((windowid) => {
    console.log('window closed');
});
