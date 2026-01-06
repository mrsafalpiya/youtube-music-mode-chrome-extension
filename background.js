// Background service worker for YouTube Music Mode

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTabId') {
        sendResponse({ tabId: sender.tab?.id });
        return true;
    }
});

// Clean up storage when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.session.remove(`musicMode_${tabId}`);
});
