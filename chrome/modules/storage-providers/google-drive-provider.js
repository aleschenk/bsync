// Google Drive Storage Provider
import { BaseStorageProvider } from './base-storage-provider.js';

export class GoogleDriveProvider extends BaseStorageProvider {
    constructor(config = {}) {
        super(config);
        this.driveAPI = new GoogleDriveAPI();
    }

    async authenticate() {
        return await this.driveAPI.authenticate();
    }

    async saveData(filename, data) {
        return await this.driveAPI.saveToDrive(filename, data);
    }

    async loadData(filename) {
        return await this.driveAPI.loadFromDrive(filename);
    }

    async deleteData(filename) {
        return await this.driveAPI.deleteFile(filename);
    }

    async getAllSessions() {
        try {
            const sessionsData = await this.driveAPI.loadFromDrive('bsync-sessions.json');
            return sessionsData.sessions || ['default'];
        } catch (error) {
            console.log('No sessions file found, using default');
            return ['default'];
        }
    }

    async saveSessions(sessions, currentSession) {
        const sessionsData = {
            sessions: sessions,
            currentSession: currentSession
        };
        return await this.driveAPI.saveToDrive('bsync-sessions.json', sessionsData);
    }

    getProviderName() {
        return 'Google Drive';
    }
}
