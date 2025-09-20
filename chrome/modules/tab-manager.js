// Tab Manager Module
export class TabManager {
    constructor(optionsManager) {
        this.optionsManager = optionsManager;
    }

    async getTabsData() {
        const tabs = await chrome.tabs.query({});
        const groups = await chrome.tabGroups.query({});
        const groupCache = Object.assign({}, ...groups.map((group) => ({[group.id]: group.title})));
        
        return tabs
            .map(tab => ({ ...tab, groupName: groupCache[tab.groupId] }))
            .map(function(item) { 
                delete item.vivExtData;
                return item; 
            });
    }

    async getStats() {
        const tabs = await chrome.tabs.query({});
        const groups = await chrome.tabGroups.query({});
        
        return {
            tabsCount: tabs.length,
            groupsCount: groups.length
        };
    }

    async restoreTabs(savedTabs) {
        const options = this.optionsManager.getOptions();
        
        try {
            let targetWindow;
            
            if (options.newWindow) {
                // Create a new window
                targetWindow = await chrome.windows.create({
                    url: savedTabs[0]?.url || 'chrome://newtab/',
                    focused: true
                });
            } else {
                // Use current window
                targetWindow = await chrome.windows.getCurrent();
                
                // Close existing tabs if option is enabled
                if (options.closeExisting) {
                    const currentTabs = await chrome.tabs.query({ windowId: targetWindow.id });
                    for (const tab of currentTabs) {
                        await chrome.tabs.remove(tab.id);
                    }
                }
            }
            
            // Get current tabs after potential closing
            const currentTabs = await chrome.tabs.query({ windowId: targetWindow.id });
            const currentUrls = currentTabs.map(tab => tab.url);
            
            // Filter out tabs that are already open (if not closing existing)
            const tabsToOpen = options.closeExisting ? savedTabs : savedTabs.filter(savedTab => !currentUrls.includes(savedTab.url));
            
            if (tabsToOpen.length === 0 && !options.closeExisting) {
                return { success: true, message: "Todas las pestañas ya están abiertas", count: 0 };
            }
            
            // Open new tabs
            for (const tab of tabsToOpen) {
                await chrome.tabs.create({
                    windowId: targetWindow.id,
                    url: tab.url,
                    active: false
                });
            }

            // Restore tab groups if option is enabled
            if (options.preserveGroups) {
                const groups = savedTabs.filter(tab => tab.groupName);
                if (groups.length > 0) {
                    await this.restoreTabGroups(targetWindow.id, groups);
                }
            }

            const action = options.newWindow ? 'nueva ventana' : 'ventana actual';
            return { 
                success: true, 
                message: `${tabsToOpen.length} pestañas restauradas en ${action}`, 
                count: tabsToOpen.length 
            };
        } catch (error) {
            console.error("Error restoring tabs:", error);
            return { success: false, message: "Error al restaurar pestañas: " + error.message };
        }
    }

    async restoreTabGroups(windowId, tabsWithGroups) {
        try {
            const groupNames = [...new Set(tabsWithGroups.map(tab => tab.groupName))];
            
            for (const groupName of groupNames) {
                // Create the group
                const group = await chrome.tabGroups.create({
                    windowId: windowId,
                    title: groupName
                });

                // Get all tabs in this window
                const allTabs = await chrome.tabs.query({ windowId: windowId });
                
                // Find tabs that should be in this group
                const tabsToGroup = allTabs.filter(tab => {
                    const savedTab = tabsWithGroups.find(saved => saved.url === tab.url);
                    return savedTab && savedTab.groupName === groupName;
                });

                // Add tabs to the group
                for (const tab of tabsToGroup) {
                    await chrome.tabGroups.update(group.id, {
                        tabIds: [...(group.tabIds || []), tab.id]
                    });
                }
            }
        } catch (error) {
            console.error("Error restoring tab groups:", error);
        }
    }
}
