// YouTube Music Mode Content Script

(function () {
    'use strict';

    let musicModeEnabled = false;
    let videoVisible = false;

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleMusicMode') {
            musicModeEnabled = request.enabled;
            if (musicModeEnabled) {
                enableMusicMode();
            } else {
                disableMusicMode();
            }
            sendResponse({ success: true });
        }
        return true;
    });

    function enableMusicMode() {
        document.documentElement.classList.add('yt-music-mode');
        document.documentElement.classList.add('yt-video-hidden');
        document.documentElement.classList.remove('yt-video-visible');
        videoVisible = false;

        setLowestQuality();
        injectVideoToggleButton();

        // Re-apply quality when video changes (YouTube SPA navigation)
        observeVideoChanges();
    }

    function disableMusicMode() {
        document.documentElement.classList.remove('yt-music-mode');
        document.documentElement.classList.remove('yt-video-hidden');
        document.documentElement.classList.remove('yt-video-visible');
        removeVideoToggleButton();

        if (qualityObserver) {
            qualityObserver.disconnect();
            qualityObserver = null;
        }
    }

    function injectVideoToggleButton() {
        // Remove existing button if any
        removeVideoToggleButton();

        // Target the video title header
        const titleH1 = document.querySelector('ytd-watch-metadata #title h1') ||
            document.querySelector('#title h1') ||
            document.querySelector('h1.ytd-watch-metadata');

        if (!titleH1) {
            // Retry if title not loaded yet
            setTimeout(injectVideoToggleButton, 500);
            return;
        }

        // Create toggle container
        const toggleContainer = document.createElement('div');
        toggleContainer.id = 'yt-music-mode-toggle-container';

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'yt-music-mode-video-toggle';
        toggleBtn.innerHTML = '<span class="toggle-icon">👁️</span> <span class="toggle-text">Show Video</span>';

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            videoVisible = !videoVisible;
            updateVideoVisibility();
        });

        toggleContainer.appendChild(toggleBtn);

        // Insert after the title h1 (in the flow of the title)
        titleH1.after(toggleContainer);
    }

    function removeVideoToggleButton() {
        const existing = document.getElementById('yt-music-mode-toggle-container');
        if (existing) {
            existing.remove();
        }
    }

    function updateVideoVisibility() {
        const toggleBtn = document.getElementById('yt-music-mode-video-toggle');

        if (videoVisible) {
            document.documentElement.classList.remove('yt-video-hidden');
            document.documentElement.classList.add('yt-video-visible');
            if (toggleBtn) {
                toggleBtn.classList.add('video-visible');
                toggleBtn.innerHTML = '<span class="toggle-icon">👁️</span> <span class="toggle-text">Hide Video</span>';
            }
        } else {
            document.documentElement.classList.add('yt-video-hidden');
            document.documentElement.classList.remove('yt-video-visible');
            if (toggleBtn) {
                toggleBtn.classList.remove('video-visible');
                toggleBtn.innerHTML = '<span class="toggle-icon">👁️</span> <span class="toggle-text">Show Video</span>';
            }
        }
    }

    // Set video quality to lowest available (144p or 240p)
    function setLowestQuality() {
        const video = document.querySelector('video');
        if (!video) {
            // Video not loaded yet, retry
            setTimeout(setLowestQuality, 500);
            return;
        }

        // Try to access YouTube's player API
        const player = document.getElementById('movie_player');
        if (player && typeof player.setPlaybackQualityRange === 'function') {
            // Get available quality levels
            const qualities = player.getAvailableQualityLevels?.() || [];

            // Find lowest quality (tiny = 144p, small = 240p)
            const lowestQuality = qualities.includes('tiny') ? 'tiny' :
                qualities.includes('small') ? 'small' :
                    qualities[qualities.length - 1];

            if (lowestQuality) {
                player.setPlaybackQualityRange(lowestQuality, lowestQuality);
            }
        } else {
            // Player API not ready, try using settings menu
            setQualityViaMenu();
        }
    }

    // Fallback: Set quality via YouTube's settings menu
    function setQualityViaMenu() {
        // Try again after a delay if player isn't ready
        const player = document.getElementById('movie_player');
        if (!player) {
            setTimeout(setQualityViaMenu, 1000);
            return;
        }

        // Wait for player to be fully initialized
        setTimeout(() => {
            try {
                // Open settings
                const settingsBtn = document.querySelector('.ytp-settings-button');
                if (settingsBtn) {
                    settingsBtn.click();

                    setTimeout(() => {
                        // Find and click Quality option
                        const menuItems = document.querySelectorAll('.ytp-menuitem');
                        for (const item of menuItems) {
                            if (item.textContent.includes('Quality') || item.textContent.includes('quality')) {
                                item.click();

                                setTimeout(() => {
                                    // Click the second-last item (usually lowest, because the last item is 'Auto')
                                    const qualityItems = document.querySelectorAll('.ytp-menuitem');
                                    if (qualityItems.length > 0) {
                                        qualityItems[qualityItems.length - 2].click();
                                    }
                                }, 600);

                                return;
                            }
                        }
                        // Close menu if Quality option not found
                        settingsBtn.click();
                    }, 200);
                }
            } catch (e) {
                console.log('Music Mode: Could not set quality automatically');
            }
        }, 500);
    }

    // Observe for video changes (YouTube SPA navigation)
    let qualityObserver = null;

    function observeVideoChanges() {
        if (qualityObserver) return;

        qualityObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const hasVideoChange = Array.from(mutation.addedNodes).some(
                        node => node.nodeName === 'VIDEO' ||
                            (node.querySelector && node.querySelector('video'))
                    );
                    if (hasVideoChange && musicModeEnabled) {
                        setTimeout(setLowestQuality, 1000);
                    }
                }
            }
        });

        qualityObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also observe URL changes for SPA navigation
        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                if (musicModeEnabled) {
                    setTimeout(setLowestQuality, 1500);
                }
            }
        }).observe(document.body, { subtree: true, childList: true });
    }

    // Check if music mode should be enabled on page load
    async function checkInitialState() {
        try {
            // Get tab ID from background context
            const response = await chrome.runtime.sendMessage({ action: 'getTabId' });
            if (response?.tabId) {
                const key = `musicMode_${response.tabId}`;
                const result = await chrome.storage.session.get(key);
                if (result[key]) {
                    musicModeEnabled = true;
                    enableMusicMode();
                }
            }
        } catch (e) {
            // Extension context might not be available
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkInitialState);
    } else {
        checkInitialState();
    }
})();
