// Tab Manager Module
import { TabData, TabStats, RestoreResult } from '../types';
import { OptionsManager } from './options-manager';

export class TabManager {
    private optionsManager: OptionsManager;

    constructor(optionsManager: OptionsManager) {
        this.optionsManager = optionsManager;
    }

    async getTabsData(): Promise<TabData[]> {
        const tabs = await chrome.tabs.query({});
        return tabs.map(tab => ({
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
    }

    async getStats(): Promise<TabStats> {
        const tabs = await chrome.tabs.query({});
        const groups = await chrome.tabGroups.query({});
        
        return {
            tabsCount: tabs.length,
            groupsCount: groups.length
        };
    }

    async restoreTabs(savedTabs: TabData[]): Promise<RestoreResult> {
        const options = this.optionsManager.getOptions();
        
        try {
            if (options.closeExisting) {
                const currentTabs = await chrome.tabs.query({});
                const tabsToClose = currentTabs.filter(tab => !tab.pinned);
                if (tabsToClose.length > 0) {
                    await chrome.tabs.remove(tabsToClose.map(tab => tab.id!));
                }
            }

            let windowId: number;
            if (options.newWindow) {
                const newWindow = await chrome.windows.create({});
                windowId = newWindow.id!;
            } else {
                const currentWindow = await chrome.windows.getCurrent();
                windowId = currentWindow.id!;
            }

            const tabsWithGroups = savedTabs.filter(tab => tab.groupId !== undefined);
            const tabsWithoutGroups = savedTabs.filter(tab => tab.groupId === undefined);

            // Crear pestañas sin grupos primero
            const createdTabs: chrome.tabs.Tab[] = [];
            for (const tabData of tabsWithoutGroups) {
                const tab = await chrome.tabs.create({
                    url: tabData.url,
                    windowId: windowId,
                    active: false,
                    pinned: tabData.pinned
                });
                createdTabs.push(tab);
            }

            // Crear pestañas con grupos
            for (const tabData of tabsWithGroups) {
                const tab = await chrome.tabs.create({
                    url: tabData.url,
                    windowId: windowId,
                    active: false,
                    pinned: tabData.pinned
                });
                createdTabs.push(tab);
            }

            // Restaurar grupos si está habilitado
            if (options.preserveGroups && tabsWithGroups.length > 0) {
                await this.restoreTabGroups(windowId, tabsWithGroups);
            }

            return {
                success: true,
                message: `${createdTabs.length} pestañas restauradas exitosamente`,
                tabsCreated: createdTabs.length
            };

        } catch (error) {
            console.error('Error restoring tabs:', error);
            return {
                success: false,
                message: `Error al restaurar pestañas: ${error instanceof Error ? error.message : 'Error desconocido'}`
            };
        }
    }

    private async restoreTabGroups(_windowId: number, tabsWithGroups: TabData[]): Promise<void> {
        const groupMap = new Map<number, TabData[]>();
        
        // Agrupar pestañas por groupId
        for (const tab of tabsWithGroups) {
            if (tab.groupId !== undefined) {
                if (!groupMap.has(tab.groupId)) {
                    groupMap.set(tab.groupId, []);
                }
                groupMap.get(tab.groupId)!.push(tab);
            }
        }

        // Crear grupos
        for (const [groupId, tabs] of groupMap) {
            try {
                // Note: chrome.tabGroups.group() no existe en la API actual
                // Por ahora solo logueamos que se intentó crear el grupo
                console.log(`Intentando crear grupo para ${tabs.length} pestañas`);
            } catch (error) {
                console.error(`Error creando grupo ${groupId}:`, error);
            }
        }
    }
}
