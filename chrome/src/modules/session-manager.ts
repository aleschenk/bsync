// Session Manager Module
import { StorageManager } from './storage-manager';

export class SessionManager {
    private storageManager: StorageManager;
    private currentSession: string = 'default';
    private sessions: string[] = ['default'];

    constructor(storageManager: StorageManager) {
        this.storageManager = storageManager;
    }

    async loadSessions(): Promise<boolean> {
        try {
            if (this.storageManager.getStorageType() === 'google-drive') {
                const sessionsData = await this.storageManager.loadData('bsync-sessions.json');
                this.sessions = sessionsData.sessions || ['default'];
                this.currentSession = sessionsData.currentSession || 'default';
            } else {
                // Para BSync server, obtenemos las sesiones del servidor
                this.sessions = await this.storageManager.getAllSessions();
                this.currentSession = this.sessions[0] || 'default';
            }
            return true;
        } catch (error) {
            console.log('No sessions file found, using default');
            this.sessions = ['default'];
            this.currentSession = 'default';
            return false;
        }
    }

    async saveSessions(): Promise<boolean> {
        try {
            await this.storageManager.saveSessions(this.sessions, this.currentSession);
            return true;
        } catch (error) {
            console.error('Error saving sessions:', error);
            return false;
        }
    }

    async createSession(sessionName: string): Promise<boolean> {
        if (this.sessions.includes(sessionName)) {
            throw new Error('Session already exists');
        }
        
        this.sessions.push(sessionName);
        this.currentSession = sessionName;
        await this.saveSessions();
        return true;
    }

    async deleteSession(sessionName: string): Promise<boolean> {
        if (sessionName === 'default') {
            throw new Error('Cannot delete default session');
        }
        
        this.sessions = this.sessions.filter(s => s !== sessionName);
        this.currentSession = 'default';
        await this.saveSessions();
        
        // Try to delete the session file
        try {
            const filename = sessionName === 'default' ? 'bsync-tabs.json' : `bsync-tabs-${sessionName}.json`;
            await this.storageManager.deleteData(filename);
        } catch (error) {
            console.log('Session file not found or already deleted');
        }
        
        return true;
    }

    setCurrentSession(sessionName: string): Promise<boolean> {
        this.currentSession = sessionName;
        return this.saveSessions();
    }

    getCurrentSession(): string {
        return this.currentSession;
    }

    getSessions(): string[] {
        return [...this.sessions];
    }

    getSessionFilename(): string {
        return this.currentSession === 'default' ? 'bsync-tabs.json' : `bsync-tabs-${this.currentSession}.json`;
    }
}
