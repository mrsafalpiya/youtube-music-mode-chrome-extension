document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('musicModeToggle');
  const status = document.getElementById('status');
  const statusText = status.querySelector('.status-text');

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Check if we're on YouTube
  if (!tab.url?.includes('youtube.com')) {
    toggle.disabled = true;
    statusText.textContent = 'Not on YouTube';
    return;
  }

  // Get current state for this tab
  const key = `musicMode_${tab.id}`;
  const result = await chrome.storage.session.get(key);
  const isActive = result[key] || false;
  
  toggle.checked = isActive;
  updateStatus(isActive);

  // Handle toggle
  toggle.addEventListener('change', async () => {
    const enabled = toggle.checked;
    
    // Store state for this tab
    await chrome.storage.session.set({ [key]: enabled });
    
    // Send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggleMusicMode',
        enabled: enabled
      });
    } catch (error) {
      // Content script might not be loaded, inject it
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['music-mode.css']
      });
      // Try again
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggleMusicMode',
        enabled: enabled
      });
    }
    
    updateStatus(enabled);
  });

  function updateStatus(active) {
    if (active) {
      status.classList.add('active');
      statusText.textContent = 'Active';
    } else {
      status.classList.remove('active');
      statusText.textContent = 'Inactive';
    }
  }
});
