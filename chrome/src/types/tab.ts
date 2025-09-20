// Tab Types
export interface TabData {
  id: number;
  url: string;
  title: string;
  groupId?: number | undefined;
  windowId: number;
  index: number;
  pinned?: boolean;
  active?: boolean;
  highlighted?: boolean;
  audible?: boolean | undefined;
  discarded?: boolean;
  autoDiscardable?: boolean;
  mutedInfo?: chrome.tabs.MutedInfo | undefined;
  favIconUrl?: string | undefined;
  status?: string | undefined;
  incognito?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
  sessionId?: string | undefined;
}

export interface TabGroup {
  id: number;
  title: string;
  color: chrome.tabGroups.ColorEnum;
  collapsed: boolean;
  windowId: number;
}

export interface TabStats {
  tabsCount: number;
  groupsCount: number;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  tabsCreated?: number;
  groupsCreated?: number;
}
