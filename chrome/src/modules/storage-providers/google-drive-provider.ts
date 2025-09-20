// Google Drive Storage Provider
import { BaseStorageProvider } from './base-storage-provider';
import { StorageConfig, SessionData } from '../../types';

// GoogleDriveAPI está declarado globalmente en global.d.ts

export class GoogleDriveProvider extends BaseStorageProvider {
    private driveAPI: GoogleDriveAPI;

    constructor(config: StorageConfig = {}) {
        super(config);
        this.driveAPI = new GoogleDriveAPI();
    }

    async authenticate(): Promise<boolean> {
        return await this.driveAPI.authenticate();
    }

    async saveData(filename: string, data: SessionData): Promise<boolean> {
        return await this.driveAPI.saveToDrive(filename, data);
    }

    async loadData(filename: string): Promise<SessionData> {
        return await this.driveAPI.loadFromDrive(filename);
    }

    async deleteData(filename: string): Promise<boolean> {
        return await this.driveAPI.deleteFile(filename);
    }

    async getAllSessions(): Promise<string[]> {
        try {
            const sessionsData = await this.driveAPI.loadFromDrive('bsync-sessions.json');
            return sessionsData.sessions || ['default'];
        } catch (error) {
            console.log('No sessions file found, using default');
            return ['default'];
        }
    }

    async saveSessions(sessions: string[], currentSession: string): Promise<boolean> {
        const sessionsData: SessionData = {
            sessions: sessions,
            currentSession: currentSession,
            tabs: [],
            timestamp: new Date().toISOString()
        };
        return await this.driveAPI.saveToDrive('bsync-sessions.json', sessionsData);
    }

    getProviderName(): string {
        return 'Google Drive';
    }
}
