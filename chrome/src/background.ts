// Background script for automatic sync
import { GoogleDriveAPI } from './google-drive-api';

// Make GoogleDriveAPI globally available
(self as any).GoogleDriveAPI = GoogleDriveAPI;

class BackgroundSyncManager {
    private autoSyncEnabled: boolean = false;
    private syncTimeout: ReturnType<typeof setTimeout> | null = null;
    private lastSyncTime: string | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        console.log('BSync background script installed');
        await this.loadSettings();
        this.setupEventListeners();
    }

    private async loadSettings(): Promise<void> {
        try {
            const result = await chrome.storage.local.get(['autoSyncEnabled', 'lastSyncTime', 'currentSession']);
            this.autoSyncEnabled = result['autoSyncEnabled'] || false;
            this.lastSyncTime = result['lastSyncTime'] || null;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    private async saveSettings(): Promise<void> {
        try {
            await chrome.storage.local.set({
                autoSyncEnabled: this.autoSyncEnabled,
                lastSyncTime: this.lastSyncTime
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    private debouncedSync(): void {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        this.syncTimeout = setTimeout(() => {
            this.performAutoSync();
        }, 2000); // Debounce for 2 seconds
    }

    private async performAutoSync(): Promise<void> {
        if (!this.autoSyncEnabled) return;

        try {
            // Get current session
            const result = await chrome.storage.local.get(['currentSession']);
            const currentSession = result['currentSession'] || 'default';
            const filename = currentSession === 'default' ? 'bsync-tabs.json' : `bsync-tabs-${currentSession}.json`;

            // Get tabs data
            const tabs = await chrome.tabs.query({});
            const tabData = tabs.map(tab => ({
                id: tab.id!,
                url: tab.url!,
                title: tab.title!,
                groupId: tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE ? tab.groupId : undefined,
                windowId: tab.windowId,
                index: tab.index,
                pinned: tab.pinned,
                active: tab.active,
                highlighted: tab.highlighted,
                audible: tab.audible,
                discarded: tab.discarded,
                autoDiscardable: tab.autoDiscardable,
                mutedInfo: tab.mutedInfo,
                favIconUrl: tab.favIconUrl,
                status: tab.status,
                incognito: tab.incognito,
                width: tab.width,
                height: tab.height,
                sessionId: tab.sessionId
            }));

            // Send to popup for saving
            chrome.runtime.sendMessage({
                action: 'autoSync',
                data: {
                    filename: filename,
                    tabs: {
                        tabs: tabData,
                        timestamp: new Date().toISOString()
                    }
                }
            });

            this.lastSyncTime = new Date().toISOString();
            await this.saveSettings();

        } catch (error) {
            console.error('Auto sync failed:', error);
        }
    }

    private setupEventListeners(): void {
        // Listen for tab events
        chrome.tabs.onCreated.addListener(() => {
            this.debouncedSync();
        });

        chrome.tabs.onRemoved.addListener(() => {
            this.debouncedSync();
        });

        chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
            if (changeInfo.url || changeInfo.title) {
                this.debouncedSync();
            }
        });

        chrome.tabs.onMoved.addListener(() => {
            this.debouncedSync();
        });

        chrome.tabs.onReplaced.addListener(() => {
            this.debouncedSync();
        });

        // Listen for tab group events
        chrome.tabGroups.onCreated.addListener(() => {
            this.debouncedSync();
        });

        chrome.tabGroups.onRemoved.addListener(() => {
            this.debouncedSync();
        });

        chrome.tabGroups.onUpdated.addListener(() => {
            this.debouncedSync();
        });

        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (message.action === 'setAutoSync') {
                this.autoSyncEnabled = message.enabled;
                this.saveSettings();
                sendResponse({ success: true });
            } else if (message.action === 'getAutoSyncStatus') {
                sendResponse({
                    enabled: this.autoSyncEnabled,
                    lastSyncTime: this.lastSyncTime
                });
            } else if (message.action === 'setCurrentSession') {
                chrome.storage.local.set({ currentSession: message.session });
                sendResponse({ success: true });
            }
            return true;
        });
    }
}

// Initialize background script
chrome.runtime.onInstalled.addListener(() => {
    new BackgroundSyncManager();
});
