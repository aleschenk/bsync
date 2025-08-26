// Background script for automatic sync
let autoSyncEnabled = false;
let syncTimeout = null;
let lastSyncTime = null;

// Initialize background script
chrome.runtime.onInstalled.addListener(() => {
    console.log('BSync background script installed');
    loadSettings();
});

// Load settings from storage
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['autoSyncEnabled', 'lastSyncTime']);
        autoSyncEnabled = result.autoSyncEnabled || false;
        lastSyncTime = result.lastSyncTime || null;
        console.log('Settings loaded:', { autoSyncEnabled, lastSyncTime });
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save settings to storage
async function saveSettings() {
    try {
        await chrome.storage.local.set({
            autoSyncEnabled: autoSyncEnabled,
            lastSyncTime: lastSyncTime
        });
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Debounced sync function
function debouncedSync() {
    if (syncTimeout) {
        clearTimeout(syncTimeout);
    }
    
    syncTimeout = setTimeout(async () => {
        if (autoSyncEnabled) {
            await performAutoSync();
        }
    }, 2000); // Wait 2 seconds after last change
}

// Perform automatic sync
async function performAutoSync() {
    try {
        console.log('Performing automatic sync...');
        
        // Get current session
        const sessionResult = await chrome.storage.local.get(['currentSession']);
        const currentSession = sessionResult.currentSession || 'default';
        
        // Get all tabs
        const tabs = await chrome.tabs.query({});
        const groups = await chrome.tabGroups.query({});
        const groupCache = Object.assign({}, ...groups.map((group) => ({[group.id]: group.title})));
        
        const normalizedTabs = tabs
            .map(tab => ({ ...tab, groupName: groupCache[tab.groupId] }))
            .map(function(item) { 
                delete item.vivExtData;
                return item; 
            });

        // Save to Google Drive
        const filename = currentSession === 'default' ? 'bsync-tabs.json' : `bsync-tabs-${currentSession}.json`;
        
        // Use chrome.runtime.sendMessage to communicate with popup
        chrome.runtime.sendMessage({
            action: 'autoSync',
            data: {
                filename: filename,
                tabs: normalizedTabs
            }
        });
        
        lastSyncTime = new Date().toISOString();
        await saveSettings();
        
        console.log('Automatic sync completed');
    } catch (error) {
        console.error('Error during automatic sync:', error);
    }
}

// Listen for tab events
chrome.tabs.onCreated.addListener(() => {
    if (autoSyncEnabled) {
        debouncedSync();
    }
});

chrome.tabs.onRemoved.addListener(() => {
    if (autoSyncEnabled) {
        debouncedSync();
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (autoSyncEnabled && changeInfo.url) {
        debouncedSync();
    }
});

chrome.tabs.onMoved.addListener(() => {
    if (autoSyncEnabled) {
        debouncedSync();
    }
});

chrome.tabs.onReplaced.addListener(() => {
    if (autoSyncEnabled) {
        debouncedSync();
    }
});

// Listen for tab group events
chrome.tabGroups.onCreated.addListener(() => {
    if (autoSyncEnabled) {
        debouncedSync();
    }
});

chrome.tabGroups.onRemoved.addListener(() => {
    if (autoSyncEnabled) {
        debouncedSync();
    }
});

chrome.tabGroups.onUpdated.addListener(() => {
    if (autoSyncEnabled) {
        debouncedSync();
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setAutoSync') {
        autoSyncEnabled = message.enabled;
        saveSettings();
        sendResponse({ success: true });
    } else if (message.action === 'getAutoSyncStatus') {
        sendResponse({ 
            enabled: autoSyncEnabled, 
            lastSyncTime: lastSyncTime 
        });
    } else if (message.action === 'setCurrentSession') {
        chrome.storage.local.set({ currentSession: message.session });
        sendResponse({ success: true });
    }
    return true;
});
