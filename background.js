// Background service worker for YouTube Music Mode

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTabId') {
        sendResponse({ tabId: sender.tab?.id });
        return true;
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.url?.includes('youtube.com')) return;

    const key = `musicMode_${tab.id}`;
    const result = await chrome.storage.session.get(key);
    const newState = !(result[key] || false);

    // Save state
    await chrome.storage.session.set({ [key]: newState });

    // Update icon status
    updateBadge(tab.id, newState);

    // Notify content script
    try {
        await chrome.tabs.sendMessage(tab.id, {
            action: 'toggleMusicMode',
            enabled: newState
        });
    } catch (error) {
        // Content script might not be ready, let it handle initial state check
    }
});

function updateBadge(tabId, enabled) {
    if (enabled) {
        chrome.action.setBadgeText({ tabId, text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#f00' });
    } else {
        chrome.action.setBadgeText({ tabId, text: '' });
    }
}

// Clean up storage when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.session.remove(`musicMode_${tabId}`);
});

// Handle navigation to update badge on load/refresh
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com')) {
        const key = `musicMode_${tabId}`;
        const result = await chrome.storage.session.get(key);
        if (result[key]) {
            updateBadge(tabId, true);

            // Safety: ensure content script is in sync
            try {
                chrome.tabs.sendMessage(tabId, {
                    action: 'toggleMusicMode',
                    enabled: true
                });
            } catch (e) {
                // Content script might not be initialized yet
            }
        }
    }
});
