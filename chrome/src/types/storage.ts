// Storage Types
import { TabData, TabGroup } from './tab';

export type StorageType = 'google-drive' | 'bsync-server';

export interface StorageConfig {
  serverUrl?: string;
  accountId?: string;
  [key: string]: any;
}

export interface StorageProvider {
  authenticate(): Promise<boolean>;
  saveData(filename: string, data: SessionData): Promise<boolean>;
  loadData(filename: string): Promise<SessionData>;
  deleteData(filename: string): Promise<boolean>;
  getAllSessions(): Promise<string[]>;
  getProviderName(): string;
  testConnection?(): Promise<boolean>;
}

export interface SessionData {
  tabs: TabData[];
  groups?: TabGroup[];
  timestamp?: string;
  sessions?: string[];
  currentSession?: string;
}
